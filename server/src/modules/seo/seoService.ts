import { prisma } from '../../db';
import { ResourceStatus, ResourceType, TopicStatus } from '@prisma/client';
import { config } from '../../config';
import { SoftwareChannelService } from '../channels/softwareChannelService';
import { SystemToolsChannelService } from '../channels/systemToolsChannelService';
import { GamesChannelService } from '../channels/gamesChannelService';
import { EssentialsChannelService } from '../channels/essentialsChannelService';
import { CompareChannelService } from '../channels/compareChannelService';
import { UpdatesChannelService } from '../channels/updatesChannelService';
import { CommunityService } from '../community/communityService';
import fs from 'fs';
import path from 'path';

/**
 * 软游部落 P3 SEO 服务端静态化与真实语义 HTML 生成引擎
 * 针对百度、Google 等搜索引擎蜘蛛及无 JS 渲染环境，生成标准可抓取 HTML5
 */
export class SeoService {
  private static cachedClientScripts: string | null = null;

  public static getClientAssetTags(): string {
    if (this.cachedClientScripts !== null) {
      return this.cachedClientScripts;
    }

    try {
      const distIndexPath = path.resolve(process.cwd(), 'dist', 'index.html');
      if (fs.existsSync(distIndexPath)) {
        const content = fs.readFileSync(distIndexPath, 'utf-8');
        const matches: string[] = [];
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
    } catch {
      // 容错处理
    }

    this.cachedClientScripts = '';
    return '';
  }

  /**
   * 生成软游部落首页的真实语义 HTML5
   */
  static async renderHomeHtml(): Promise<{ html: string; status: number }> {
    const domain = config.clientUrl;
    const pageUrl = config.getCanonicalUrl('/');
    const pageTitle = '软游部落 - 软件与游戏综合资源发布平台';
    const metaDescription =
      '软游部落专注为开发者、极客与游戏爱好者提供官方正规来源的正版软件、实用开发工具与精品开源游戏，规范透明、全生命周期版本追踪。';

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
      .map(
        (c) =>
          `<span style="margin-right: 12px; display: inline-block;"><a href="${domain}/category/${c.slug}" style="text-decoration: none; color: #2563eb; background: #eff6ff; padding: 6px 12px; border-radius: 9999px;">${this.escapeHtml(c.name)}</a></span>`
      )
      .join(' ');

    const featuredHtml = featuredSoftware
      .map(
        (s) =>
          `<div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
            <h3><a href="${domain}/software/${s.slug}" style="color: #1e293b; text-decoration: none;">${this.escapeHtml(s.name)}</a></h3>
            <p style="color: #64748b; font-size: 0.95rem;">${this.escapeHtml(s.summary)}</p>
            <p style="font-size: 0.85rem; color: #94a3b8;">分类: ${this.escapeHtml(s.category?.name || '实用工具')} | 开发者: ${this.escapeHtml(s.developer || '官方团队')}</p>
          </div>`
      )
      .join('\n');

    const popularHtml = popularDownloads
      .map(
        (s, idx) =>
          `<li><strong>TOP ${idx + 1}</strong>: <a href="${domain}/software/${s.slug}">${this.escapeHtml(s.name)}</a> - ${this.escapeHtml(s.summary)}</li>`
      )
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
  static async renderSoftwareHtml(slug: string): Promise<{ html: string; status: number }> {
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
    const sourcesList: { name: string; url: string }[] = [];
    for (const v of item.versions) {
      for (const ds of v.downloadSources) {
        sourcesList.push({ name: `${ds.sourceName} (${v.version})`, url: ds.url });
      }
    }
    if (sourcesList.length === 0 && item.officialWebsite) {
      sourcesList.push({ name: '官方官方网站下载通道', url: item.officialWebsite });
    }

    const downloadLinksHtml = sourcesList
      .map(
        (src) =>
          `<li><strong>${this.escapeHtml(src.name)}</strong>: <a href="${this.escapeHtml(src.url)}" rel="nofollow noopener noreferrer" target="_blank">进入官方下载通道</a></li>`
      )
      .join('\n');

    const versionsHtml = item.versions
      .map(
        (v) =>
          `<li><strong>版本 ${this.escapeHtml(v.version)}</strong> (${this.escapeHtml(v.releaseDate || '近期')}) - ${this.escapeHtml(v.changelog || '官方版本更新与性能优化')}</li>`
      )
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
  static async renderGameHtml(slug: string): Promise<{ html: string; status: number }> {
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
  static async renderCategoryHtml(slug: string, page = 1, pageSize = 20): Promise<{ html: string; status: number }> {
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
  static async renderTopicHtml(slug: string): Promise<{ html: string; status: number }> {
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
      .map(
        (tr) => `
      <article style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <h3 style="margin-top:0;"><a href="${domain}/software/${tr.software.slug}">${this.escapeHtml(tr.software.name)}</a></h3>
        <p style="color: #64748b; font-size: 0.9rem;">${this.escapeHtml(tr.software.summary)}</p>
        ${tr.customNote ? `<p style="background: #f1f5f9; padding: 8px 12px; border-radius: 4px; font-size: 0.875rem;"><strong>编辑推荐：</strong>${this.escapeHtml(tr.customNote)}</p>` : ''}
      </article>
    `
      )
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
  static async renderTutorialHtml(slug: string): Promise<{ html: string; status: number }> {
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

  /**
   * 生成电脑软件频道 (/software) 真实语义 HTML5 (P8.7.1 SEO/SSR)
   */
  static async renderSoftwareChannelHtml(): Promise<{ html: string; status: number }> {
    const data = await SoftwareChannelService.getSoftwareChannelData();
    const domain = config.clientUrl;
    const pageUrl = config.getCanonicalUrl('/software');
    const pageTitle = '电脑软件频道 - 开源与常用桌面软件发布渠道汇总 - 软游部落';
    const metaDescription = `软游部落电脑软件频道汇总 ${data.meta.totalSoftwareCount} 款公开桌面软件，提供 ${data.meta.registeredSourcesCount} 条已登记下载来源（含 ${data.meta.approvedHealthySourcesCount} 条已审核直连）、热门关注榜、实用教程与对比评测。商业软件需配合正版授权使用，具体哈希校验状态以各软件来源记录为准。`;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '软游部落电脑软件频道',
      url: pageUrl,
      description: metaDescription,
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: config.getCanonicalUrl('/') },
          { '@type': 'ListItem', position: 2, name: '电脑软件', item: pageUrl },
        ],
      },
    };

    const categoriesHtml = data.categories
      .map(
        (c) =>
          `<a href="${domain}/category/${this.escapeHtml(c.slug)}" style="display:inline-block;margin:0 8px 8px 0;padding:6px 12px;border-radius:8px;background:#eff6ff;color:#1769d2;text-decoration:none;">${this.escapeHtml(c.name)} (${c.count})</a>`
      )
      .join('');

    const featuredHtml = data.editorPicks
      .map(
        (s) =>
          `<article style="border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:10px;">
            <h3 style="margin:0 0 6px;font-size:1.05rem;"><a href="${domain}/software/${this.escapeHtml(s.slug)}" style="color:#0f172a;text-decoration:none;">${this.escapeHtml(s.name)}</a></h3>
            <p style="margin:0;color:#475569;font-size:0.9rem;">${this.escapeHtml(s.summary)}</p>
          </article>`
      )
      .join('\n');

    const topicsHtml = data.hotTopics
      .map(
        (t) =>
          `<li><a href="${domain}/topics/${this.escapeHtml(t.slug)}">${this.escapeHtml(t.title)}</a> (${t.resourceCount} 款软件)</li>`
      )
      .join('\n');

    const tutorialsHtml = data.tutorials
      .map(
        (t) =>
          `<li><a href="${domain}/tutorials/${this.escapeHtml(t.slug)}">${this.escapeHtml(t.title)}</a></li>`
      )
      .join('\n');

    const updatesHtml = data.latestUpdates.versionUpdates
      .map(
        (s) =>
          `<li><a href="${domain}/software/${this.escapeHtml(s.slug)}">${this.escapeHtml(s.name)}</a> - ${this.escapeHtml(s.latestVersion || '')} (${this.escapeHtml(s.releaseDate || '')})</li>`
      )
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
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  ${this.getClientAssetTags()}
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:1200px;margin:0 auto;padding:24px;color:#0f172a;line-height:1.6;">
  <header style="border-bottom:1px solid #e2e8f0;padding-bottom:14px;margin-bottom:20px;">
    <nav style="font-size:0.875rem;color:#64748b;margin-bottom:6px;"><a href="${domain}/">首页</a> / <span>电脑软件</span></nav>
    <h1 style="margin:0;font-size:1.75rem;">电脑软件频道</h1>
    <p style="margin:6px 0 0;color:#475569;">开源与常用桌面软件发布渠道汇总 · 核查来源与校验方法 · 商业软件需自备合法授权</p>
  </header>
  <main>
    <section aria-label="热门分类" style="margin-bottom:24px;"><h2>热门分类索引</h2><div>${categoriesHtml}</div></section>
    <section aria-label="编辑精选" style="margin-bottom:24px;"><h2>编辑精选桌面软件</h2>${featuredHtml}</section>
    <section aria-label="精选专题" style="margin-bottom:24px;"><h2>软件专题推荐</h2><ul>${topicsHtml}</ul></section>
    <section aria-label="实用教程" style="margin-bottom:24px;"><h2>实用教程与使用指南</h2><ul>${tutorialsHtml}</ul></section>
    <section aria-label="近期版本更新" style="margin-bottom:24px;"><h2>近期版本更新动态</h2><ul>${updatesHtml}</ul></section>
  </main>
</body>
</html>`;

    return { html, status: 200 };
  }

  /**
   * 生成系统工具频道 (/system-tools) 真实语义 HTML5 (P8.7.3 SEO/SSR)
   */
  static async renderSystemToolsChannelHtml(): Promise<{ html: string; status: number }> {
    const data = await SystemToolsChannelService.getSystemToolsChannelData();
    const domain = config.clientUrl;
    const pageUrl = config.getCanonicalUrl('/system-tools');
    const pageTitle = '系统工具频道 - 专业电脑维护、硬件体检、磁盘分区与网络排障中心 - 软游部落';
    const metaDescription = `软游部落系统工具频道汇集 ${data.meta.totalToolsCount} 款维护诊断与系统引导工具（含 ${data.meta.utilityToolsCount} 款实操维保工具），已登记 ${data.meta.registeredSourcesCount} 条可用来源（含 ${data.meta.approvedHealthySourcesCount} 条已审核健康直连），覆盖电脑故障场景排障、编辑精选、维修教程与高风险操作备份提示，具体 SHA-256 校验状态以各来源明细为准。`;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '软游部落系统工具频道',
      url: pageUrl,
      description: metaDescription,
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: config.getCanonicalUrl('/') },
          { '@type': 'ListItem', position: 2, name: '系统工具', item: pageUrl },
        ],
      },
    };

    const scenariosHtml = data.scenarios
      .map(
        (sc) =>
          `<article style="border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:10px;">
            <h3 style="margin:0 0 4px;">${this.escapeHtml(sc.title)}</h3>
            <p style="margin:0 0 6px;color:#475569;font-size:0.9rem;">${this.escapeHtml(sc.summary)}</p>
            <p style="margin:0;color:#64748b;font-size:0.85rem;">关联工具：${sc.tools.map((t) => `<a href="${domain}/software/${this.escapeHtml(t.slug)}">${this.escapeHtml(t.name)}</a>`).join(' / ')}</p>
          </article>`
      )
      .join('\n');

    const domainsHtml = data.domainBlocks
      .map(
        (d) =>
          `<li><strong>${this.escapeHtml(d.name)} (${d.totalCount}款)</strong>：${d.tools.map((t) => `<a href="${domain}/software/${this.escapeHtml(t.slug)}">${this.escapeHtml(t.name)}</a>`).join('、')}</li>`
      )
      .join('\n');

    const topicsHtml = data.hotTopics
      .map((t) => `<li><a href="${domain}/topics/${this.escapeHtml(t.slug)}">${this.escapeHtml(t.title)}</a></li>`)
      .join('\n');

    const tutorialsHtml = data.tutorials
      .map((t) => `<li><a href="${domain}/tutorials/${this.escapeHtml(t.slug)}">${this.escapeHtml(t.title)}</a></li>`)
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
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  ${this.getClientAssetTags()}
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:1200px;margin:0 auto;padding:24px;color:#0f172a;line-height:1.6;">
  <header style="border-bottom:1px solid #e2e8f0;padding-bottom:14px;margin-bottom:20px;">
    <nav style="font-size:0.875rem;color:#64748b;margin-bottom:6px;"><a href="${domain}/">首页</a> / <span>系统工具</span></nav>
    <h1 style="margin:0;font-size:1.75rem;">专业电脑维护与系统工具中心</h1>
    <p style="margin:6px 0 0;color:#475569;">发现实用的 Windows 系统维护、磁盘管理、硬件检测、网络诊断与数据备份工具。分区与恢复操作前请务必备份数据。</p>
  </header>
  <main>
    <section aria-label="电脑故障场景找工具" style="margin-bottom:24px;"><h2>电脑遇到问题？按场景找工具</h2>${scenariosHtml}</section>
    <section aria-label="专业工具分类" style="margin-bottom:24px;"><h2>专业系统工具分类</h2><ul>${domainsHtml}</ul></section>
    <section aria-label="维修与维护专题" style="margin-bottom:24px;"><h2>维修与维护专题</h2><ul>${topicsHtml}</ul></section>
    <section aria-label="系统维护教程" style="margin-bottom:24px;"><h2>系统维护教程与排障指南</h2><ul>${tutorialsHtml}</ul></section>
  </main>
</body>
</html>`;

    return { html, status: 200 };
  }

  static async renderGamesChannelHtml(): Promise<{ html: string; status: number }> {
    const data = await GamesChannelService.getGamesChannelData();
    const domain = config.clientUrl;
    const pageUrl = config.getCanonicalUrl('/games');
    const pageTitle = '游戏中心 - 精品开源独立与正版 PC 游戏库 - 软游部落';
    const metaDescription = `软游部落游戏中心已公开发布 ${data.meta.totalGamesCount} 款合规开源免费PC游戏（共登记 ${data.meta.registeredSourcesCount} 条可用渠道），提供高清实机画面、真实题材分类、官方发行页/商店入口、专题合集与游戏录屏实用辅助工具。`;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '软游部落游戏中心',
      url: pageUrl,
      description: metaDescription,
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: config.getCanonicalUrl('/') },
          { '@type': 'ListItem', position: 2, name: '游戏中心', item: pageUrl },
        ],
      },
    };

