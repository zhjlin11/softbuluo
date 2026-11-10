import { prisma } from '../../db';
import { ResourceStatus, ResourceType, TopicStatus } from '@prisma/client';
import { config } from '../../config';
import fs from 'fs';
import path from 'path';
/**
 * 软游部落 P3 SEO 服务端静态化与真实语义 HTML 生成引擎
 * 针对百度、Google 等搜索引擎蜘蛛及无 JS 渲染环境，生成标准可抓取 HTML5
 */
export class SeoService {
    static cachedClientScripts = null;
    static getClientAssetTags() {
        if (this.cachedClientScripts !== null) {
            return this.cachedClientScripts;
        }
        try {
            const distIndexPath = path.resolve(process.cwd(), 'dist', 'index.html');
            if (fs.existsSync(distIndexPath)) {
                const content = fs.readFileSync(distIndexPath, 'utf-8');
                const matches = [];
                const linkRegex = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
                const scriptRegex = /<script[^>]+type=["']module["'][^>]*>[\s\S]*?<\/script>/gi;
                let m;
                while ((m = linkRegex.exec(content)) !== null) {
                    matches.push(m[0]);
                }
                while ((m = scriptRegex.exec(content)) !== null) {
                    matches.push(m[0]);
                }
                this.cachedClientScripts = matches.join('\n  ');
                return this.cachedClientScripts;
            }
        }
        catch {
            // 容错处理
        }
        this.cachedClientScripts = '';
        return '';
    }
    /**
     * 生成软游部落首页的真实语义 HTML5
     */
    static async renderHomeHtml() {
        const domain = config.clientUrl;
        const pageUrl = config.getCanonicalUrl('/');
        const pageTitle = '软游部落 - 软件与游戏综合资源发布平台';
        const metaDescription = '软游部落专注为开发者、极客与游戏爱好者提供官方正规来源的正版软件、实用开发工具与精品开源游戏，规范透明、全生命周期版本追踪。';
        const categories = await prisma.category.findMany({
            where: { isVisible: true },
            orderBy: { sortOrder: 'asc' },
        });
        const featuredSoftware = await prisma.software.findMany({
            where: { status: ResourceStatus.PUBLISHED, isTestData: false, isFeatured: true },
            take: 8,
            include: { category: true },
            orderBy: { updatedAt: 'desc' },
        });
        const popularDownloads = await prisma.software.findMany({
            where: { status: ResourceStatus.PUBLISHED, isTestData: false },
            take: 10,
            orderBy: { viewCount: 'desc' },
            include: { category: true },
        });
        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: '软游部落',
            url: domain,
            description: metaDescription,
            potentialAction: {
                '@type': 'SearchAction',
                target: `${domain}/search?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
            },
        };
        const categoriesHtml = categories
            .map((c) => `<span style="margin-right: 12px; display: inline-block;"><a href="${domain}/category/${c.slug}" style="text-decoration: none; color: #2563eb; background: #eff6ff; padding: 6px 12px; border-radius: 9999px;">${this.escapeHtml(c.name)}</a></span>`)
            .join(' ');
        const featuredHtml = featuredSoftware
            .map((s) => `<div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
            <h3><a href="${domain}/software/${s.slug}" style="color: #1e293b; text-decoration: none;">${this.escapeHtml(s.name)}</a></h3>
            <p style="color: #64748b; font-size: 0.95rem;">${this.escapeHtml(s.summary)}</p>
            <p style="font-size: 0.85rem; color: #94a3b8;">分类: ${this.escapeHtml(s.category?.name || '实用工具')} | 开发者: ${this.escapeHtml(s.developer || '官方团队')}</p>
          </div>`)
            .join('\n');
        const popularHtml = popularDownloads
            .map((s, idx) => `<li><strong>TOP ${idx + 1}</strong>: <a href="${domain}/software/${s.slug}">${this.escapeHtml(s.name)}</a> - ${this.escapeHtml(s.summary)}</li>`)
            .join('\n');
        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(pageTitle)}</title>
  <meta name="description" content="${this.escapeHtml(metaDescription)}">
  <link rel="canonical" href="${pageUrl}">
  <meta property="og:title" content="${this.escapeHtml(pageTitle)}">
  <meta property="og:description" content="${this.escapeHtml(metaDescription)}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:type" content="website">
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
  ${this.getClientAssetTags()}
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 24px; line-height: 1.6; color: #1e293b;">
  <header style="border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 28px;">
    <h1>软游部落 - 官方安全核验软件与游戏资源门户</h1>
    <p style="color: #64748b; font-size: 1.1rem;">精选优质正版软件、开发工具与独立开源游戏，人工逐项核验安全来源，杜绝捆绑与篡改。</p>
    <div style="margin-top: 16px;">
      <strong>资源分类：</strong> ${categoriesHtml}
    </div>
  </header>
  <main>
    <section style="margin-bottom: 40px;">
      <h2>编辑精选推荐</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
        ${featuredHtml}
      </div>
    </section>
    <section style="margin-bottom: 40px;">
      <h2>热门下载排行榜</h2>
      <ol style="padding-left: 20px; line-height: 2;">
        ${popularHtml}
      </ol>
    </section>
  </main>
  <footer style="margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 24px; text-align: center; color: #64748b;">
    <p>软游部落 &copy; ${new Date().getFullYear()} SoftBuluo.com | 打造真实、安全、可信赖的软件与游戏综合资源发布平台</p>
  </footer>
</body>
</html>`;
        return { html, status: 200 };
    }
    /**
     * 生成单个软件/工具的真实 HTML5 页面
     */
    static async renderSoftwareHtml(slug) {
        const item = await prisma.software.findFirst({
            where: {
                OR: [
                    { slug },
                    { slug: slug === 'visual-studio-code' ? 'vscode' : slug },
                ],
                status: ResourceStatus.PUBLISHED,
            },
            include: {
                category: true,
                versions: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    include: {
                        downloadSources: true,
                    },
                },
                sources: {
                    take: 3,
                },
            },
        });
        if (!item) {
            return {
                status: 404,
                html: this.renderNotFoundHtml(`软件或工具 "${slug}" 不存在或尚未公开发布`),
            };
        }
        const domain = config.clientUrl;
        const pageUrl = config.getCanonicalUrl(`/software/${item.slug}`);
        const latestVersionObj = item.versions[0];
        const latestVersion = latestVersionObj?.version || '1.0.0';
        const releaseDate = latestVersionObj?.releaseDate || item.releaseDate || item.updatedAt.toISOString().slice(0, 10);
        const platforms = item.supportedPlatforms || 'Windows 10/11';
        const categoryName = item.category?.name || '实用软件';
        const pageTitle = `${item.name} ${latestVersion} 官方下载渠道与版本信息 - ${categoryName} - 软游部落`;
        const metaDescription = `${item.summary} 软游部落提供 ${item.name} 官方正规获取途径与版本信息，最新版本号 ${latestVersion}，支持平台：${platforms}。来源清晰、规范透明、版本更新及时追踪。`;
        // 结构化数据 Schema.org SoftwareApplication
        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: item.name,
            operatingSystem: platforms,
            applicationCategory: categoryName,
            softwareVersion: latestVersion,
            description: item.description,
            datePublished: releaseDate,
            dateModified: item.updatedAt.toISOString().slice(0, 10),
            publisher: {
                '@type': 'Organization',
                name: item.developer || '官方开发者',
            },
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'CNY',
            },
            url: pageUrl,
        };
        // 收集所有下载来源
        const sourcesList = [];
        for (const v of item.versions) {
            for (const ds of v.downloadSources) {
                sourcesList.push({ name: `${ds.sourceName} (${v.version})`, url: ds.url });
            }
        }
        if (sourcesList.length === 0 && item.officialWebsite) {
            sourcesList.push({ name: '官方官方网站下载通道', url: item.officialWebsite });
        }
        const downloadLinksHtml = sourcesList
            .map((src) => `<li><strong>${this.escapeHtml(src.name)}</strong>: <a href="${this.escapeHtml(src.url)}" rel="nofollow noopener noreferrer" target="_blank">进入官方下载通道</a></li>`)
            .join('\n');
        const versionsHtml = item.versions
            .map((v) => `<li><strong>版本 ${this.escapeHtml(v.version)}</strong> (${this.escapeHtml(v.releaseDate || '近期')}) - ${this.escapeHtml(v.changelog || '官方版本更新与性能优化')}</li>`)
            .join('\n');
        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(pageTitle)}</title>
  <meta name="description" content="${this.escapeHtml(metaDescription)}">
  <meta name="keywords" content="${this.escapeHtml(item.name)},${this.escapeHtml(categoryName)},软件下载,官方正版,绿色安全">
  <link rel="canonical" href="${pageUrl}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${this.escapeHtml(pageTitle)}">
  <meta property="og:description" content="${this.escapeHtml(metaDescription)}">
  <meta property="og:url" content="${pageUrl}">
  ${item.iconUrl ? `<meta property="og:image" content="${this.escapeHtml(item.iconUrl)}">` : ''}
  <script type="application/ld+json">
    ${JSON.stringify(jsonLd, null, 2)}
  </script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 0 auto; padding: 24px; }
    header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
    h1 { font-size: 2rem; color: #0f172a; margin-bottom: 8px; }
    .badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; margin-right: 8px; }
    .meta-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .meta-table th, .meta-table td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
    .meta-table th { background: #f8fafc; width: 140px; color: #475569; }
    .content-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .download-section { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin: 24px 0; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    footer { margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 20px; color: #64748b; font-size: 0.875rem; text-align: center; }
  </style>
  ${this.getClientAssetTags()}
</head>
<body>
  <header>
    <nav><a href="${domain}/">软游部落首页</a> &gt; <a href="${domain}/category/${item.category?.slug || 'tools'}">${this.escapeHtml(categoryName)}</a> &gt; ${this.escapeHtml(item.name)}</nav>
    <h1>${this.escapeHtml(item.name)}</h1>
    <div>
      <span class="badge">分类：${this.escapeHtml(categoryName)}</span>
      <span class="badge">最新版本：${this.escapeHtml(latestVersion)}</span>
      <span class="badge">授权：${this.escapeHtml(item.licenseType || '官方正版/免费')}</span>
    </div>
  </header>

  <main>
    <table class="meta-table">
      <tr><th>软件名称</th><td>${this.escapeHtml(item.name)}</td></tr>
      <tr><th>开发商 / 厂商</th><td>${this.escapeHtml(item.developer || '官方开发者')}</td></tr>
      <tr><th>支持操作系统</th><td>${this.escapeHtml(platforms)}</td></tr>
      <tr><th>更新日期</th><td>${releaseDate}</td></tr>
      <tr><th>官方网站</th><td><a href="${this.escapeHtml(item.officialWebsite || '#')}" rel="nofollow noopener noreferrer" target="_blank">${this.escapeHtml(item.officialWebsite || '访问官方网站')}</a></td></tr>
    </table>

    <section>
      <h2>软件简介</h2>
      <div class="content-box">
        <p>${this.escapeHtml(item.summary)}</p>
      </div>
      <h2>详细介绍与功能特性</h2>
      <div>
        <p>${this.escapeHtml(item.description).replace(/\n/g, '<br>')}</p>
      </div>
    </section>

    <section class="download-section">
      <h2>官方下载与核验信息</h2>
      <p>软游部落坚持“官方来源、无捆绑、安全可靠”的准则，以下为经过系统核验的官方来源：</p>
      <ul>
        ${downloadLinksHtml || '<li>官方下载通道维护中，请访问上方官网获取安装包。</li>'}
      </ul>
    </section>

    <section>
      <h2>历史更新版本记录</h2>
      <ul>
        ${versionsHtml || '<li>首发正式版本已录入。</li>'}
      </ul>
    </section>
  </main>

  <footer>
    <p>软游部落 - 专业的软件与游戏资源综合平台 &copy; ${new Date().getFullYear()} SoftBuluo.com 版权所有</p>
  </footer>
</body>
</html>`;
        return { html, status: 200 };
    }
    /**
     * 生成单个游戏资源的真实 HTML5 页面
     */
    static async renderGameHtml(slug) {
        const item = await prisma.software.findFirst({
            where: {
                slug,
                type: ResourceType.GAME,
                status: ResourceStatus.PUBLISHED,
            },
            include: {
                category: true,
                versions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        downloadSources: true,
                    },
                },
            },
        });
        if (!item) {
            return {
                status: 404,
                html: this.renderNotFoundHtml(`游戏资源 "${slug}" 不存在或尚未公开发布`),
            };
        }
        const domain = config.clientUrl;
        const pageUrl = config.getCanonicalUrl(`/game/${item.slug}`);
        const categoryName = item.category?.name || '精品游戏';
        const platforms = item.supportedPlatforms || 'Windows / macOS / Linux';
        const pageTitle = `${item.name} 正版/开源游戏获取入口与安装指南 - 软游部落游戏专区`;
        const metaDescription = `${item.summary} 软游部落游戏频道为您提供 ${item.name} 的官方发行信息、支持平台（${platforms}）、正规分发渠道及安装指引。`;
        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'VideoGame',
            name: item.name,
            gamePlatform: platforms,
            genre: item.genre || '综合游戏',
            publisher: item.publisher || item.developer || '官方发行商',
            description: item.description,
            url: pageUrl,
        };
        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(pageTitle)}</title>
  <meta name="description" content="${this.escapeHtml(metaDescription)}">
  <link rel="canonical" href="${pageUrl}">
  <script type="application/ld+json">
    ${JSON.stringify(jsonLd, null, 2)}
  </script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 0 auto; padding: 24px; }
    header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
    h1 { font-size: 2rem; color: #0f172a; }
    .badge { display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; margin-right: 8px; }
    .meta-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .meta-table th, .meta-table td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
    .meta-table th { background: #f8fafc; width: 140px; color: #475569; }
    .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0; }
    a { color: #2563eb; text-decoration: none; }
  </style>
  ${this.getClientAssetTags()}
</head>
<body>
  <header>
    <nav><a href="${domain}/">软游部落首页</a> &gt; <a href="${domain}/games">游戏专区</a> &gt; ${this.escapeHtml(item.name)}</nav>
    <h1>${this.escapeHtml(item.name)}</h1>
    <div>
      <span class="badge">分类：${this.escapeHtml(categoryName)}</span>
      <span class="badge">类型：${this.escapeHtml(item.genre || '综合游戏')}</span>
      <span class="badge">价格类型：${this.escapeHtml(item.priceType || '免费/开源')}</span>
      <span class="badge">分发渠道：${this.escapeHtml(item.distributionPlatform || '官方正规分发')}</span>
    </div>
  </header>
  <main>
    <table class="meta-table">
      <tr><th>游戏名称</th><td>${this.escapeHtml(item.name)}</td></tr>
      <tr><th>开发商 / 发行商</th><td>${this.escapeHtml(item.publisher || item.developer || '官方团队')}</td></tr>
      <tr><th>支持运行平台</th><td>${this.escapeHtml(platforms)}</td></tr>
      <tr><th>官方分发渠道</th><td>${this.escapeHtml(item.distributionPlatform || 'Steam / 官方网站 / 开源托管')}</td></tr>
      <tr><th>官方主页</th><td><a href="${this.escapeHtml(item.officialWebsite || '#')}" rel="nofollow noopener noreferrer" target="_blank">${this.escapeHtml(item.officialWebsite || '访问官方发布页面')}</a></td></tr>
    </table>
    <section>
      <h2>游戏介绍与背景</h2>
      <div class="info-box">
        <p>${this.escapeHtml(item.summary)}</p>
      </div>
      <div>
        <p>${this.escapeHtml(item.description).replace(/\n/g, '<br>')}</p>
      </div>
    </section>
  </main>
  <footer style="margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b;">
    <p>软游部落 - 绿色正规游戏资源门户 &copy; ${new Date().getFullYear()} SoftBuluo.com</p>
  </footer>
</body>
</html>`;
        return { html, status: 200 };
    }
    /**
     * 生成分类汇总页真实 HTML
     */
    static async renderCategoryHtml(slug, page = 1, pageSize = 20) {
        const normalizedSlug = slug === 'developer-tools' ? 'dev' : slug;
        const category = await prisma.category.findFirst({
            where: {
                OR: [{ slug }, { slug: normalizedSlug }],
            },
        });
        if (!category) {
            return {
                status: 404,
                html: this.renderNotFoundHtml(`分类目录 "${slug}" 未找到`),
            };
        }
        const [items, total] = await Promise.all([
            prisma.software.findMany({
                where: {
                    categoryId: category.id,
                    status: ResourceStatus.PUBLISHED,
                },
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    versions: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
            }),
            prisma.software.count({
                where: {
                    categoryId: category.id,
                    status: ResourceStatus.PUBLISHED,
                },
            }),
        ]);
        const domain = config.clientUrl;
        const pageUrl = `${domain}/category/${category.slug}`;
        const pageTitle = `${category.name} 软件与工具大全 (第 ${page} 页) - 软游部落`;
        const metaDescription = `${category.description || category.name}：软游部落收录全部 ${total} 款经过官方来源核验的正规软件与工具，无捆绑、高速安全获取。`;
        const itemsHtml = items
            .map((it) => {
            const v = it.versions[0]?.version || '最新版';
            return `
      <article style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <h3 style="margin-top:0;"><a href="${domain}/software/${it.slug}">${this.escapeHtml(it.name)}</a></h3>
        <p style="color: #64748b; font-size: 0.9rem;">版本：${this.escapeHtml(v)} | 开发者：${this.escapeHtml(it.developer || '官方')} | 更新：${it.updatedAt.toISOString().slice(0, 10)}</p>
        <p>${this.escapeHtml(it.summary)}</p>
      </article>
    `;
        })
            .join('\n');
        const totalPages = Math.ceil(total / pageSize);
        const paginationHtml = `
      <div style="margin-top: 24px; text-align: center;">
        ${page > 1 ? `<a href="?page=${page - 1}" style="margin-right: 12px;">上一页</a>` : ''}
        <span>第 ${page} / ${totalPages || 1} 页 (共 ${total} 款软件)</span>
        ${page < totalPages ? `<a href="?page=${page + 1}" style="margin-left: 12px;">下一页</a>` : ''}
      </div>
    `;
        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(pageTitle)}</title>
  <meta name="description" content="${this.escapeHtml(metaDescription)}">
  <link rel="canonical" href="${pageUrl}">
  ${this.getClientAssetTags()}
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 900px; margin: 0 auto; padding: 24px; line-height: 1.6;">
  <header style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px;">
    <nav><a href="${domain}/">软游部落首页</a> &gt; ${this.escapeHtml(category.name)}</nav>
    <h1>${this.escapeHtml(category.name)} 软件合集</h1>
    <p style="color: #475569;">${this.escapeHtml(category.description || '官方收录与安全核验软件列表')}</p>
  </header>
  <main>
    ${itemsHtml || '<p>当前分类下暂无已发布资源。</p>'}
    ${paginationHtml}
  </main>
  <footer style="margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b;">
    <p>软游部落 &copy; ${new Date().getFullYear()} SoftBuluo.com</p>
  </footer>
</body>
</html>`;
        return { html, status: 200 };
    }
    /**
     * 生成专题页真实 HTML
     */
    static async renderTopicHtml(slug) {
        const topic = await prisma.topic.findUnique({
            where: { slug },
            include: {
                resources: {
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        software: true,
                    },
                },
            },
        });
        if (!topic || topic.status !== TopicStatus.PUBLISHED) {
            return {
                status: 404,
                html: this.renderNotFoundHtml(`精选专题 "${slug}" 不存在或尚未发布`),
            };
        }
        const domain = config.clientUrl;
        const pageUrl = `${domain}/topics/${topic.slug}`;
        const pageTitle = `${topic.seoTitle || topic.title} - 软游部落精选专题`;
        const metaDescription = topic.seoDescription || topic.description;
        const resourcesHtml = topic.resources
            .map((tr) => `
      <article style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <h3 style="margin-top:0;"><a href="${domain}/software/${tr.software.slug}">${this.escapeHtml(tr.software.name)}</a></h3>
        <p style="color: #64748b; font-size: 0.9rem;">${this.escapeHtml(tr.software.summary)}</p>
        ${tr.customNote ? `<p style="background: #f1f5f9; padding: 8px 12px; border-radius: 4px; font-size: 0.875rem;"><strong>编辑推荐：</strong>${this.escapeHtml(tr.customNote)}</p>` : ''}
      </article>
    `)
            .join('\n');
        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(pageTitle)}</title>
  <meta name="description" content="${this.escapeHtml(metaDescription)}">
  <link rel="canonical" href="${pageUrl}">
  ${this.getClientAssetTags()}
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 900px; margin: 0 auto; padding: 24px; line-height: 1.6;">
  <header style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px;">
    <nav><a href="${domain}/">软游部落首页</a> &gt; <a href="${domain}/topics">精选专题</a> &gt; ${this.escapeHtml(topic.title)}</nav>
    <h1>${this.escapeHtml(topic.title)}</h1>
    <p style="color: #475569; font-size: 1.1rem;">${this.escapeHtml(topic.description)}</p>
  </header>
  <main>
    <section>
      <h2>专题收录软件</h2>
      ${resourcesHtml || '<p>专题内容整理中。</p>'}
    </section>
  </main>
  <footer style="margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b;">
    <p>软游部落 &copy; ${new Date().getFullYear()} SoftBuluo.com</p>
  </footer>
</body>
</html>`;
        return { html, status: 200 };
    }
    /**
     * 生成教程真实 HTML
     */
    static async renderTutorialHtml(slug) {
        const item = await prisma.tutorial.findUnique({
            where: { slug },
            include: {
                software: true,
            },
        });
        if (!item) {
            return {
                status: 404,
                html: this.renderNotFoundHtml(`教程 "${slug}" 不存在`),
            };
        }
        const domain = config.clientUrl;
        const pageUrl = `${domain}/tutorials/${item.slug}`;
        const pageTitle = `${item.seoTitle || item.title} - 软游部落实用教程`;
        const metaDescription = item.seoDescription || item.summary;
        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(pageTitle)}</title>
  <meta name="description" content="${this.escapeHtml(metaDescription)}">
  <link rel="canonical" href="${pageUrl}">
  ${this.getClientAssetTags()}
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 900px; margin: 0 auto; padding: 24px; line-height: 1.6;">
  <header style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px;">
    <nav><a href="${domain}/">软游部落首页</a> &gt; <a href="${domain}/tutorials">教程指南</a> &gt; ${this.escapeHtml(item.title)}</nav>
    <h1>${this.escapeHtml(item.title)}</h1>
    <p style="color: #64748b;">更新时间：${item.updatedAt.toISOString().slice(0, 10)}${item.software ? ` | 关联软件：${this.escapeHtml(item.software.name)}` : ''}</p>
  </header>
  <main>
    <article style="font-size: 1.05rem;">
      <p style="background: #f8fafc; padding: 12px 16px; border-left: 4px solid #3b82f6; border-radius: 4px;"><strong>导读：</strong>${this.escapeHtml(item.summary)}</p>
      <div>${this.escapeHtml(item.content).replace(/\n/g, '<br>')}</div>
    </article>
  </main>
  <footer style="margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b;">
    <p>软游部落 &copy; ${new Date().getFullYear()} SoftBuluo.com</p>
  </footer>
</body>
</html>`;
        return { html, status: 200 };
    }
    static renderNotFoundHtml(message) {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>404 - 页面未找到 - 软游部落</title>
</head>
<body style="font-family: sans-serif; text-align: center; padding: 50px;">
  <h1>404 Not Found</h1>
  <p>${this.escapeHtml(message)}</p>
  <p><a href="${config.clientUrl}/">返回软游部落首页</a></p>
</body>
</html>`;
    }
    static escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
