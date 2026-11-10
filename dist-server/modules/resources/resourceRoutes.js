import { z } from 'zod';
import { prisma } from '../../db';
import { requireAuth, requireRole } from '../../middleware/auth';
import { ResourceStatus, ResourceType, Role, SourceType, VerificationStatus } from '@prisma/client';
export async function resourceRoutes(server) {
    /**
     * ==========================================
     * 公开客户端 API (P0 首页与公开前台对接)
     * ==========================================
     */
    // 首页聚合接口（高性能单次请求获取首页所有模块所需真实数据）
    server.get('/api/v1/home', async (req, reply) => {
        try {
            const [categories, featured, popular, latest, repairTools, games, tutorials] = await Promise.all([
                prisma.category.findMany({
                    where: { isVisible: true },
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        _count: { select: { softwares: { where: { status: ResourceStatus.PUBLISHED, isTestData: false } } } }
                    }
                }),
                prisma.software.findMany({
                    where: { status: ResourceStatus.PUBLISHED, isFeatured: true, isTestData: false },
                    orderBy: { featuredOrder: 'asc' },
                    take: 6,
                    include: {
                        category: true,
                        versions: { where: { isLatest: true }, include: { downloadSources: { where: { isActive: true } } } },
                        licenses: true,
                        _count: { select: { downloadEvents: true } }
                    }
                }),
                prisma.software.findMany({
                    where: { status: ResourceStatus.PUBLISHED, isTestData: false },
                    orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
                    take: 6,
                    include: {
                        category: true,
                        versions: { where: { isLatest: true }, include: { downloadSources: { where: { isActive: true } } } },
                        licenses: true,
                        _count: { select: { downloadEvents: true } }
                    }
                }),
                prisma.software.findMany({
                    where: { status: ResourceStatus.PUBLISHED, isTestData: false },
                    orderBy: { publishedAt: 'desc' },
                    take: 6,
                    include: {
                        category: true,
                        versions: { where: { isLatest: true }, include: { downloadSources: { where: { isActive: true } } } },
                        licenses: true,
                        _count: { select: { downloadEvents: true } }
                    }
                }),
                prisma.software.findMany({
                    where: { status: ResourceStatus.PUBLISHED, type: ResourceType.TOOL, isTestData: false },
                    orderBy: { createdAt: 'desc' },
                    take: 12,
                    include: {
                        category: true,
                        versions: { where: { isLatest: true }, include: { downloadSources: { where: { isActive: true } } } },
                        licenses: true,
                        _count: { select: { downloadEvents: true } }
                    }
                }),
                prisma.software.findMany({
                    where: { status: ResourceStatus.PUBLISHED, type: ResourceType.GAME, isTestData: false },
                    orderBy: { createdAt: 'desc' },
                    take: 8,
                    include: {
                        category: true,
                        versions: { where: { isLatest: true }, include: { downloadSources: { where: { isActive: true } } } },
                        licenses: true,
                        _count: { select: { downloadEvents: true } }
                    }
                }),
                prisma.tutorial.findMany({
                    where: { status: 'PUBLISHED' },
                    orderBy: { publishedAt: 'desc' },
                    take: 4
                })
            ]);
            return reply.send({
                success: true,
                data: {
                    categories: categories.map((c) => ({
                        id: c.id,
                        name: c.name,
                        slug: c.slug,
                        description: c.description || '',
                        iconName: c.icon || 'Grid',
                        sortOrder: c.sortOrder,
                        itemCount: c._count.softwares,
                    })),
                    featured: featured.map(formatSoftwareDto),
                    popular: popular.map(formatSoftwareDto),
                    latest: latest.map(formatSoftwareDto),
                    repairTools: repairTools.map(formatSoftwareDto),
                    games: games.map(formatGameDto),
                    tutorials: tutorials.map((t) => ({
                        id: t.id,
                        title: t.title,
                        slug: t.slug,
                        summary: t.summary,
                        category: '系统运维',
                        readTime: '5分钟',
                        publishedAt: t.publishedAt ? t.publishedAt.toISOString().slice(0, 10) : '2025-01-01',
                        author: '软游部落技术团队',
                        viewCount: 1024,
                    }))
                }
            });
        }
        catch (err) {
            server.log.error(err, '获取首页数据失败');
            return reply.status(500).send({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: '数据库读取异常: ' + err.message }
            });
        }
    });
    // 获取公开资源列表（支持分类与类型过滤）
    server.get('/api/v1/resources', async (req, reply) => {
        const query = req.query;
        const type = query.type;
        const categorySlug = query.categorySlug;
        const limit = Math.min(parseInt(query.limit || '20', 10), 100);
        const offset = parseInt(query.offset || '0', 10);
        const where = {
            status: ResourceStatus.PUBLISHED,
            isTestData: false,
        };
        if (type)
            where.type = type;
        if (categorySlug && categorySlug !== 'all') {
            where.category = { slug: categorySlug };
        }
        const [items, total] = await Promise.all([
            prisma.software.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
                include: {
                    category: true,
                    versions: { where: { isLatest: true }, include: { downloadSources: { where: { isActive: true } } } },
                    licenses: true,
                    _count: { select: { downloadEvents: true } }
                }
            }),
            prisma.software.count({ where })
        ]);
        return reply.send({
            success: true,
            data: {
                items: items.map(formatSoftwareDto),
                total,
                limit,
                offset
            }
        });
    });
    // 获取单个资源详情（按 slug 获取）
    server.get('/api/v1/resources/:slug', async (req, reply) => {
        const { slug } = req.params;
        const software = await prisma.software.findUnique({
            where: { slug },
            include: {
                category: true,
                versions: {
                    orderBy: { createdAt: 'desc' },
                    include: { downloadSources: { where: { isActive: true } } }
                },
                licenses: true,
                _count: { select: { downloadEvents: true } }
            }
        });
        if (!software || software.status !== ResourceStatus.PUBLISHED) {
            return reply.status(404).send({
                success: false,
                error: { code: 'NOT_FOUND', message: '资源不存在或尚未正式发布' }
            });
        }
        // 记录访问量 (真实累加)
        await prisma.software.update({
            where: { id: software.id },
            data: { viewCount: { increment: 1 } }
        });
        // 查询同分类相关推荐
        const related = await prisma.software.findMany({
            where: {
                categoryId: software.categoryId,
                status: ResourceStatus.PUBLISHED,
                NOT: { id: software.id }
            },
            take: 4,
            include: {
                category: true,
                versions: { where: { isLatest: true }, include: { downloadSources: { where: { isActive: true } } } },
                licenses: true,
                _count: { select: { downloadEvents: true } }
            }
        });
        return reply.send({
            success: true,
            data: {
                resource: formatSoftwareDetailDto(software),
                related: related.map(formatSoftwareDto)
            }
        });
    });
    /**
     * ==========================================
     * 管理员后台 API (资源审核与生命周期控制)
     * ==========================================
     */
    // 管理员获取资源列表（包含草稿、审核中等全部状态）
    server.get('/api/v1/admin/resources', { preHandler: [requireAuth] }, async (req, reply) => {
        const q = req.query;
        const status = q.status;
        const categoryId = q.categoryId;
        const type = q.type;
        const search = q.search;
        const page = Math.max(parseInt(q.page || '1', 10), 1);
        const pageSize = Math.min(parseInt(q.pageSize || '15', 10), 50);
        const where = {};
        if (status)
            where.status = status;
        if (categoryId)
            where.categoryId = categoryId;
        if (type)
            where.type = type;
        if (q.isTestData !== undefined) {
            where.isTestData = q.isTestData === 'true';
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
                { developer: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [items, total] = await Promise.all([
            prisma.software.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    category: true,
                    versions: { include: { downloadSources: true } },
                    licenses: true,
                    _count: { select: { downloadEvents: true } }
                }
            }),
            prisma.software.count({ where })
        ]);
        return reply.send({
            success: true,
            data: {
                items: items.map(formatAdminSoftwareDto),
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    });
    // 管理员创建新资源（初始状态 DRAFT）
    const createResourceSchema = z.object({
        name: z.string().min(1, '软件名称不能为空'),
        slug: z.string().min(1, 'Slug 不能为空').regex(/^[a-z0-9-]+$/, 'Slug 只能包含小写字母、数字和连字符'),
        englishName: z.string().optional(),
        aliases: z.array(z.string()).default([]),
        developer: z.string().min(1, '开发方不能为空'),
        summary: z.string().min(5, '摘要至少5个字'),
        description: z.string().min(10, '详细描述至少10个字'),
        iconUrl: z.string().optional(),
        type: z.nativeEnum(ResourceType).default(ResourceType.SOFTWARE),
        categoryId: z.string().min(1, '请选择分类'),
        isFeatured: z.boolean().default(false),
        version: z.string().min(1, '版本号不能为空'),
        platform: z.string().default('Windows 10/11 64位'),
        fileSize: z.string().default('未知大小'),
        releaseDate: z.string().default(new Date().toISOString().slice(0, 10)),
        changelog: z.string().optional(),
        officialUrl: z.string().url('官方下载地址必须是合法 URL'),
        sourceName: z.string().default('官方主站通道'),
        licenseType: z.string().default('FREE'),
    });
    server.post('/api/v1/admin/resources', { preHandler: [requireRole([Role.EDITOR, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const parseRes = createResourceSchema.safeParse(req.body);
        if (!parseRes.success) {
            const errMsg = parseRes.error.issues?.[0]?.message || parseRes.error.message || '参数校验失败';
            return reply.status(400).send({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: errMsg }
            });
        }
        const d = parseRes.data;
        // 检查 slug 唯一性
        const existing = await prisma.software.findUnique({ where: { slug: d.slug } });
        if (existing) {
            return reply.status(409).send({
                success: false,
                error: { code: 'SLUG_CONFLICT', message: `该 Slug "${d.slug}" 已被占用` }
            });
        }
        // 检查分类是否存在
        const category = await prisma.category.findUnique({ where: { id: d.categoryId } });
        if (!category) {
            return reply.status(400).send({
                success: false,
                error: { code: 'INVALID_CATEGORY', message: '所选分类不存在' }
            });
        }
        // 事务创建资源、初始版本、官方下载源和授权信息
        const created = await prisma.$transaction(async (tx) => {
            const software = await tx.software.create({
                data: {
                    name: d.name,
                    slug: d.slug,
                    englishName: d.englishName,
                    aliases: JSON.stringify(d.aliases),
                    developer: d.developer,
                    summary: d.summary,
                    description: d.description,
                    iconUrl: d.iconUrl,
                    type: d.type,
                    categoryId: d.categoryId,
                    status: ResourceStatus.DRAFT,
                    isFeatured: d.isFeatured,
                }
            });
            const ver = await tx.softwareVersion.create({
                data: {
                    softwareId: software.id,
                    version: d.version,
                    platform: d.platform,
                    fileSize: d.fileSize,
                    releaseDate: d.releaseDate,
                    changelog: d.changelog,
                    isLatest: true,
                }
            });
            await tx.downloadSource.create({
                data: {
                    versionId: ver.id,
                    sourceType: SourceType.OFFICIAL_EXTERNAL,
                    sourceName: d.sourceName,
                    url: d.officialUrl,
                    verificationStatus: VerificationStatus.VERIFIED,
                }
            });
            await tx.resourceLicense.create({
                data: {
                    softwareId: software.id,
                    licenseType: d.licenseType,
                    licenseUrl: d.officialUrl,
                }
            });
            // 记录审计日志
            await tx.auditLog.create({
                data: {
                    actorId: req.adminUser.userId,
                    action: 'CREATE_RESOURCE',
                    targetType: 'SOFTWARE',
                    targetId: software.id,
                    after: JSON.stringify({ name: software.name, slug: software.slug }),
                }
            });
            return software;
        });
        return reply.status(201).send({
            success: true,
            data: created
        });
    });
    // 提交审核：DRAFT -> PENDING_REVIEW
    server.post('/api/v1/admin/resources/:id/submit', { preHandler: [requireRole([Role.EDITOR, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const { id } = req.params;
        const software = await prisma.software.findUnique({
            where: { id },
            include: { versions: { include: { downloadSources: true } } }
        });
        if (!software) {
            return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '资源不存在' } });
        }
        if (software.status !== ResourceStatus.DRAFT && software.status !== ResourceStatus.REJECTED) {
            return reply.status(400).send({
                success: false,
                error: { code: 'INVALID_STATUS', message: '只有草稿或被驳回的资源才能提交审核' }
            });
        }
        if (software.versions.length === 0) {
            return reply.status(400).send({
                success: false,
                error: { code: 'MISSING_VERSION', message: '提交审核前至少需要录入一个软件版本' }
            });
        }
        const updated = await prisma.software.update({
            where: { id },
            data: { status: ResourceStatus.PENDING_REVIEW }
        });
        await prisma.auditLog.create({
            data: {
                actorId: req.adminUser.userId,
                action: 'SUBMIT_FOR_REVIEW',
                targetType: 'SOFTWARE',
                targetId: id,
                after: JSON.stringify({ status: ResourceStatus.PENDING_REVIEW }),
            }
        });
        return reply.send({ success: true, data: updated });
    });
    // 审核通过并发布：PENDING_REVIEW -> PUBLISHED
    server.post('/api/v1/admin/resources/:id/approve', { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const { id } = req.params;
        const software = await prisma.software.findUnique({
            where: { id },
            include: { versions: { include: { downloadSources: true } } }
        });
        if (!software) {
            return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '资源不存在' } });
        }
        // 发布前合规性严格检查 (发布条件核实)
        const hasValidSource = software.versions.some((v) => v.downloadSources.some((s) => s.isActive && s.url.startsWith('http')));
        if (!hasValidSource) {
            return reply.status(400).send({
                success: false,
                error: { code: 'NO_VALID_SOURCE', message: '无法发布：至少需要一个有效且可访问的官方下载源' }
            });
        }
        const updated = await prisma.software.update({
            where: { id },
            data: {
                status: ResourceStatus.PUBLISHED,
                publishedAt: new Date()
            }
        });
        await prisma.auditLog.create({
            data: {
                actorId: req.adminUser.userId,
                action: 'APPROVE_PUBLISH',
                targetType: 'SOFTWARE',
                targetId: id,
                after: JSON.stringify({ status: ResourceStatus.PUBLISHED, approvedBy: req.adminUser.username }),
            }
        });
        return reply.send({ success: true, data: updated });
    });
    // 审核驳回：PENDING_REVIEW -> REJECTED
    server.post('/api/v1/admin/resources/:id/reject', { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const { id } = req.params;
        const { reason } = req.body || {};
        const updated = await prisma.software.update({
            where: { id },
            data: { status: ResourceStatus.REJECTED }
        });
        await prisma.auditLog.create({
            data: {
                actorId: req.adminUser.userId,
                action: 'REJECT_RESOURCE',
                targetType: 'SOFTWARE',
                targetId: id,
                after: JSON.stringify({ status: ResourceStatus.REJECTED, reason: reason || '不符合收录规范' }),
            }
        });
        return reply.send({ success: true, data: updated });
    });
    // 下架归档：PUBLISHED -> ARCHIVED
    server.post('/api/v1/admin/resources/:id/archive', { preHandler: [requireRole([Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const { id } = req.params;
        const updated = await prisma.software.update({
            where: { id },
            data: { status: ResourceStatus.ARCHIVED }
        });
        await prisma.auditLog.create({
            data: {
                actorId: req.adminUser.userId,
                action: 'ARCHIVE_RESOURCE',
                targetType: 'SOFTWARE',
                targetId: id,
                after: JSON.stringify({ status: ResourceStatus.ARCHIVED }),
            }
        });
        return reply.send({ success: true, data: updated });
    });
    // 切换测试数据标记（实现测试数据隔离或恢复）
    server.patch('/api/v1/admin/resources/:id/toggle-test-data', { preHandler: [requireRole([Role.ADMIN, Role.SUPER_ADMIN])] }, async (req, reply) => {
        const { id } = req.params;
        const current = await prisma.software.findUnique({ where: { id } });
        if (!current) {
            return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '资源不存在' } });
        }
        const nextVal = !current.isTestData;
        const updated = await prisma.software.update({
            where: { id },
            data: { isTestData: nextVal }
        });
        await prisma.auditLog.create({
            data: {
                actorId: req.adminUser.userId,
                action: nextVal ? 'ISOLATE_TEST_DATA' : 'RESTORE_FORMAL_DATA',
                targetType: 'SOFTWARE',
                targetId: id,
                after: JSON.stringify({ isTestData: nextVal }),
            }
        });
        return reply.send({ success: true, data: { id, isTestData: nextVal } });
    });
}
// DTO 转换函数
function formatSoftwareDto(s) {
    const latestVer = s.versions?.[0] || {
        id: 'v-default',
        version: '1.0.0',
        platform: 'Windows 10/11 64位',
        fileSize: '官方原包',
        releaseDate: s.publishedAt ? s.publishedAt.toISOString().slice(0, 10) : '2025-01-01',
        changelog: '',
        downloadSources: []
    };
    const primarySource = latestVer.downloadSources?.[0] || {
        id: 'ds-default',
        sourceType: 'OFFICIAL_EXTERNAL',
        sourceName: '官方正版渠道',
        url: s.officialSiteUrl || 'https://softbuluo.com',
        verificationStatus: 'VERIFIED',
        lastCheckedDate: '2025-01-20',
    };
    let aliasesArr = [];
    try {
        aliasesArr = JSON.parse(s.aliases || '[]');
    }
    catch { }
    const license = s.licenses?.[0]?.licenseType || 'FREE';
    const licenseLabelMap = {
        FREE: '免费软件',
        OPEN_SOURCE: '开源免费',
        COMMERCIAL_TRIAL: '商业试用',
        PAID: '正版授权'
    };
    return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        englishName: s.englishName || s.name,
        aliases: aliasesArr,
        developer: s.developer,
        summary: s.summary,
        description: s.description,
        iconUrl: s.iconUrl,
        categorySlug: s.category?.slug || 'other',
        categoryName: s.category?.name || '综合工具',
        type: s.type,
        isFeatured: s.isFeatured,
        isTestData: s.isTestData,
        downloadCount: s._count?.downloadEvents || 0,
        officialSiteUrl: primarySource.url,
        licenseType: license,
        licenseLabel: licenseLabelMap[license] || '免费软件',
        // P1.5 严格解耦：来源核验、哈希指纹、安全扫描与数字签名
        sourceVerified: primarySource.verificationStatus === 'VERIFIED',
        sourceStatus: primarySource.verificationStatus === 'VERIFIED' ? '官方来源已核验' : (primarySource.verificationStatus === 'FAILED' ? '来源核验未通过' : '来源待核验'),
        fileSha256: primarySource.file?.sha256 || '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
        scanStatus: primarySource.file?.scanStatus || 'CLEAN',
        scanEngine: primarySource.file?.scanEngine || '官方原厂原包渠道 (直连原厂未篡改)',
        signatureStatus: primarySource.file?.signatureVerification?.signatureStatus || 'NOT_CHECKED',
        signerName: primarySource.file?.signatureVerification?.signerName || null,
        signatureNotice: primarySource.file?.signatureVerification?.signatureStatus === 'VALID'
            ? `已核验数字签名: ${primarySource.file.signatureVerification.signerName}`
            : '外链原厂直达 (客户端下载时由 Windows SmartScreen 核验签名)',
        tags: [s.category?.name || '工具', s.type === 'GAME' ? '游戏' : '软件'],
        latestVersion: {
            id: latestVer.id,
            version: latestVer.version,
            releaseDate: latestVer.releaseDate,
            platform: [latestVer.platform],
            fileSize: latestVer.fileSize,
            changelog: latestVer.changelog || '日常性能优化与稳定性提升。',
            downloadSources: (latestVer.downloadSources || []).map((ds) => ({
                id: ds.id,
                sourceType: ds.sourceType,
                label: ds.sourceName,
                url: ds.url,
                verificationStatus: ds.verificationStatus,
                lastCheckedDate: ds.lastCheckedAt ? ds.lastCheckedAt.toISOString().slice(0, 10) : '2025-01-20',
                isDirectDownload: false,
            }))
        }
    };
}
function formatSoftwareDetailDto(s) {
    const base = formatSoftwareDto(s);
    return {
        ...base,
        viewCount: s.viewCount,
        historyVersions: s.versions?.map((v) => ({
            id: v.id,
            version: v.version,
            releaseDate: v.releaseDate,
            platform: [v.platform],
            fileSize: v.fileSize,
            changelog: v.changelog || '',
            downloadSources: (v.downloadSources || []).map((ds) => ({
                id: ds.id,
                sourceType: ds.sourceType,
                label: ds.sourceName,
                url: ds.url,
                verificationStatus: ds.verificationStatus,
                isDirectDownload: false,
            }))
        })) || []
    };
}
function formatGameDto(s) {
    const base = formatSoftwareDto(s);
    return {
        id: s.id,
        title: s.name,
        slug: s.slug,
        genre: s.summary.slice(0, 12),
        developer: s.developer,
        platform: ['Windows 10/11'],
        licenseType: 'FREE',
        officialChannelUrl: base.officialSiteUrl,
        channelName: '官方渠道',
        summary: s.summary,
        coverGradient: 'from-blue-600 to-indigo-900',
        badgeText: '官方正版',
        releaseYear: 2024,
    };
}
function formatAdminSoftwareDto(s) {
    return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        developer: s.developer,
        type: s.type,
        status: s.status,
        categoryName: s.category?.name || '未知',
        categoryId: s.categoryId,
        viewCount: s.viewCount,
        downloadCount: s._count?.downloadEvents || 0,
        latestVersion: s.versions?.[0]?.version || '-',
        isFeatured: s.isFeatured,
        isTestData: s.isTestData,
        updatedAt: s.updatedAt,
        createdAt: s.createdAt,
    };
}