    const gamesHtml = data.spotlightGames
      .map(
        (g) =>
          `<article style="border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:12px;">
            <h3 style="margin:0 0 6px;"><a href="${domain}/game/${this.escapeHtml(g.slug)}">${this.escapeHtml(g.name)}</a> (${this.escapeHtml(g.genreName)})</h3>
            <p style="margin:0 0 6px;color:#475569;font-size:0.9rem;">${this.escapeHtml(g.summary)}</p>
            <p style="margin:0;color:#64748b;font-size:0.85rem;">支持平台：${this.escapeHtml(g.supportedPlatforms)} · 来源状态：${this.escapeHtml(g.deliveryLabel)}</p>
          </article>`
      )
      .join('\n');

    const genresHtml = data.genreBlocks
      .map(
        (gb) =>
          `<li><strong>${this.escapeHtml(gb.name)} (${gb.totalCount}款)</strong>：${gb.games.map((g) => `<a href="${domain}/game/${this.escapeHtml(g.slug)}">${this.escapeHtml(g.name)}</a>`).join('、')}</li>`
      )
      .join('\n');

    const toolsHtml = data.companionTools
      .map(
        (tool) =>
          `<li><a href="${domain}/software/${this.escapeHtml(tool.slug)}">${this.escapeHtml(tool.name)}</a> — ${this.escapeHtml(tool.roleLabel)}（非游戏本体）</li>`
      )
      .join('\n');

