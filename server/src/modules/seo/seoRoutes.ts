import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { SeoService } from './seoService';
import { ComparisonService } from '../comparisons/comparisonService';
import { prisma } from '../../db';
import { ResourceStatus, ResourceType, TopicStatus, ComparisonStatus } from '@prisma/client';
import { config } from '../../config';

export const seoRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // ================= 真正公开 URL 服务端 HTML 输出（用户与搜索引擎同一入口） =================

  // 1. 首页公开 HTML
  server.get('/', async (req, reply) => {
    const { html, status } = await SeoService.renderHomeHtml();
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  // 1.5 电脑软件频道公开 HTML (/software)
  server.get('/software', async (_req, reply) => {
    const { html, status } = await SeoService.renderSoftwareChannelHtml();
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  // 1.6 系统工具频道公开 HTML (/system-tools)
  server.get('/system-tools', async (_req, reply) => {
    const { html, status } = await SeoService.renderSystemToolsChannelHtml();
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  // 1.7 游戏中心频道公开 HTML (/games)
  server.get('/games', async (_req, reply) => {
    const { html, status } = await SeoService.renderGamesChannelHtml();
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  // 1.8 装机必备频道公开 HTML (/essentials)
  server.get('/essentials', async (_req, reply) => {
    const { html, status } = await SeoService.renderEssentialsChannelHtml();
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  // 1.9 对比评测频道公开 HTML (/compare)
  server.get('/compare', async (_req, reply) => {
    const { html, status } = await SeoService.renderCompareChannelHtml();
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  // 1.10 社区交流频道公开 HTML (/community)
  server.get('/community', async (_req, reply) => {
    const { html, status } = await SeoService.renderCommunityChannelHtml();
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  // 1.11 社区讨论详情公开 HTML (/community/thread/:id)
  server.get<{ Params: { id: string } }>('/community/thread/:id', async (req, reply) => {
    const { id } = req.params;
    const { html, status } = await SeoService.renderCommunityThreadHtml(id);
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  // 1.12 最新更新频道公开 HTML (/updates) (P8.7.10)
  server.get('/updates', async (_req, reply) => {
    const { html, status } = await SeoService.renderUpdatesChannelHtml();
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  // 1.13 软件教程频道公开 HTML (/tutorials) (P8.7.8)
  server.get('/tutorials', async (_req, reply) => {
    const { html, status } = await SeoService.renderTutorialsChannelHtml();
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  // 2. 软件横向对比评测页面（/compare/:slug）
  server.get<{ Params: { slug: string } }>('/compare/:slug', async (req, reply) => {
    const { slug } = req.params;
    const { html, status } = await ComparisonService.renderComparisonHtml(slug);
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  // 2. 软件公开正式页面（/software/:slug）
  server.get<{ Params: { slug: string } }>('/software/:slug', async (req, reply) => {
    const { slug } = req.params;
    const { html, status } = await SeoService.renderSoftwareHtml(slug);
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  // 兼容别名路径 /tool/:slug
  server.get<{ Params: { slug: string } }>('/tool/:slug', async (req, reply) => {
    const { slug } = req.params;
    const { html, status } = await SeoService.renderSoftwareHtml(slug);
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  // 3. 游戏公开正式页面（/game/:slug）
  server.get<{ Params: { slug: string } }>('/game/:slug', async (req, reply) => {
    const { slug } = req.params;
    const { html, status } = await SeoService.renderGameHtml(slug);
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  // 4. 分类公开正式页面（/category/:slug）
  server.get<{ Params: { slug: string }; Querystring: { page?: string } }>(
    '/category/:slug',
    async (req, reply) => {
      const { slug } = req.params;
      const page = parseInt(req.query.page || '1', 10) || 1;
      const { html, status } = await SeoService.renderCategoryHtml(slug, page);
      reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
      return reply.send(html);
    }
  );

  // 5. 专题公开正式页面（/topics/:slug）
  server.get<{ Params: { slug: string } }>('/topics/:slug', async (req, reply) => {
    const { slug } = req.params;
    const { html, status } = await SeoService.renderTopicHtml(slug);
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  // 6. 教程公开正式页面（兼容 /tutorials/:slug 与 /tutorial/:slug）
  server.get<{ Params: { slug: string } }>('/tutorials/:slug', async (req, reply) => {
    const { slug } = req.params;
    const { html, status } = await SeoService.renderTutorialHtml(slug);
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  server.get<{ Params: { slug: string } }>('/tutorial/:slug', async (req, reply) => {
    const { slug } = req.params;
    const { html, status } = await SeoService.renderTutorialHtml(slug);
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  // ================= 兼容历史 /seo/... 内部端点 =================
  server.get('/seo/software', async (_req, reply) => {
    const { html, status } = await SeoService.renderSoftwareChannelHtml();
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  server.get('/seo/system-tools', async (_req, reply) => {
    const { html, status } = await SeoService.renderSystemToolsChannelHtml();
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  server.get('/seo/essentials', async (_req, reply) => {
    const { html, status } = await SeoService.renderEssentialsChannelHtml();
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  server.get('/seo/compare', async (_req, reply) => {
    const { html, status } = await SeoService.renderCompareChannelHtml();
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  server.get('/seo/community', async (_req, reply) => {
    const { html, status } = await SeoService.renderCommunityChannelHtml();
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  server.get<{ Params: { id: string } }>('/seo/community/thread/:id', async (req, reply) => {
    const { id } = req.params;
    const { html, status } = await SeoService.renderCommunityThreadHtml(id);
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  server.get<{ Params: { slug: string } }>('/seo/software/:slug', async (req, reply) => {
    const { slug } = req.params;
    const { html, status } = await SeoService.renderSoftwareHtml(slug);
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  server.get<{ Params: { slug: string } }>('/seo/game/:slug', async (req, reply) => {
    const { slug } = req.params;
    const { html, status } = await SeoService.renderGameHtml(slug);
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  server.get<{ Params: { slug: string }; Querystring: { page?: string } }>(
    '/seo/category/:slug',
    async (req, reply) => {
      const { slug } = req.params;
      const page = parseInt(req.query.page || '1', 10) || 1;
      const { html, status } = await SeoService.renderCategoryHtml(slug, page);
      reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
      return reply.send(html);
    }
  );

  server.get<{ Params: { slug: string } }>('/seo/topics/:slug', async (req, reply) => {
    const { slug } = req.params;
    const { html, status } = await SeoService.renderTopicHtml(slug);
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  server.get('/seo/tutorials', async (_req, reply) => {
    const { html, status } = await SeoService.renderTutorialsChannelHtml();
    reply.status(status).header('Content-Type', 'text/html; charset=utf-8');
    return reply.send(html);
  });

  server.get<{ Params: { slug: string } }>('/seo/tutorials/:slug', async (req, reply) => {
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
    <loc>${domain}/sitemap-essentials.xml</loc>
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
  <sitemap>
    <loc>${domain}/sitemap-developers.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${domain}/sitemap-community.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${domain}/sitemap-updates.xml</loc>
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
    xml += `  <url>\n    <loc>${domain}/software</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.95</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${domain}/system-tools</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.95</priority>\n  </url>\n`;
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
    xml += `  <url>\n    <loc>${domain}/games</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.95</priority>\n  </url>\n`;
    for (const it of items) {
      xml += `  <url>\n    <loc>${domain}/game/${it.slug}</loc>\n    <lastmod>${it.updatedAt.toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
    }
    xml += `</urlset>`;

    reply.header('Content-Type', 'application/xml; charset=utf-8');
    return reply.send(xml);
  });

  // 装机必备 Sitemap
  server.get('/sitemap-essentials.xml', async (_req, reply) => {
    const domain = config.clientUrl;
    const today = new Date().toISOString().slice(0, 10);

    const essentialTopics = await prisma.topic.findMany({
      where: {
        status: TopicStatus.PUBLISHED,
        NOT: { slug: { startsWith: 'topic-p3-' } },
        slug: {
          in: [
            'win11-essential-tools',
            'genuine-microsoft-installation-media',
            'open-source-office-suite',
            'disk-health-diagnosis',
            'software-clean-uninstallation',
            'windows-sysinternals-guide',
          ],
        },
      },
      select: { slug: true, updatedAt: true },
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `  <url>\n    <loc>${domain}/essentials</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.95</priority>\n  </url>\n`;
    for (const tp of essentialTopics) {
      xml += `  <url>\n    <loc>${domain}/topics/${tp.slug}</loc>\n    <lastmod>${tp.updatedAt.toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
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
      where: {
        status: TopicStatus.PUBLISHED,
        NOT: { slug: { startsWith: 'topic-p3-' } },
      },
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
      where: {
        status: 'PUBLISHED',
        NOT: { slug: { startsWith: 'tut-p3-' } },
      },
      select: { slug: true, updatedAt: true },
    });

    const domain = config.clientUrl;
    const now = new Date().toISOString().slice(0, 10);
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `  <url>\n    <loc>${domain}/tutorials</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
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

  // 开发者 Sitemap (仅限已认证开发者)
  server.get('/sitemap-developers.xml', async (req, reply) => {
    const items = await prisma.developerProfile.findMany({
      where: { verificationStatus: 'VERIFIED' },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    const domain = config.clientUrl;
    const now = new Date().toISOString().slice(0, 10);
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `  <url>\n    <loc>${domain}/developers</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    for (const it of items) {
      xml += `  <url>\n    <loc>${domain}/developers/${it.slug}</loc>\n    <lastmod>${it.updatedAt.toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }
    xml += `</urlset>`;

    reply.header('Content-Type', 'application/xml; charset=utf-8');
    return reply.send(xml);
  });

  // 社区精选讨论 Sitemap (仅限有内容讨论，拒绝空帖)
  server.get('/sitemap-community.xml', async (req, reply) => {
    const items = await prisma.discussionThread.findMany({
      where: {
        status: 'ACTIVE',
        replyCount: { gt: 0 }
      },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 200
    });

    const domain = config.clientUrl;
    const now = new Date().toISOString().slice(0, 10);
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `  <url>\n    <loc>${domain}/community</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    for (const it of items) {
      xml += `  <url>\n    <loc>${domain}/community/thread/${it.id}</loc>\n    <lastmod>${it.updatedAt.toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }
    xml += `</urlset>`;

    reply.header('Content-Type', 'application/xml; charset=utf-8');
    return reply.send(xml);
  });

  // 最新更新频道 Sitemap (P8.7.10)
  server.get('/sitemap-updates.xml', async (_req, reply) => {
    const domain = config.clientUrl;
    const now = new Date().toISOString().slice(0, 10);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${domain}/updates</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.95</priority>\n  </url>\n</urlset>`;

    reply.header('Content-Type', 'application/xml; charset=utf-8');
    return reply.send(xml);
  });

  // robots.txt 规范输出
  server.get('/robots.txt', async (req, reply) => {
    const domain = config.clientUrl;
    const robots = `# 软游部落网络爬虫协议规范
User-agent: *
Allow: /
Allow: /software
Allow: /software/
Allow: /system-tools
Allow: /games
Allow: /game/
Allow: /essentials
Allow: /updates
Allow: /category/
Allow: /topics/
Allow: /tutorials/
Allow: /compare/
Allow: /compare
Allow: /developers/
Allow: /developer
Allow: /community
Allow: /community/
Allow: /seo/
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /account/
Disallow: /checkout/
Disallow: /developer/api-keys
Disallow: /developer/submissions
Disallow: /developer/claims

Sitemap: ${domain}/sitemap.xml
Sitemap: ${domain}/sitemap-software.xml
Sitemap: ${domain}/sitemap-games.xml
Sitemap: ${domain}/sitemap-essentials.xml
Sitemap: ${domain}/sitemap-updates.xml
Sitemap: ${domain}/sitemap-comparisons.xml
Sitemap: ${domain}/sitemap-categories.xml
Sitemap: ${domain}/sitemap-topics.xml
Sitemap: ${domain}/sitemap-tutorials.xml
Sitemap: ${domain}/sitemap-developers.xml
Sitemap: ${domain}/sitemap-community.xml
`;
    reply.header('Content-Type', 'text/plain; charset=utf-8');
    return reply.send(robots);
  });
};
