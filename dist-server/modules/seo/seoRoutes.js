import { SeoService } from './seoService';
import { ComparisonService } from '../comparisons/comparisonService';
import { prisma } from '../../db';
import { ResourceStatus, ResourceType, TopicStatus, ComparisonStatus } from '@prisma/client';
import { config } from '../../config';
export const seoRoutes = async (server) => {
    // ================= 真正公开 URL 服务端 HTML 输出（用户与搜索引擎同一入口） =================
    // 1. 首页公开 HTML
    server.get('/', async (req, reply) => {
        const { html, status } = await SeoService.renderHomeHtml();
        reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
        return reply.send(html);
    });
    // 2. 软件横向对比评测页面（/compare/:slug 及 /compare 列表）
    server.get('/compare/:slug', async (req, reply) => {
        const { slug } = req.params;
        const { html, status } = await ComparisonService.renderComparisonHtml(slug);
        reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
        return reply.send(html);
    });
    server.get('/compare', async (req, reply) => {
        const comparisons = await ComparisonService.listPublished(1, 30);
        const domain = config.clientUrl;
        const pageUrl = config.getCanonicalUrl('/compare');
        const pageTitle = '软件横向对比与选型指南 - 深度参数功能评测 - 软游部落';
        const metaDescription = '软游部落精选多款主流软件与开源替代品的全面横向参数对比、适用人群分析与客观选型安装建议。';
        const cards = comparisons.items.map((it) => `
      <article style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; background: #fff; margin-bottom: 16px;">
        <h2 style="font-size: 1.25rem; margin-top: 0; margin-bottom: 8px;">
          <a href="${domain}/compare/${it.slug}" style="color: #2563eb; text-decoration: none;">${it.title}</a>
        </h2>
        <p style="color: #64748b; font-size: 0.95rem; line-height: 1.6; margin-bottom: 12px;">${it.summary}</p>
        <div style="font-size: 0.85rem; color: #94a3b8;">
          对比产品：${it.items.map(s => s.software.name).join(' vs ')}
        </div>
      </article>
    `).join('\n');
        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${metaDescription}">
  <link rel="canonical" href="${pageUrl}">
  ${SeoService.getClientAssetTags()}
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1000px; margin: 0 auto; padding: 24px; color: #1e293b;">
  <header style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px;">
    <nav style="font-size: 0.9rem; color: #64748b; margin-bottom: 8px;"><a href="${domain}/">软游部落首页</a> &gt; 软件横向评测</nav>
    <h1 style="font-size: 2rem; margin: 0; color: #0f172a;">软件横向对比与客观选型指南</h1>
    <p style="color: #64748b; margin-top: 8px;">拒绝充值软文与虚假排行榜，为您提供基于真实环境的软件深度对比。</p>
  </header>
  <main>
    ${cards || '<p style="color:#64748b;">暂无已发布对比，敬请期待更新。</p>'}
  </main>
  <footer style="margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 24px; text-align: center; color: #64748b;">
    <p>软游部落 &copy; ${new Date().getFullYear()} SoftBuluo.com 版权所有</p>
  </footer>
</body>
</html>`;
        reply.status(200).header('Content-Type', 'text/html; charset=utf-8');
        return reply.send(html);
    });
    // 2. 软件公开正式页面（/software/:slug）
    server.get('/software/:slug', async (req, reply) => {
        const { slug } = req.params;
        const { html, status } = await SeoService.renderSoftwareHtml(slug);
        reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
        return reply.send(html);
    });
    // 兼容别名路径 /tool/:slug
    server.get('/tool/:slug', async (req, reply) => {
        const { slug } = req.params;
        const { html, status } = await SeoService.renderSoftwareHtml(slug);
        reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
        return reply.send(html);
    });
    // 3. 游戏公开正式页面（/game/:slug）
    server.get('/game/:slug', async (req, reply) => {
        const { slug } = req.params;
        const { html, status } = await SeoService.renderGameHtml(slug);
        reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
        return reply.send(html);
    });
    // 4. 分类公开正式页面（/category/:slug）
    server.get('/category/:slug', async (req, reply) => {
        const { slug } = req.params;
        const page = parseInt(req.query.page || '1', 10) || 1;
        const { html, status } = await SeoService.renderCategoryHtml(slug, page);
        reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
        return reply.send(html);
    });
    // 5. 专题公开正式页面（/topics/:slug）
    server.get('/topics/:slug', async (req, reply) => {
        const { slug } = req.params;
        const { html, status } = await SeoService.renderTopicHtml(slug);
        reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
        return reply.send(html);
    });
    // 6. 教程公开正式页面（兼容 /tutorials/:slug 与 /tutorial/:slug）
    server.get('/tutorials/:slug', async (req, reply) => {
        const { slug } = req.params;
        const { html, status } = await SeoService.renderTutorialHtml(slug);
        reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
        return reply.send(html);
    });
    server.get('/tutorial/:slug', async (req, reply) => {
        const { slug } = req.params;
        const { html, status } = await SeoService.renderTutorialHtml(slug);
        reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
        return reply.send(html);
    });
    // ================= 兼容历史 /seo/... 内部端点 =================
    server.get('/seo/software/:slug', async (req, reply) => {
        const { slug } = req.params;
        const { html, status } = await SeoService.renderSoftwareHtml(slug);
        reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
        return reply.send(html);
    });
    server.get('/seo/game/:slug', async (req, reply) => {
        const { slug } = req.params;
        const { html, status } = await SeoService.renderGameHtml(slug);
        reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
        return reply.send(html);
    });
    server.get('/seo/category/:slug', async (req, reply) => {
        const { slug } = req.params;
        const page = parseInt(req.query.page || '1', 10) || 1;
        const { html, status } = await SeoService.renderCategoryHtml(slug, page);
        reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
        return reply.send(html);
    });
    server.get('/seo/topics/:slug', async (req, reply) => {
        const { slug } = req.params;
        const { html, status } = await SeoService.renderTopicHtml(slug);
        reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
        return reply.send(html);
    });
    server.get('/seo/tutorials/:slug', async (req, reply) => {
        const { slug } = req.params;
        const { html, status } = await SeoService.renderTutorialHtml(slug);
        reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
        return reply.send(html);
    });
    // ================= 动态 Sitemap 索引与分表 =================
    // 主 Sitemap 索引
    server.get('/sitemap.xml', async (req, reply) => {
        const domain = config.clientUrl;
        const now = new Date().toISOString().slice(0, 10);
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${domain}/sitemap-software.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${domain}/sitemap-games.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${domain}/sitemap-comparisons.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${domain}/sitemap-categories.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${domain}/sitemap-topics.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${domain}/sitemap-tutorials.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
        reply.header('Content-Type', 'application/xml; charset=utf-8');
        return reply.send(xml);
    });
    // 软件 Sitemap
    server.get('/sitemap-software.xml', async (req, reply) => {
        const items = await prisma.software.findMany({
            where: {
                status: ResourceStatus.PUBLISHED,
                type: { not: ResourceType.GAME },
                isTestData: false,
            },
            select: { slug: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
        });
        const domain = config.clientUrl;
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        for (const it of items) {
            xml += `  <url>\n    <loc>${domain}/software/${it.slug}</loc>\n    <lastmod>${it.updatedAt.toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
            xml += `  <url>\n    <loc>${domain}/tool/${it.slug}</loc>\n    <lastmod>${it.updatedAt.toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
        }
        xml += `</urlset>`;
        reply.header('Content-Type', 'application/xml; charset=utf-8');
        return reply.send(xml);
    });
    // 游戏 Sitemap
    server.get('/sitemap-games.xml', async (req, reply) => {
        const items = await prisma.software.findMany({
            where: {
                status: ResourceStatus.PUBLISHED,
                type: ResourceType.GAME,
                isTestData: false,
            },
            select: { slug: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
        });
        const domain = config.clientUrl;
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        for (const it of items) {
            xml += `  <url>\n    <loc>${domain}/game/${it.slug}</loc>\n    <lastmod>${it.updatedAt.toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
        }
        xml += `</urlset>`;
        reply.header('Content-Type', 'application/xml; charset=utf-8');
        return reply.send(xml);
    });
    // 分类 Sitemap
    server.get('/sitemap-categories.xml', async (req, reply) => {
        const items = await prisma.category.findMany({
            where: { isVisible: true },
            select: { slug: true, updatedAt: true },
        });
        const domain = config.clientUrl;
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        for (const it of items) {
            xml += `  <url>\n    <loc>${domain}/category/${it.slug}</loc>\n    <lastmod>${it.updatedAt.toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        }
        xml += `</urlset>`;
        reply.header('Content-Type', 'application/xml; charset=utf-8');
        return reply.send(xml);
    });
    // 专题 Sitemap
    server.get('/sitemap-topics.xml', async (req, reply) => {
        const items = await prisma.topic.findMany({
            where: { status: TopicStatus.PUBLISHED },
            select: { slug: true, updatedAt: true },
        });
        const domain = config.clientUrl;
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        for (const it of items) {
            xml += `  <url>\n    <loc>${domain}/topics/${it.slug}</loc>\n    <lastmod>${it.updatedAt.toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        }
        xml += `</urlset>`;
        reply.header('Content-Type', 'application/xml; charset=utf-8');
        return reply.send(xml);
    });
    // 教程 Sitemap
    server.get('/sitemap-tutorials.xml', async (req, reply) => {
        const items = await prisma.tutorial.findMany({
            select: { slug: true, updatedAt: true },
        });
        const domain = config.clientUrl;
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        for (const it of items) {
            xml += `  <url>\n    <loc>${domain}/tutorials/${it.slug}</loc>\n    <lastmod>${it.updatedAt.toISOString().slice(0, 10)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
        }
        xml += `</urlset>`;
        reply.header('Content-Type', 'application/xml; charset=utf-8');
        return reply.send(xml);
    });
    // 对比 Sitemap
    server.get('/sitemap-comparisons.xml', async (req, reply) => {
        const items = await prisma.softwareComparison.findMany({
            where: { status: ComparisonStatus.PUBLISHED },
            select: { slug: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
        });
        const domain = config.clientUrl;
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        xml += `  <url>\n    <loc>${domain}/compare</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
        for (const it of items) {
            xml += `  <url>\n    <loc>${domain}/compare/${it.slug}</loc>\n    <lastmod>${it.updatedAt.toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
        }
        xml += `</urlset>`;
        reply.header('Content-Type', 'application/xml; charset=utf-8');
        return reply.send(xml);
    });
    // robots.txt 规范输出
    server.get('/robots.txt', async (req, reply) => {
        const domain = config.clientUrl;
        const robots = `# 软游部落网络爬虫协议规范
User-agent: *
Allow: /
Allow: /software/
Allow: /game/
Allow: /category/
Allow: /topics/
Allow: /tutorials/
Allow: /compare/
Allow: /compare
Allow: /seo/
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /account/
Disallow: /checkout/

Sitemap: ${domain}/sitemap.xml
Sitemap: ${domain}/sitemap-software.xml
Sitemap: ${domain}/sitemap-games.xml
Sitemap: ${domain}/sitemap-comparisons.xml
Sitemap: ${domain}/sitemap-categories.xml
Sitemap: ${domain}/sitemap-topics.xml
Sitemap: ${domain}/sitemap-tutorials.xml
`;
        reply.header('Content-Type', 'text/plain; charset=utf-8');
        return reply.send(robots);
    });
};