    const topicsHtml = data.hotTopics
      .map(
        (t) =>
          `<li><a href="${domain}/topics/${this.escapeHtml(t.slug)}">${this.escapeHtml(t.title)}</a> (已发布收录 ${t.resourceCount} 款)</li>`
      )
      .join('\n');

    const guidesHtml = data.guides
      .map(
        (g) =>
          `<li><a href="${domain}/tutorials/${this.escapeHtml(g.slug)}">${this.escapeHtml(g.title)}</a> [${this.escapeHtml(g.guideScopeLabel)}]</li>`
      )
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
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  ${this.getClientAssetTags()}
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:1200px;margin:0 auto;padding:24px;color:#0f172a;line-height:1.6;">
  <header style="border-bottom:1px solid #e2e8f0;padding-bottom:14px;margin-bottom:20px;">
    <nav style="font-size:0.875rem;color:#64748b;margin-bottom:6px;"><a href="${domain}/">首页</a> / <span>游戏中心</span></nav>
    <h1 style="margin:0;font-size:1.75rem;">精品独立与开源 PC 游戏中心</h1>
    <p style="margin:6px 0 0;color:#475569;">精选合法开源免费游戏与正版发行渠道入口，严格拒绝盗版破解、诱导内购与捆绑插件。</p>
  </header>
  <main>
    <section aria-label="精选已发布游戏" style="margin-bottom:24px;"><h2>精选已发布游戏 (${data.meta.totalGamesCount}款)</h2>${gamesHtml}</section>
    <section aria-label="游戏题材分类" style="margin-bottom:24px;"><h2>游戏题材分类</h2><ul>${genresHtml}</ul></section>
    <section aria-label="游戏配套工具" style="margin-bottom:24px;"><h2>游戏配套实用软件（非游戏本体）</h2><ul>${toolsHtml}</ul></section>
    <section aria-label="游戏专题" style="margin-bottom:24px;"><h2>精选游戏专题</h2><ul>${topicsHtml}</ul></section>
    <section aria-label="游戏攻略与录屏指南" style="margin-bottom:24px;"><h2>游戏攻略与实用技巧</h2><ul>${guidesHtml}</ul></section>
  </main>
</body>
</html>`;

    return { html, status: 200 };
  }

  /**
   * 生成装机必备频道 (/essentials) 真实语义 HTML5 (P8.7.5 SEO/SSR)
   */
  static async renderEssentialsChannelHtml(): Promise<{ html: string; status: number }> {
    const data = await EssentialsChannelService.getEssentialsChannelData();
    const domain = config.clientUrl;
    const pageUrl = config.getCanonicalUrl('/essentials');
    const pageTitle = '装机必备 - 新电脑装机与必备软件中心 - 软游部落';
    const metaDescription = `软游部落装机必备频道汇总 ${data.meta.totalPublishedSoftwareCount} 款已发布桌面软件与系统工具（含 ${data.meta.registeredSourcesCount} 条已登记下载来源，其中 ${data.meta.approvedHealthySourcesCount} 条经人工审核健康直连），提供场景化装机方案、可选清单导出与从零开始的新电脑初始化流程指引。`;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '新电脑装机与必备软件中心',
      url: pageUrl,
      description: metaDescription,
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: config.getCanonicalUrl('/') },
          { '@type': 'ListItem', position: 2, name: '装机必备', item: pageUrl },
        ],
      },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: data.quickTools.map((tool, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: tool.name,
          url: `${domain}/software/${tool.slug}`,
        })),
      },
    };

    const plansHtml = data.setupPlans
      .map(
        (plan) =>
          `<article style="border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:12px;">
            <h3 style="margin:0 0 6px;">${this.escapeHtml(plan.title)}（收录 ${plan.recommendedCount} 款）</h3>
            <p style="margin:0 0 6px;color:#475569;font-size:0.9rem;">${this.escapeHtml(plan.tagline)}</p>
            <p style="margin:0;color:#64748b;font-size:0.85rem;">软件清单：${plan.items.map((it) => `<a href="${domain}/software/${this.escapeHtml(it.slug)}">${this.escapeHtml(it.name)}</a>`).join('、')}</p>
          </article>`
      )
      .join('\n');

    const workflowHtml = data.installWorkflow
      .map(
        (st) =>
          `<li><strong>步骤 ${st.step} · ${this.escapeHtml(st.title)}</strong>：${this.escapeHtml(st.summary)}</li>`
      )
      .join('\n');

    const topicsHtml = data.hotTopics
      .map(
        (t) =>
          `<li><a href="${domain}/topics/${this.escapeHtml(t.slug)}">${this.escapeHtml(t.title)}</a>（${t.resourceCount} 款）</li>`
      )
      .join('\n');

    const tutorialsHtml = data.tutorials
      .map(
        (t) =>
          `<li><a href="${domain}/tutorials/${this.escapeHtml(t.slug)}">${this.escapeHtml(t.title)}</a></li>`
      )
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
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  ${this.getClientAssetTags()}
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:1200px;margin:0 auto;padding:24px;color:#0f172a;line-height:1.6;">
  <header style="border-bottom:1px solid #e2e8f0;padding-bottom:14px;margin-bottom:20px;">
    <nav style="font-size:0.875rem;color:#64748b;margin-bottom:6px;"><a href="${domain}/">首页</a> / <span>装机必备</span></nav>
    <h1 style="margin:0;font-size:1.75rem;">新电脑装机与必备软件中心</h1>
    <p style="margin:6px 0 0;color:#475569;">正版来源、实用工具、场景化装机方案与详细安装指引 — 共汇集 ${data.meta.totalPublishedSoftwareCount} 款已发布桌面工具。</p>
  </header>
  <main>
    <section aria-label="场景装机方案" style="margin-bottom:24px;"><h2>精选电脑装机配置方案</h2>${plansHtml}</section>
    <section aria-label="系统安装流程" style="margin-bottom:24px;"><h2>从零开始完成新电脑配置流程</h2><ol>${workflowHtml}</ol></section>
    <section aria-label="装机专题推荐" style="margin-bottom:24px;"><h2>装机专题合集</h2><ul>${topicsHtml}</ul></section>
    <section aria-label="装机实战教程" style="margin-bottom:24px;"><h2>装机实战教程与安全指南</h2><ul>${tutorialsHtml}</ul></section>
  </main>
</body>
</html>`;

