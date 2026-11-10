import { prisma } from '../../db';
import { ComparisonStatus, ComparisonAttributeCategory } from '@prisma/client';
import { config } from '../../config';
import { SeoService } from '../seo/seoService';
export class ComparisonService {
    /**
     * 前台已发布对比列表
     */
    static async listPublished(page = 1, pageSize = 12) {
        const skip = (page - 1) * pageSize;
        const where = { status: ComparisonStatus.PUBLISHED };
        const [total, items] = await Promise.all([
            prisma.softwareComparison.count({ where }),
            prisma.softwareComparison.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
                include: {
                    items: {
                        include: {
                            software: {
                                select: { id: true, name: true, slug: true, iconUrl: true, developer: true, licenseType: true },
                            },
                        },
                        orderBy: { sortOrder: 'asc' },
                    },
                },
            }),
        ]);
        return { total, page, pageSize, totalPages: Math.ceil(total / pageSize), items };
    }
    /**
     * 获取对比详情 (包含关联软件与属性表)
     */
    static async getBySlug(slug, requirePublished = true) {
        const where = { slug };
        if (requirePublished) {
            where.status = ComparisonStatus.PUBLISHED;
        }
        const comparison = await prisma.softwareComparison.findFirst({
            where,
            include: {
                items: {
                    include: {
                        software: {
                            include: {
                                category: true,
                                versions: { take: 1, orderBy: { createdAt: 'desc' } },
                            },
                        },
                    },
                    orderBy: { sortOrder: 'asc' },
                },
                attributes: {
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });
        if (!comparison)
            return null;
        // 自增浏览量
        await prisma.softwareComparison.update({
            where: { id: comparison.id },
            data: { viewCount: { increment: 1 } },
        });
        return {
            ...comparison,
            attributes: comparison.attributes.map((attr) => ({
                ...attr,
                values: JSON.parse(attr.valuesJson || '{}'),
            })),
        };
    }
    /**
     * 管理后台获取列表
     */
    static async adminList(page = 1, pageSize = 20, status) {
        const skip = (page - 1) * pageSize;
        const where = {};
        if (status)
            where.status = status;
        const [total, items] = await Promise.all([
            prisma.softwareComparison.count({ where }),
            prisma.softwareComparison.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { updatedAt: 'desc' },
                include: {
                    items: {
                        include: { software: { select: { id: true, name: true, slug: true, iconUrl: true } } },
                    },
                },
            }),
        ]);
        return { total, page, pageSize, totalPages: Math.ceil(total / pageSize), items };
    }
    /**
     * 创建对比
     */
    static async createComparison(data) {
        const existing = await prisma.softwareComparison.findUnique({ where: { slug: data.slug } });
        if (existing) {
            throw new Error(`对比 Slug "${data.slug}" 已存在，请指定唯一标识`);
        }
        if (data.items.length < 2) {
            throw new Error('对比至少需要关联 2 款及以上软件');
        }
        const comparison = await prisma.softwareComparison.create({
            data: {
                slug: data.slug,
                title: data.title,
                summary: data.summary,
                conclusion: data.conclusion,
                targetAudience: data.targetAudience,
                scenarioGuide: data.scenarioGuide,
                status: data.status || ComparisonStatus.DRAFT,
                publishedAt: data.status === ComparisonStatus.PUBLISHED ? new Date() : null,
                items: {
                    create: data.items.map((it, idx) => ({
                        softwareId: it.softwareId,
                        editorNotes: it.editorNotes,
                        isRecommended: it.isRecommended || false,
                        sortOrder: it.sortOrder !== undefined ? it.sortOrder : idx,
                    })),
                },
                attributes: {
                    create: data.attributes.map((attr, idx) => ({
                        attributeName: attr.attributeName,
                        category: attr.category || ComparisonAttributeCategory.BASIC,
                        valuesJson: JSON.stringify(attr.values || {}),
                        isHighlighted: attr.isHighlighted || false,
                        sortOrder: attr.sortOrder !== undefined ? attr.sortOrder : idx,
                    })),
                },
            },
        });
        return comparison;
    }
    /**
     * 按 ID 获取详情（用于管理后台编辑）
     */
    static async getById(id) {
        const comparison = await prisma.softwareComparison.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        software: {
                            select: { id: true, name: true, slug: true, iconUrl: true, developer: true, licenseType: true },
                        },
                    },
                    orderBy: { sortOrder: 'asc' },
                },
                attributes: {
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });
        if (!comparison)
            return null;
        return {
            ...comparison,
            attributes: comparison.attributes.map((attr) => ({
                ...attr,
                values: JSON.parse(attr.valuesJson || '{}'),
            })),
        };
    }
    /**
     * 更新对比信息
     */
    static async updateComparison(id, data) {
        const existing = await prisma.softwareComparison.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('对比记录不存在');
        }
        if (data.slug && data.slug !== existing.slug) {
            const conflict = await prisma.softwareComparison.findUnique({ where: { slug: data.slug } });
            if (conflict) {
                throw new Error(`对比 Slug "${data.slug}" 已被其他记录占用`);
            }
        }
        return await prisma.$transaction(async (tx) => {
            // 1. 如果更新了 items，先删后建
            if (data.items) {
                if (data.items.length < 2) {
                    throw new Error('对比至少需要关联 2 款及以上软件');
                }
                await tx.softwareComparisonItem.deleteMany({ where: { comparisonId: id } });
                await tx.softwareComparisonItem.createMany({
                    data: data.items.map((it, idx) => ({
                        comparisonId: id,
                        softwareId: it.softwareId,
                        editorNotes: it.editorNotes,
                        isRecommended: it.isRecommended || false,
                        sortOrder: it.sortOrder !== undefined ? it.sortOrder : idx,
                    })),
                });
            }
            // 2. 如果更新了 attributes，先删后建
            if (data.attributes) {
                await tx.comparisonAttribute.deleteMany({ where: { comparisonId: id } });
                await tx.comparisonAttribute.createMany({
                    data: data.attributes.map((attr, idx) => ({
                        comparisonId: id,
                        attributeName: attr.attributeName,
                        category: attr.category || ComparisonAttributeCategory.BASIC,
                        valuesJson: JSON.stringify(attr.values || {}),
                        isHighlighted: attr.isHighlighted || false,
                        sortOrder: attr.sortOrder !== undefined ? attr.sortOrder : idx,
                    })),
                });
            }
            // 3. 更新主表
            const updatePayload = {};
            if (data.slug)
                updatePayload.slug = data.slug;
            if (data.title)
                updatePayload.title = data.title;
            if (data.summary)
                updatePayload.summary = data.summary;
            if (data.conclusion)
                updatePayload.conclusion = data.conclusion;
            if (data.targetAudience !== undefined)
                updatePayload.targetAudience = data.targetAudience;
            if (data.scenarioGuide !== undefined)
                updatePayload.scenarioGuide = data.scenarioGuide;
            if (data.status) {
                updatePayload.status = data.status;
                if (data.status === ComparisonStatus.PUBLISHED && !existing.publishedAt) {
                    updatePayload.publishedAt = new Date();
                }
            }
            return await tx.softwareComparison.update({
                where: { id },
                data: updatePayload,
            });
        });
    }
    /**
     * 删除对比
     */
    static async deleteComparison(id) {
        const existing = await prisma.softwareComparison.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('对比记录不存在');
        }
        return await prisma.softwareComparison.delete({ where: { id } });
    }
    /**
     * 生成对比页面的真实 HTML5 静态化服务端输出
     */
    static async renderComparisonHtml(slug) {
        const comp = await this.getBySlug(slug, true);
        if (!comp) {
            return {
                status: 404,
                html: `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>404 - 对比不存在 - 软游部落</title></head><body style="text-align:center;padding:50px;"><h1>404 Not Found</h1><p>对比评测 "${slug}" 不存在或尚未公开发布</p><p><a href="/">返回首页</a></p></body></html>`,
            };
        }
        const domain = config.clientUrl;
        const pageUrl = config.getCanonicalUrl(`/compare/${comp.slug}`);
        const pageTitle = `${comp.title} - 功能差异与选型建议 - 软游部落`;
        const metaDescription = `${comp.summary} 软游部落深度横向评测：包含适合人群、平台兼容性、许可证、核心差异与选型指南。`;
        // 软件列头
        const ths = comp.items
            .map((it) => `<th style="padding: 12px; border: 1px solid #cbd5e1; background: #f8fafc; text-align: center;">
            <a href="${domain}/software/${it.software.slug}" style="color: #1e293b; text-decoration: none; font-size: 1.1rem; font-weight: 700;">${it.software.name}</a>
            ${it.isRecommended ? '<br><span style="background:#dbeafe;color:#1e40af;font-size:0.75rem;padding:2px 8px;border-radius:9999px;">编辑推荐</span>' : ''}
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 4px;">${it.editorNotes || it.software.developer}</div>
          </th>`)
            .join('\n');
        // 属性行
        const rows = comp.attributes
            .map((attr) => {
            const tds = comp.items
                .map((it) => {
                const val = attr.values[it.softwareId] || '—';
                return `<td style="padding: 12px; border: 1px solid #cbd5e1; text-align: center; font-size: 0.95rem;">${val}</td>`;
            })
                .join('\n');
            return `<tr>
          <th style="padding: 12px; border: 1px solid #cbd5e1; background: ${attr.isHighlighted ? '#eff6ff' : '#f8fafc'}; text-align: left; width: 160px; font-weight: 600;">
            ${attr.attributeName} ${attr.isHighlighted ? '<span style="color:#2563eb;">★</span>' : ''}
          </th>
          ${tds}
        </tr>`;
        })
            .join('\n');
        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: comp.title,
            description: comp.summary,
            datePublished: comp.publishedAt ? comp.publishedAt.toISOString().slice(0, 10) : comp.createdAt.toISOString().slice(0, 10),
            dateModified: comp.updatedAt.toISOString().slice(0, 10),
            url: pageUrl,
            publisher: {
                '@type': 'Organization',
                name: '软游部落',
                url: domain,
            },
        };
        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${metaDescription}">
  <link rel="canonical" href="${pageUrl}">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${metaDescription}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:type" content="article">
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
  ${SeoService.getClientAssetTags()}
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1100px; margin: 0 auto; padding: 24px; line-height: 1.6; color: #1e293b;">
  <header style="border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 28px;">
    <nav style="font-size: 0.9rem; color: #64748b; margin-bottom: 12px;">
      <a href="${domain}/">软游部落首页</a> &gt; <a href="${domain}/compare">软件横向评测</a> &gt; ${comp.title}
    </nav>
    <h1 style="font-size: 2rem; margin: 0 0 12px 0; color: #0f172a;">${comp.title}</h1>
    <p style="color: #475569; font-size: 1.05rem; background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 0 8px 8px 0;">
      <strong>评测导读：</strong>${comp.summary}
    </p>
  </header>

  <main>
    <section style="margin-bottom: 36px; overflow-x: auto;">
      <h2 style="font-size: 1.4rem; margin-bottom: 16px;">核心参数与功能矩阵横向对比</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; min-width: 600px;">
        <thead>
          <tr>
            <th style="padding: 12px; border: 1px solid #cbd5e1; background: #f1f5f9; text-align: left;">对比维度</th>
            ${ths}
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>

    <section style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 36px;">
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
        <h3 style="margin-top: 0; color: #1e293b;">适合人群分析</h3>
        <p style="color: #475569; font-size: 0.95rem;">${comp.targetAudience || '适合追求工作效率与可靠稳定性的日常开发者与进阶用户。'}</p>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
        <h3 style="margin-top: 0; color: #1e293b;">常见使用场景</h3>
        <p style="color: #475569; font-size: 0.95rem;">${comp.scenarioGuide || '根据硬件配置高低、便携性需求及跨平台协同场景按需选用。'}</p>
      </div>
    </section>

    <section style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 24px; margin-bottom: 40px;">
      <h3 style="margin-top: 0; color: #1e40af;">编辑综合选型与购买/安装建议</h3>
      <p style="color: #1e3a8a; line-height: 1.8; margin-bottom: 0;">${comp.conclusion}</p>
    </section>
  </main>

  <footer style="margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 24px; text-align: center; color: #64748b;">
    <p>软游部落 &copy; ${new Date().getFullYear()} SoftBuluo.com 版权所有 | 客观中立的软件横向对比与选型指南</p>
  </footer>
</body>
</html>`;
        return { html, status: 200 };
    }
}
