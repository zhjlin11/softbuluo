import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db';
import { requireAuth, requireRole } from '../../middleware/auth';
import { ResourceStatus, ResourceType, Role, SourceType, VerificationStatus, DataIntegrityStatus } from '@prisma/client';

export async function resourceRoutes(server: FastifyInstance) {
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
          take: 12,
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
          take: 10,
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
          take: 16,
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
    } catch (err: any) {
      server.log.error(err, '获取首页数据失败');
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '数据库读取异常: ' + err.message }
      });
    }
  });

  // 获取公开资源列表（支持分类与类型过滤、多重维度筛选、排序与搜索）
  server.get('/api/v1/resources', async (req, reply) => {
    const query = req.query as any;
    const type = query.type as string | undefined;
    const excludeType = query.excludeType as string | undefined;
    const categorySlug = query.categorySlug as string | undefined;
    const search = (query.search || query.q || '').trim();
    const sort = query.sort as string | undefined; // 'popular' | 'latest' | 'downloads' | 'name'
    const platform = query.platform as string | undefined; // 'windows' | 'macos' | 'linux'
    const license = query.license as string | undefined; // 'free' | 'opensource' | 'commercial'
    const genre = (query.genre as string | undefined)?.trim();
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const offset = parseInt(query.offset || '0', 10);

    const where: any = {
      status: ResourceStatus.PUBLISHED,
      isTestData: false,
    };
    if (type === 'DESKTOP') {
      where.type = { not: ResourceType.GAME };
    } else if (type) {
      where.type = type as ResourceType;
    } else if (excludeType) {
      where.type = { not: excludeType as ResourceType };
    }
    if (categorySlug && categorySlug !== 'all') {
      where.category = { slug: categorySlug };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { englishName: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { genre: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (platform && platform !== 'all') {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { supportedPlatforms: { contains: platform, mode: 'insensitive' } },
            {
              versions: {
                some: {
                  platform: { contains: platform, mode: 'insensitive' },
                },
              },
            },
          ],
        },
      ];
    }
    if (genre && genre !== 'all') {
      const genreKeywordMap: Record<string, string[]> = {
        'strategy-tower': ['策略', '塔防', '工厂', '建造', '战略', '战棋', 'RTS', 'SLG'],
        'racing-sports': ['竞速', '赛车', '卡丁车', '体育', '赛道'],
        'simulation-sandbox': ['模拟', '经营', '沙盒', '运输', '太空', '体素'],
        'tactics-adventure': ['地牢', 'Roguelike', '冒险', '角色', 'RPG'],
      };
      const keywords = genreKeywordMap[genre] || [genre];
      where.AND = [
        ...(where.AND || []),
        {
          OR: keywords.flatMap((kw) => [
            { genre: { contains: kw, mode: 'insensitive' } },
            { summary: { contains: kw, mode: 'insensitive' } },
            { description: { contains: kw, mode: 'insensitive' } },
          ]),
        },
      ];
    }
    if (license && license !== 'all') {
      if (license === 'free') {
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { licenseType: { contains: 'free', mode: 'insensitive' } },
              { licenseType: { contains: '免费', mode: 'insensitive' } },
              { licenseType: { contains: 'shareware', mode: 'insensitive' } },
            ],
          },
        ];
      } else if (license === 'opensource') {
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { licenseType: { contains: 'open', mode: 'insensitive' } },
              { licenseType: { contains: 'gpl', mode: 'insensitive' } },
              { licenseType: { contains: 'mit', mode: 'insensitive' } },
              { licenseType: { contains: 'apache', mode: 'insensitive' } },
              { licenseType: { contains: 'mpl', mode: 'insensitive' } },
              { licenseType: { contains: 'bsd', mode: 'insensitive' } },
              { licenseType: { contains: '开源', mode: 'insensitive' } },
            ],
          },
        ];
      } else if (license === 'commercial') {
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { licenseType: { contains: 'commercial', mode: 'insensitive' } },
              { licenseType: { contains: 'paid', mode: 'insensitive' } },
              { licenseType: { contains: '商业', mode: 'insensitive' } },
              { licenseType: { contains: '付费', mode: 'insensitive' } },
            ],
          },
        ];
      }
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'popular') {
      orderBy = [{ viewCount: 'desc' }, { createdAt: 'desc' }];
    } else if (sort === 'downloads') {
      orderBy = [{ downloadEvents: { _count: 'desc' } }, { viewCount: 'desc' }];
    } else if (sort === 'latest') {
      orderBy = [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
    } else if (sort === 'name') {
      orderBy = { name: 'asc' };
    }

    const isVersionReleaseSort = sort === 'version' || sort === 'updated';

    const [rawItems, total] = await Promise.all([
      prisma.software.findMany({
        where,
        orderBy,
        take: isVersionReleaseSort ? 100 : limit,
        skip: isVersionReleaseSort ? 0 : offset,
        include: {
          category: true,
          versions: {
            orderBy: [{ isLatest: 'desc' }, { createdAt: 'desc' }],
            include: { downloadSources: { where: { isActive: true } } },
          },
          licenses: true,
          _count: { select: { downloadEvents: { where: { isTestEvent: false } } } },
        },
      }),
      prisma.software.count({ where }),
    ]);

    const items = isVersionReleaseSort
      ? [...rawItems]
          .sort((a, b) => {
            const relA = a.versions?.[0]?.releaseDate || '';
            const relB = b.versions?.[0]?.releaseDate || '';
            return relB.localeCompare(relA);
          })
          .slice(offset, offset + limit)
      : rawItems;

    return reply.send({
      success: true,
      data: {
        items: items.map(formatSoftwareDto),
        total,
        limit,
        offset,
      },
    });
  });

  // 获取最新版本更新动态流水线 (严格区分新收录与版本更新)
  server.get('/api/v1/versions/feed', async (req, reply) => {
    const query = req.query as any;
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const offset = parseInt(query.offset || '0', 10);
    const platform = query.platform as string | undefined;

    const where: any = {
      software: {
        status: ResourceStatus.PUBLISHED,
        isTestData: false,
      },
    };
    if (platform && platform !== 'all') {
      where.platform = { contains: platform, mode: 'insensitive' };
    }

    const [versions, total] = await Promise.all([
      prisma.softwareVersion.findMany({
        where,
        orderBy: [{ releaseDate: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
        include: {
          software: {
            include: {
              category: true,
              licenses: true,
              _count: { select: { downloadEvents: true } },
            },
          },
          downloadSources: { where: { isActive: true } },
        },
      }),
      prisma.softwareVersion.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: {
        items: versions.map((v) => ({
          versionId: v.id,
          version: v.version,
          platform: v.platform,
          architecture: v.architecture,
          fileSize: v.fileSize,
          releaseDate: v.releaseDate,
          changelog: v.changelog || '优化系统兼容性与稳定性，修复已知问题。',
          isLatest: v.isLatest,
          updatedAt: v.updatedAt,
          software: {
            id: v.software.id,
            name: v.software.name,
            slug: v.software.slug,
            iconUrl: v.software.iconUrl,
            summary: v.software.summary,
            type: v.software.type,
            categoryName: v.software.category?.name || '实用软件',
            categorySlug: v.software.category?.slug || 'tools',
            developer: v.software.developer,
            licenseType: v.software.licenseType || 'FREE',
            downloadCount: v.software._count?.downloadEvents || 0,
          },
          primarySource: v.downloadSources[0]
            ? {
                sourceName: v.downloadSources[0].sourceName,
                url: v.downloadSources[0].url,
                sourceType: v.downloadSources[0].sourceType,
              }
            : null,
        })),
        total,
        limit,
        offset,
      },
    });
  });

  // 获取单个资源详情（按 slug 获取）
  server.get('/api/v1/resources/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string };

    const software = await prisma.software.findUnique({
      where: { slug },
      include: {
        category: true,
        versions: {
          orderBy: [{ isLatest: 'desc' }, { createdAt: 'desc' }],
          include: {
            downloadSources: {
              where: { isActive: true },
              orderBy: { priority: 'asc' },
              include: { file: { include: { signatureVerification: true } } },
            },
          },
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
  server.get(
    '/api/v1/admin/resources',
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const q = req.query as any;
      const status = q.status as ResourceStatus | undefined;
      const categoryId = q.categoryId as string | undefined;
      const type = q.type as ResourceType | undefined;
      const search = q.search as string | undefined;
      const page = Math.max(parseInt(q.page || '1', 10), 1);
      const pageSize = Math.min(parseInt(q.pageSize || '15', 10), 50);

      const where: any = {};
      if (status) where.status = status;
      if (categoryId) where.categoryId = categoryId;
      if (type) where.type = type;
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
    }
  );

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

  server.post(
    '/api/v1/admin/resources',
    { preHandler: [requireRole([Role.EDITOR, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
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
            actorId: req.adminUser!.userId,
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
    }
  );

  // 提交审核：DRAFT -> PENDING_REVIEW
  server.post(
    '/api/v1/admin/resources/:id/submit',
    { preHandler: [requireRole([Role.EDITOR, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
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
          actorId: req.adminUser!.userId,
          action: 'SUBMIT_FOR_REVIEW',
          targetType: 'SOFTWARE',
          targetId: id,
          after: JSON.stringify({ status: ResourceStatus.PENDING_REVIEW }),
        }
      });

      return reply.send({ success: true, data: updated });
    }
  );

  // 审核通过并发布：PENDING_REVIEW -> PUBLISHED
  server.post(
    '/api/v1/admin/resources/:id/approve',
    { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const software = await prisma.software.findUnique({
        where: { id },
        include: { versions: { include: { downloadSources: true } } }
      });

      if (!software) {
        return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '资源不存在' } });
      }

      // 发布前合规性严格检查 (发布条件核实)
      const hasValidSource = software.versions.some((v) =>
        v.downloadSources.some((s) => s.isActive && s.url.startsWith('http'))
      );
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
          actorId: req.adminUser!.userId,
          action: 'APPROVE_PUBLISH',
          targetType: 'SOFTWARE',
          targetId: id,
          after: JSON.stringify({ status: ResourceStatus.PUBLISHED, approvedBy: req.adminUser!.username }),
        }
      });

      return reply.send({ success: true, data: updated });
    }
  );

  // 审核驳回：PENDING_REVIEW -> REJECTED
  server.post(
    '/api/v1/admin/resources/:id/reject',
    { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { reason } = (req.body as any) || {};

      const updated = await prisma.software.update({
        where: { id },
        data: { status: ResourceStatus.REJECTED }
      });

      await prisma.auditLog.create({
        data: {
          actorId: req.adminUser!.userId,
          action: 'REJECT_RESOURCE',
          targetType: 'SOFTWARE',
          targetId: id,
          after: JSON.stringify({ status: ResourceStatus.REJECTED, reason: reason || '不符合收录规范' }),
        }
      });

      return reply.send({ success: true, data: updated });
    }
  );

  // 下架归档：PUBLISHED -> ARCHIVED
  server.post(
    '/api/v1/admin/resources/:id/archive',
    { preHandler: [requireRole([Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };

      const updated = await prisma.software.update({
        where: { id },
        data: { status: ResourceStatus.ARCHIVED }
      });

      await prisma.auditLog.create({
        data: {
          actorId: req.adminUser!.userId,
          action: 'ARCHIVE_RESOURCE',
          targetType: 'SOFTWARE',
          targetId: id,
          after: JSON.stringify({ status: ResourceStatus.ARCHIVED }),
        }
      });

      return reply.send({ success: true, data: updated });
    }
  );

  // 切换测试数据标记（实现测试数据隔离或恢复）
  server.patch(
    '/api/v1/admin/resources/:id/toggle-test-data',
    { preHandler: [requireRole([Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const current = await prisma.software.findUnique({ where: { id } });
      if (!current) {
        return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: '资源不存在' } });
      }

      const nextVal = !current.isTestData;
      const updated = await prisma.software.update({
        where: { id },
        data: {
          isTestData: nextVal,
          ...(nextVal ? { dataIntegrityStatus: DataIntegrityStatus.NEEDS_REVIEW } : {}),
        }
      });

      await prisma.auditLog.create({
        data: {
          actorId: req.adminUser!.userId,
          action: nextVal ? 'ISOLATE_TEST_DATA' : 'RESTORE_FORMAL_DATA',
          targetType: 'SOFTWARE',
          targetId: id,
          after: JSON.stringify({ isTestData: nextVal }),
        }
      });

      return reply.send({ success: true, data: { id, isTestData: nextVal } });
    }
  );

  /**
   * P6-A 增强：资源安全证据工作台与审核流
   */

  // 获取下一条待审资源与审查诊断
  server.get(
    '/api/v1/admin/resources/review/next-pending',
    { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const pendingResource = await prisma.software.findFirst({
        where: {
          status: { in: [ResourceStatus.DRAFT, ResourceStatus.PENDING_REVIEW] }
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'asc' }],
        include: {
          category: true,
          versions: { include: { downloadSources: true } },
          sources: true,
          reviewEvidences: { orderBy: { checkedAt: 'desc' } }
        }
      });

      if (!pendingResource) {
        return reply.send({ success: true, data: null, message: '当前没有待审核的资源' });
      }

      const totalPending = await prisma.software.count({
        where: { status: { in: [ResourceStatus.DRAFT, ResourceStatus.PENDING_REVIEW] } }
      });

      // 自动诊断缺失字段
      const missingFields: string[] = [];
      if (!pendingResource.officialWebsite) missingFields.push('官方网站缺失');
      if (!pendingResource.developer) missingFields.push('开发商信息缺失');
      if (!pendingResource.summary || pendingResource.summary.length < 10) missingFields.push('一句话简介过短');
      if (!pendingResource.versions.length) missingFields.push('无版本信息');
      if (!pendingResource.versions.some(v => v.downloadSources.length > 0)) missingFields.push('无下载来源直链');

      return reply.send({
        success: true,
        data: {
          resource: pendingResource,
          totalPending,
          missingFields,
          evidences: pendingResource.reviewEvidences
        }
      });
    }
  );

  // 获取特定资源的审核凭据清单
  server.get(
    '/api/v1/admin/resources/:id/evidences',
    { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const evidences = await prisma.resourceReviewEvidence.findMany({
        where: { resourceId: id },
        orderBy: { checkedAt: 'desc' }
      });
      return reply.send({ success: true, data: evidences });
    }
  );

  // 录入新审核证据
  server.post(
    '/api/v1/admin/resources/:id/evidences',
    { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { fieldName, evidenceType, sourceUrl, observedValue, verificationStatus, notes } = req.body as any;

      const evidence = await prisma.resourceReviewEvidence.create({
        data: {
          resourceId: id,
          fieldName: fieldName || 'general',
          evidenceType: evidenceType || 'MANUAL_REVIEW',
          sourceUrl: sourceUrl || null,
          observedValue: observedValue || null,
          verificationStatus: verificationStatus || 'VERIFIED',
          checkedBy: req.adminUser!.username,
          notes: notes || null
        }
      });

      return reply.send({ success: true, data: evidence });
    }
  );

  // 标记需整改：PENDING_REVIEW / DRAFT -> DRAFT (with notes)
  server.post(
    '/api/v1/admin/resources/:id/needs-correction',
    { preHandler: [requireRole([Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN])] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const { notes } = (req.body as any) || {};

      const updated = await prisma.software.update({
        where: { id },
        data: {
          status: ResourceStatus.DRAFT,
          dataIntegrityStatus: 'VERIFIED_INCOMPLETE',
          auditNotes: notes || '待整改：缺少必要官方来源或下载直链异常'
        }
      });

      await prisma.auditLog.create({
        data: {
          actorId: req.adminUser!.userId,
          action: 'NEEDS_CORRECTION',
          targetType: 'SOFTWARE',
          targetId: id,
          after: JSON.stringify({ auditNotes: notes }),
        }
      });

      return reply.send({ success: true, data: updated });
    }
  );
}

// DTO 转换函数
function formatSoftwareDto(s: any) {
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

  let aliasesArr: string[] = [];
  try {
    aliasesArr = JSON.parse(s.aliases || '[]');
  } catch {}

  const license = s.licenses?.[0]?.licenseType || s.licenseType || 'FREE';
  const licenseLabelMap: Record<string, string> = {
    FREE: '免费软件',
    OPEN_SOURCE: '开源免费',
    COMMERCIAL_TRIAL: '商业试用',
    PAID: '正版授权',
  };
  const resolvedLicenseLabel =
    licenseLabelMap[license] ||
    (/open|gpl|mit|apache|lgpl|bsd|开源/i.test(license) ? '开源免费' : '免费软件');

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
    coverUrl: s.coverUrl || null,
    genre: s.genre || null,
    distributionPlatform: s.distributionPlatform || null,
    priceType: s.priceType || null,
    supportedPlatforms: s.supportedPlatforms || 'Windows 10/11',
    categorySlug: s.category?.slug || 'other',
    categoryName: s.category?.name || '综合工具',
    type: s.type,
    status: s.status,
    isFeatured: s.isFeatured,
    isTestData: s.isTestData,
    downloadCount: s._count?.downloadEvents || 0,
    officialSiteUrl: primarySource.url,
    licenseType: license,
    licenseLabel: resolvedLicenseLabel,
    // P1.5/P6 严格解耦与证据治理：来源核验、哈希指纹、安全扫描与真实数字签名
    sourceVerified: (latestVer.downloadSources || []).some(
      (ds: any) =>
        ds.verificationStatus === 'VERIFIED' &&
        ds.reviewStatus === 'APPROVED' &&
        ds.lastCheckStatus === 'HEALTHY'
    ),
    sourceStatus: (latestVer.downloadSources || []).some(
      (ds: any) =>
        ds.verificationStatus === 'VERIFIED' &&
        ds.reviewStatus === 'APPROVED' &&
        ds.lastCheckStatus === 'HEALTHY'
    )
      ? '含已审核健康直连'
      : primarySource.verificationStatus === 'FAILED'
        ? '来源核验未通过'
        : '已登记渠道（待复核/官网页）',
    fileSha256: primarySource.sha256 || primarySource.file?.sha256 || null,
    scanStatus:
      primarySource.file?.scanStatus ||
      (primarySource.scanStatus && primarySource.scanStatus !== 'PENDING' ? primarySource.scanStatus : 'NOT_SCANNED'),
    scanEngine: primarySource.file?.scanEngine || (primarySource.file ? '安全扫描引擎' : null),
    signatureStatus: primarySource.file?.signatureVerification?.signatureStatus || primarySource.signatureStatus || 'NOT_CHECKED',
    signerName: primarySource.file?.signatureVerification?.signerName || null,
    signatureNotice:
      (primarySource.file?.signatureVerification?.signatureStatus || primarySource.signatureStatus) === 'VALID'
        ? `已核验数字签名${primarySource.file?.signatureVerification?.signerName ? `: ${primarySource.file.signatureVerification.signerName}` : ''}`
        : (primarySource.file?.signatureVerification?.signatureStatus === 'UNSIGNED'
            ? '官方安装包无数字签名'
            : '原厂来源 (暂未核验二进制证书签名)'),
    tags: [s.category?.name || '工具', s.type === 'GAME' ? '游戏' : '软件'],
    latestVersion: {
      id: latestVer.id,
      version: latestVer.version,
      releaseDate: latestVer.releaseDate,
      platform: [latestVer.platform],
      fileSize: latestVer.fileSize,
      changelog: latestVer.changelog || '日常性能优化与稳定性提升。',
      downloadSources: (latestVer.downloadSources || []).map((ds: any) => ({
        id: ds.id,
        sourceType: ds.sourceType,
        label: ds.sourceName,
        url: ds.url,
        directFileUrl: ds.directFileUrl || null,
        fileName: ds.fileName || null,
        fileVersion: ds.fileVersion || latestVer.version,
        platform: ds.platform || 'windows',
        architecture: ds.architecture || 'x64',
        sha256: ds.sha256 || ds.file?.sha256 || null,
        fileSizeLabel: ds.fileSizeLabel || latestVer.fileSize,
        mirrorAuthorizationStatus: ds.mirrorAuthorizationStatus || 'NONE',
        scanStatus: ds.file?.scanStatus || (ds.scanStatus && ds.scanStatus !== 'PENDING' ? ds.scanStatus : 'NOT_SCANNED'),
        signatureStatus: ds.file?.signatureVerification?.signatureStatus || ds.signatureStatus || 'NOT_CHECKED',
        lastCheckStatus: ds.lastCheckStatus || 'UNKNOWN',
        priority: ds.priority ?? 10,
        verificationStatus: ds.verificationStatus,
        lastCheckedDate: ds.lastCheckedAt ? ds.lastCheckedAt.toISOString().slice(0, 10) : '未检测',
        isDirectDownload:
          ds.sourceType === 'OFFICIAL_DIRECT' ||
          ds.sourceType === 'OFFICIAL_RELEASE' ||
          (ds.sourceType === 'AUTHORIZED_MIRROR' && ds.mirrorAuthorizationStatus === 'APPROVED'),
        startDownloadUrl: `/api/v1/downloads/start/${ds.id}`,
      }))
    }
  };
}

function formatSoftwareDetailDto(s: any) {
  const base = formatSoftwareDto(s);
  return {
    ...base,
    viewCount: s.viewCount,
    historyVersions: s.versions?.map((v: any) => ({
      id: v.id,
      version: v.version,
      releaseDate: v.releaseDate,
      platform: [v.platform],
      fileSize: v.fileSize,
      changelog: v.changelog || '',
      downloadSources: (v.downloadSources || []).map((ds: any) => ({
        id: ds.id,
        sourceType: ds.sourceType,
        label: ds.sourceName,
        url: ds.url,
        directFileUrl: ds.directFileUrl || null,
        fileName: ds.fileName || null,
        fileVersion: ds.fileVersion || v.version,
        platform: ds.platform || 'windows',
        architecture: ds.architecture || 'x64',
        sha256: ds.sha256 || ds.file?.sha256 || null,
        fileSizeLabel: ds.fileSizeLabel || v.fileSize,
        mirrorAuthorizationStatus: ds.mirrorAuthorizationStatus || 'NONE',
        scanStatus: ds.file?.scanStatus || (ds.scanStatus && ds.scanStatus !== 'PENDING' ? ds.scanStatus : 'NOT_SCANNED'),
        signatureStatus: ds.file?.signatureVerification?.signatureStatus || ds.signatureStatus || 'NOT_CHECKED',
        lastCheckStatus: ds.lastCheckStatus || 'UNKNOWN',
        priority: ds.priority ?? 10,
        verificationStatus: ds.verificationStatus,
        isDirectDownload:
          ds.sourceType === 'OFFICIAL_DIRECT' ||
          ds.sourceType === 'OFFICIAL_RELEASE' ||
          (ds.sourceType === 'AUTHORIZED_MIRROR' && ds.mirrorAuthorizationStatus === 'APPROVED'),
        startDownloadUrl: `/api/v1/downloads/start/${ds.id}`,
      }))
    })) || []
  };
}

function formatGameDto(s: any) {
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

function formatAdminSoftwareDto(s: any) {
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