    return { html, status: 200 };
  }

  /**
   * 生成对比评测频道 (/compare) 真实语义 HTML5 (P8.7.6 SEO/SSR)
   */
  static async renderCompareChannelHtml(): Promise<{ html: string; status: number }> {
    const data = await CompareChannelService.getCompareChannelData();
    const domain = config.clientUrl;
    const pageUrl = config.getCanonicalUrl('/compare');
    const pageTitle = '软件对比评测与专业选型中心 - 软游部落';
    const metaDescription = `软游部落对比评测频道收录 ${data.meta.totalPublishedComparisons} 篇专业横向评测与 ${data.meta.totalComparableSoftwares} 款已发布软件工具，提供客观双软件参数对比矩阵、开源合规审查、跨类别提示与场景化专业选型建议。`;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '软件对比评测与专业选型中心',
      url: pageUrl,
      description: metaDescription,
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: config.getCanonicalUrl('/') },
          { '@type': 'ListItem', position: 2, name: '对比评测', item: pageUrl },
        ],
      },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: data.featuredArticles.map((art, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: art.title,
          url: `${domain}/compare/${art.slug}`,
        })),
      },
    };

    const articlesHtml = data.featuredArticles
      .map(
        (art) =>
          `<article style="border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:14px;">
            <h3 style="margin:0 0 8px;"><a href="${domain}/compare/${this.escapeHtml(art.slug)}">${this.escapeHtml(art.title)}</a></h3>
            <p style="margin:0 0 8px;color:#475569;font-size:0.9rem;">${this.escapeHtml(art.summary)}</p>
            <p style="margin:0;color:#64748b;font-size:0.85rem;">对比软件：${art.items.map((it) => `<a href="${domain}/software/${this.escapeHtml(it.slug)}">${this.escapeHtml(it.name)}</a>`).join(' vs ')} | 选型结论：${this.escapeHtml(art.conclusion)}</p>
          </article>`
      )
      .join('\n');

    const quickPairsHtml = data.quickPairs
      .map(
        (pair) =>
          `<li><strong>${this.escapeHtml(pair.leftName)} vs ${this.escapeHtml(pair.rightName)}</strong>（${this.escapeHtml(pair.categoryName)}）：<a href="${domain}/compare?left=${encodeURIComponent(pair.leftSlug)}&right=${encodeURIComponent(pair.rightSlug)}">${this.escapeHtml(pair.tagline)}</a></li>`
      )
      .join('\n');

    const alternativesHtml = data.alternatives
      .map(
        (alt) =>
          `<li><strong><a href="${domain}/software/${this.escapeHtml(alt.fromSlug)}">${this.escapeHtml(alt.fromName)}</a></strong> → 替代推荐：<strong><a href="${domain}/software/${this.escapeHtml(alt.toSlug)}">${this.escapeHtml(alt.toName)}</a></strong>（理由：${this.escapeHtml(alt.reason)}）</li>`
      )
      .join('\n');

    const guidesHtml = data.decisionGuides
      .map(
        (g) =>
          `<div style="margin-bottom:12px;padding:12px;background:#f8fafc;border-radius:8px;">
            <h4 style="margin:0 0 4px;">场景：${this.escapeHtml(g.scenario)}（适用：${this.escapeHtml(g.targetUsers)}）</h4>
            <p style="margin:0;color:#334155;font-size:0.875rem;">${this.escapeHtml(g.guidance)}</p>
          </div>`
      )
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
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  ${this.getClientAssetTags()}
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:1200px;margin:0 auto;padding:24px;color:#0f172a;line-height:1.6;">
  <header style="border-bottom:1px solid #e2e8f0;padding-bottom:14px;margin-bottom:20px;">
    <nav style="font-size:0.875rem;color:#64748b;margin-bottom:6px;"><a href="${domain}/">首页</a> / <span>对比评测</span></nav>
    <h1 style="margin:0;font-size:1.75rem;">软件对比评测与专业选型中心</h1>
    <p style="margin:6px 0 0;color:#475569;">客观横向参数比对、开源许可证合规、系统兼容性差异与场景化专业选型建议 — 共收录 ${data.meta.totalComparableSoftwares} 款可比资源与 ${data.meta.totalPublishedComparisons} 篇专业横评。</p>
  </header>
  <main>
    <section aria-label="热门对比快速入口" style="margin-bottom:24px;"><h2>热门软件对比入口</h2><ul>${quickPairsHtml}</ul></section>
    <section aria-label="精选横向评测文章" style="margin-bottom:24px;"><h2>精选软件横向评测</h2>${articlesHtml}</section>
    <section aria-label="场景化专业选型建议" style="margin-bottom:24px;"><h2>场景化专业选型建议</h2>${guidesHtml}</section>
    <section aria-label="替代软件推荐" style="margin-bottom:24px;"><h2>替代软件方案推荐</h2><ul>${alternativesHtml}</ul></section>
  </main>
</body>
</html>`;

    return { html, status: 200 };
  }

    /**
   * P8.7.7 社区交流门户公开 HTML (/community)
   */
  static async renderCommunityChannelHtml(): Promise<{ html: string; status: number }> {
    const [stats, threads] = await Promise.all([
      CommunityService.getCommunityStats(),
      prisma.discussionThread.findMany({
        where: { status: 'ACTIVE' },
        take: 20,
        orderBy: [{ isPinned: 'desc' }, { lastActivityAt: 'desc' }],
        include: {
          user: { select: { username: true } },
          software: { select: { name: true, slug: true } }
        }
      })
    ]);

    const domain = config.clientUrl;
    const pageUrl = config.getCanonicalUrl('/community');
    const pageTitle = '电脑装机维护与正版软件技术问答社区 - 软游部落';
    const metaDescription = `软游部落技术互助社区汇聚真实用户系统排障、电脑装机配置、正版软件使用心得与开发者答疑。累计收录 ${stats.totalThreads} 篇真实讨论与 ${stats.totalPosts} 条回复，支持采纳最佳解答闭环。`;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '软游部落技术问答与电脑维修互助社区',
      url: pageUrl,
      description: metaDescription,
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: config.getCanonicalUrl('/') },
          { '@type': 'ListItem', position: 2, name: '社区交流', item: pageUrl },
        ],
      },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: threads.map((t, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: t.title,
          url: `${domain}/community/thread/${t.id}`,
        })),
      },
    };

    const threadsHtml = threads
      .map(
        (t) =>
          `<article style="border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:14px;">
            <div style="font-size:0.8rem;color:#64748b;margin-bottom:4px;">
              ${t.isPinned ? '<span style="color:#e11d48;font-weight:bold;">[置顶] </span>' : ''}
              ${t.isResolved ? '<span style="color:#059669;font-weight:bold;">[已解决] </span>' : '<span style="color:#d97706;">[待解答] </span>'}
              <span>板块：${this.escapeHtml(t.category)}</span>
              ${t.software ? ` | 关联软件：<a href="${domain}/software/${this.escapeHtml(t.software.slug)}">${this.escapeHtml(t.software.name)}</a>` : ''}
            </div>
            <h3 style="margin:0 0 8px;"><a href="${domain}/community/thread/${this.escapeHtml(t.id)}">${this.escapeHtml(t.title)}</a></h3>
            <p style="margin:0 0 8px;color:#475569;font-size:0.9rem;">${this.escapeHtml(t.content.slice(0, 150))}${t.content.length > 150 ? '...' : ''}</p>
            <p style="margin:0;color:#64748b;font-size:0.85rem;">发布者：${this.escapeHtml(t.user.username)} | 浏览：${t.viewCount} | 回复：${t.replyCount}</p>
          </article>`
      )
      .join('\n');

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(pageTitle)}</title>
  <meta name="description" content="${this.escapeHtml(metaDescription)}">
  <meta name="keywords" content="软游部落社区,电脑维修,系统排障,装机配置求助,正版软件交流,技术问答,开发者互动">
  <link rel="canonical" href="${pageUrl}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${this.escapeHtml(pageTitle)}">
  <meta property="og:description" content="${this.escapeHtml(metaDescription)}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:site_name" content="软游部落">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  ${this.getClientAssetTags()}
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #1e293b;">
  <header style="margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
    <nav style="font-size:0.875rem;color:#64748b;margin-bottom:6px;"><a href="${domain}/">首页</a> / <span>社区交流</span></nav>
    <h1 style="margin:0;font-size:1.75rem;">软游部落技术问答与电脑维修互助社区</h1>
    <p style="margin:6px 0 0;color:#475569;">真实排障经验、软硬件调试技巧与官方开发者直接答疑。累计 ${stats.totalThreads} 篇讨论、${stats.totalPosts} 条回复、${stats.resolvedThreads} 个已解决疑难，解决率 ${stats.resolutionRate}%。</p>
  </header>
  <main>
    <section aria-label="社区讨论列表" style="margin-bottom:24px;">
      <h2>最新社区讨论与技术求助</h2>
      ${threadsHtml || '<p style="color:#64748b;">暂无公开发布的社区讨论。</p>'}
    </section>
  </main>
</body>
</html>`;

    return { html, status: 200 };
  }

  /**
   * P8.7.7 社区单篇讨论公开 HTML (/community/thread/:id)
   */
  static async renderCommunityThreadHtml(id: string): Promise<{ html: string; status: number }> {
    const thread = await CommunityService.getThread(id);
    if (!thread) {
      return {
        html: this.renderNotFoundHtml(`讨论主题 "${id}" 不存在或已被清理`),
        status: 404
      };
    }

    const domain = config.clientUrl;
    const pageUrl = config.getCanonicalUrl(`/community/thread/${thread.id}`);
    const pageTitle = `${thread.title} - 软游部落技术问答社区`;
    const metaDescription = `${thread.user.username} 发布的讨论：${thread.content.slice(0, 140)}... 共 ${thread.posts.length} 条回复。`;

    const acceptedPost = thread.posts.find((p) => (p as any).isAccepted || p.id === thread.acceptedPostId);

    const jsonLd: any = {
      '@context': 'https://schema.org',
      '@type': 'QAPage',
      mainEntity: {
        '@type': 'Question',
        name: thread.title,
        text: thread.content,
        answerCount: thread.posts.length,
        dateCreated: thread.createdAt.toISOString(),
        author: {
          '@type': 'Person',
          name: thread.user.username,
        },
      },
    };

    if (acceptedPost) {
      jsonLd.mainEntity.acceptedAnswer = {
        '@type': 'Answer',
        text: acceptedPost.content,
        dateCreated: acceptedPost.createdAt.toISOString(),
        author: {
          '@type': 'Person',
          name: acceptedPost.user.username,
        },
      };
    }

    const postsHtml = thread.posts
      .map(
        (p, idx) =>
          `<div style="border-bottom:1px solid #f1f5f9;padding:12px 0;">
            <div style="font-size:0.85rem;color:#64748b;margin-bottom:4px;">
              <strong>${this.escapeHtml(p.user.username)}</strong>
              ${p.isDeveloperReply ? ' <span style="background:#2563eb;color:#fff;font-size:0.75rem;padding:2px 6px;border-radius:10px;">官方认证开发者</span>' : ''}
              ${(p as any).isAccepted || p.id === thread.acceptedPostId ? ' <span style="background:#059669;color:#fff;font-size:0.75rem;padding:2px 6px;border-radius:10px;">最佳解答</span>' : ''}
              <span> · #${idx + 1} 楼 · ${p.createdAt.toLocaleDateString()}</span>
            </div>
            <div style="font-size:0.9rem;color:#334155;white-space:pre-wrap;">${this.escapeHtml(p.content)}</div>
          </div>`
      )
      .join('\n');

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(pageTitle)}</title>
  <meta name="description" content="${this.escapeHtml(metaDescription)}">
  <link rel="canonical" href="${pageUrl}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${this.escapeHtml(pageTitle)}">
  <meta property="og:description" content="${this.escapeHtml(metaDescription)}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:site_name" content="软游部落">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  ${this.getClientAssetTags()}
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #1e293b;">
  <header style="margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
    <nav style="font-size:0.875rem;color:#64748b;margin-bottom:6px;">
      <a href="${domain}/">首页</a> / <a href="${domain}/community">社区交流</a> / <span>讨论详情</span>
    </nav>
    <div style="font-size:0.8rem;color:#64748b;margin-bottom:6px;">
      ${thread.isResolved ? '<span style="color:#059669;font-weight:bold;">[已解决] </span>' : '<span style="color:#d97706;">[待解答] </span>'}
      <span>板块：${this.escapeHtml(thread.category)}</span>
      ${thread.software ? ` | 关联软件：<a href="${domain}/software/${this.escapeHtml(thread.software.slug)}">${this.escapeHtml(thread.software.name)}</a>` : ''}
    </div>
    <h1 style="margin:0 0 10px;font-size:1.6rem;">${this.escapeHtml(thread.title)}</h1>
    <p style="margin:0;color:#64748b;font-size:0.85rem;">发布者：${this.escapeHtml(thread.user.username)} | 发布时间：${thread.createdAt.toLocaleDateString()} | 浏览：${thread.viewCount} 次</p>
  </header>
  <main>
    <article style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #e2e8f0;">
      <div style="font-size:0.95rem;color:#1e293b;white-space:pre-wrap;">${this.escapeHtml(thread.content)}</div>
    </article>

    ${acceptedPost ? `
    <section aria-label="采纳的最佳解答" style="background:#ecfdf5;border:2px solid #059669;border-radius:12px;padding:18px;margin-bottom:24px;">
      <h3 style="margin:0 0 8px;color:#065f46;font-size:1.05rem;">🎉 发起者采纳的最佳解答</h3>
      <p style="margin:0 0 8px;font-size:0.85rem;color:#047857;">解答者：${this.escapeHtml(acceptedPost.user.username)}</p>
      <div style="font-size:0.9rem;color:#064e3b;white-space:pre-wrap;">${this.escapeHtml(acceptedPost.content)}</div>
    </section>
    ` : ''}

    <section aria-label="回复列表" style="margin-bottom:24px;">
      <h2 style="font-size:1.2rem;">全部回复 (${thread.posts.length})</h2>
      ${postsHtml || '<p style="color:#64748b;">暂无回复。</p>'}
    </section>
  </main>
</body>
</html>`;

    return { html, status: 200 };
  }

  /**
   * 生成最新更新频道公开 HTML (/updates) (P8.7.10)
   */
  static async renderUpdatesChannelHtml(): Promise<{ html: string; status: number }> {
    const data = await UpdatesChannelService.getUpdatesChannelData({ limit: 20 });
    const domain = config.clientUrl;
    const pageUrl = config.getCanonicalUrl('/updates');
    const pageTitle = '软件与游戏最新版本更新中心 - 官方更新日志与发布动态 - 软游部落';
    const metaDescription = `软游部落最新更新频道收录 ${data.stats.totalPublished} 款正版软件与系统工具的真实版本更新动态（已核验 ${data.stats.totalVersions} 个版本记录）。提供按日期、类别与资源类型检索，呈现官方新版 Changelog、版本差异与安全核验来源。`;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '软件与游戏最新版本更新中心',
      url: pageUrl,
      description: metaDescription,
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: config.getCanonicalUrl('/') },
          { '@type': 'ListItem', position: 2, name: '最新更新', item: pageUrl },
        ],
      },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: data.timeline.items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: `${item.softwareName} v${item.version}`,
          url: `${domain}/software/${item.softwareSlug}`,
        })),
      },
    };

    const featuredHtml = data.featuredUpdates
      .map(
        (f) =>
          `<div style="border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:12px;background:#f8fafc;">
            <div style="font-size:0.8rem;color:#1769d2;font-weight:bold;margin-bottom:4px;">${this.escapeHtml(f.categoryName)} · ${this.escapeHtml(f.developer)}</div>
            <h3 style="margin:0 0 6px;"><a href="${domain}/software/${this.escapeHtml(f.softwareSlug)}">${this.escapeHtml(f.softwareName)} <span style="color:#1769d2;">v${this.escapeHtml(f.version)}</span></a></h3>
            <p style="margin:0 0 6px;color:#475569;font-size:0.9rem;">${this.escapeHtml(f.changelogSummary)}</p>
            <div style="font-size:0.8rem;color:#64748b;">发布日期：${this.escapeHtml(f.releaseDate)} | 支持平台：${this.escapeHtml(f.platform)}</div>
          </div>`
      )
      .join('\n');

    const timelineHtml = data.timeline.items
      .map(
        (item) =>
          `<article style="border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <h3 style="margin:0;font-size:1.05rem;">
                <a href="${domain}/software/${this.escapeHtml(item.softwareSlug)}">${this.escapeHtml(item.softwareName)}</a>
                <span style="background:#e0f2fe;color:#0369a1;padding:2px 8px;border-radius:999px;font-size:0.8rem;margin-left:6px;font-weight:bold;">v${this.escapeHtml(item.version)}</span>
                ${item.previousVersion ? `<span style="color:#94a3b8;font-size:0.8rem;margin-left:4px;">(前版 v${this.escapeHtml(item.previousVersion)})</span>` : ''}
              </h3>
              <span style="font-size:0.8rem;color:#64748b;font-family:monospace;">${this.escapeHtml(item.formattedDate)}</span>
            </div>
            <p style="margin:0 0 8px;color:#475569;font-size:0.88rem;background:#f1f5f9;padding:8px 12px;border-radius:6px;">
              <strong>更新说明：</strong>${this.escapeHtml(item.changelog || item.missingChangelogNotice || '官方更新说明暂未收录')}
            </p>
            <div style="font-size:0.8rem;color:#64748b;display:flex;gap:12px;">
              <span>分类：${this.escapeHtml(item.categoryName)}</span>
              <span>安装包体积：${this.escapeHtml(item.fileSize)}</span>
              <span>来源：${item.downloadSources.length > 0 ? '已审核原厂来源' : '已核验'}</span>
            </div>
          </article>`
      )
      .join('\n');

    const recentlyAddedHtml = data.recentlyAdded
      .map(
        (r) =>
          `<li style="margin-bottom:6px;"><a href="${domain}/software/${this.escapeHtml(r.slug)}"><strong>${this.escapeHtml(r.name)}</strong></a> <span style="color:#64748b;font-size:0.85rem;">(v${this.escapeHtml(r.currentVersion)} - 入库于 ${this.escapeHtml(r.publishedAt.slice(0, 10))})</span></li>`
      )
      .join('\n');

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(pageTitle)}</title>
  <meta name="description" content="${this.escapeHtml(metaDescription)}">
  <meta name="keywords" content="软件更新,最新版本,更新日志,Changelog,版本历史,软件发布,安全更新,软游部落">
  <link rel="canonical" href="${pageUrl}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${this.escapeHtml(pageTitle)}">
  <meta property="og:description" content="${this.escapeHtml(metaDescription)}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:site_name" content="软游部落">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  ${this.getClientAssetTags()}
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #1e293b;">
  <header style="margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
    <nav style="font-size:0.875rem;color:#64748b;margin-bottom:6px;"><a href="${domain}/">首页</a> / <span>最新更新</span></nav>
    <h1 style="margin:0;font-size:1.75rem;">软件与游戏最新版本更新中心</h1>
    <p style="margin:6px 0 0;color:#475569;">严格依据原厂发布日期 (releaseDate) 追踪版本升级动态，拒绝虚假更新。全站累计 ${data.stats.totalPublished} 款正版软件、${data.stats.totalVersions} 个已审核版本、${data.stats.verifiedSourcesCount} 条已核验下载来源。</p>
  </header>
  <main>
    <section aria-label="近期焦点版本更新" style="margin-bottom:28px;">
      <h2 style="font-size:1.25rem;border-left:4px solid #1769d2;padding-left:10px;margin-bottom:12px;">近期焦点版本更新</h2>
      ${featuredHtml || '<p style="color:#64748b;">暂无重点推荐版本。</p>'}
    </section>

    <section aria-label="最新版本更新动态时间线" style="margin-bottom:28px;">
      <h2 style="font-size:1.25rem;border-left:4px solid #1769d2;padding-left:10px;margin-bottom:12px;">最新版本更新动态时间线</h2>
      ${timelineHtml || '<p style="color:#64748b;">当前暂无已审核版本更新记录。</p>'}
    </section>

    <section aria-label="最近加入软游部落" style="margin-bottom:28px;background:#f8fafc;padding:16px;border-radius:10px;">
      <h2 style="font-size:1.15rem;margin-top:0;">最近加入软游部落 (新收录入库，与版本更新严格隔离)</h2>
      <ul style="padding-left:20px;margin:0;">
        ${recentlyAddedHtml || '<li style="color:#64748b;">暂无新收录软件。</li>'}
      </ul>
    </section>
  </main>
  <footer style="margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; font-size: 0.85rem;">
    <p>软游部落 &copy; ${new Date().getFullYear()} SoftTribe.top · 真实软件与游戏版本演进中心</p>
  </footer>
</body>
</html>`;

    return { html, status: 200 };
  }

  private static renderNotFoundHtml(message: string): string {
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

  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
