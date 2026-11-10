import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../db';
import { ResourceStatus } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import crypto from 'crypto';

// 常见技术/软件别名与缩写映射表
const ALIAS_MAP: Record<string, string[]> = {
  'vscode': ['Visual Studio Code', 'VS Code'],
  'vs code': ['Visual Studio Code'],
  '7z': ['7-Zip', '7Zip'],
  '7zip': ['7-Zip'],
  'ps': ['Photoshop', 'Adobe Photoshop'],
  'pr': ['Premiere Pro', 'Adobe Premiere'],
  'sublime': ['Sublime Text'],
  'chrome': ['Google Chrome'],
  'edge': ['Microsoft Edge'],
  'pot': ['PotPlayer'],
  'py': ['Python'],
  'git': ['Git'],
  'node': ['Node.js', 'NodeJS'],
};

export async function searchRoutes(server: FastifyInstance) {
  // 综合搜索接口
  server.get('/api/v1/search', async (req: FastifyRequest, reply: FastifyReply) => {
    const q = req.query as any;
    const rawQuery = (q.q || '').trim();
    const categorySlug = q.categorySlug as string | undefined;
    const type = q.type as string | undefined;
    const limit = Math.min(parseInt(q.limit || '20', 10), 50);

    // 关键词长度限制（防长文本攻击）
    if (rawQuery.length > 50) {
      return reply.status(400).send({
        success: false,
        error: { code: 'QUERY_TOO_LONG', message: '搜索词过长，请精简至50字以内' }
      });
    }

    const where: any = {
      status: ResourceStatus.PUBLISHED,
      isTestData: false,
    };

    if (categorySlug && categorySlug !== 'all') {
      where.category = { slug: categorySlug };
    }

    if (type) {
      where.type = type;
    }

    if (rawQuery) {
      // 别名与同义词扩展
      const normalized = rawQuery.toLowerCase();
      const expandedTerms = [rawQuery, ...(ALIAS_MAP[normalized] || [])];

      const orConditions: any[] = [];
      for (const term of expandedTerms) {
        orConditions.push(
          { name: { contains: term, mode: 'insensitive' } },
          { englishName: { contains: term, mode: 'insensitive' } },
          { developer: { contains: term, mode: 'insensitive' } },
          { summary: { contains: term, mode: 'insensitive' } },
          { aliases: { contains: term, mode: 'insensitive' } },
          { category: { name: { contains: term, mode: 'insensitive' } } }
        );
      }
      where.OR = orConditions;
    }

    const [items, total] = await Promise.all([
      prisma.software.findMany({
        where,
        orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        include: {
          category: true,
          versions: { where: { isLatest: true }, include: { downloadSources: { where: { isActive: true } } } },
          licenses: true,
          _count: { select: { downloadEvents: true } }
        }
      }),
      prisma.software.count({ where })
    ]);

    // 异步记录搜索日志与无结果监测 (非阻塞)
    if (rawQuery) {
      const clientIp = req.ip || '127.0.0.1';
      const ipHash = crypto.createHash('md5').update(clientIp).digest('hex').slice(0, 16);
      prisma.searchQueryLog.create({
        data: {
          query: rawQuery,
          normalizedQuery: rawQuery.toLowerCase().trim(),
          resultsCount: total,
          hasResults: total > 0,
          clientIpHash: ipHash,
        },
      }).catch(() => {});
    }

    // 统计匹配的分类
    const matchedCategoryIds = Array.from(new Set(items.map((i) => i.categoryId)));
    const matchedCategories = await prisma.category.findMany({
      where: { id: { in: matchedCategoryIds } }
    });

    const formattedItems = items.map((s) => {
      const latestVer = (s.versions?.[0] as any) || { id: '', version: '1.0.0', fileSize: '原厂包', downloadSources: [] };
      const license = s.licenses?.[0]?.licenseType || 'FREE';
      const licenseLabelMap: Record<string, string> = {
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
        developer: s.developer,
        summary: s.summary,
        description: s.description,
        iconUrl: s.iconUrl,
        categorySlug: s.category?.slug || 'other',
        categoryName: s.category?.name || '综合工具',
        type: s.type,
        isFeatured: s.isFeatured,
        downloadCount: s._count?.downloadEvents || 0,
        officialSiteUrl: latestVer.downloadSources?.[0]?.url || 'https://softbuluo.com',
        licenseType: license,
        licenseLabel: licenseLabelMap[license] || '免费软件',
        sourceVerified: latestVer.downloadSources?.[0]?.verificationStatus === 'VERIFIED',
        sourceStatus: latestVer.downloadSources?.[0]?.verificationStatus === 'VERIFIED' ? '官方来源已核验' : '来源待核验',
        tags: [s.category?.name || '工具'],
        latestVersion: {
          id: latestVer.id || 'v1',
          version: latestVer.version,
          releaseDate: '2025-01-20',
          platform: ['Windows 10/11 64位'],
          fileSize: latestVer.fileSize,
          changelog: '',
          downloadSources: latestVer.downloadSources.map((ds: any) => ({
            id: ds.id,
            sourceType: ds.sourceType,
            label: ds.sourceName,
            url: ds.url,
            verificationStatus: ds.verificationStatus,
            lastCheckedDate: '2025-01-20',
            isDirectDownload: false,
          }))
        }
      };
    });

    return reply.send({
      success: true,
      data: {
        items: formattedItems,
        total,
        query: rawQuery,
        matchedCategories: matchedCategories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          itemCount: 0,
        }))
      }
    });
  });

  // 搜索建议实时联想（限最多 8 条结果，支持别名）
  server.get('/api/v1/search/suggestions', async (req: FastifyRequest, reply: FastifyReply) => {
    const q = req.query as any;
    const query = (q.q || '').trim();

    if (!query || query.length < 2) {
      return reply.send({ success: true, data: [] });
    }

    const normalized = query.toLowerCase();
    const expandedTerms = [query, ...(ALIAS_MAP[normalized] || [])];

    const orConditions: any[] = [];
    for (const term of expandedTerms) {
      orConditions.push(
        { name: { contains: term, mode: 'insensitive' } },
        { englishName: { contains: term, mode: 'insensitive' } },
        { aliases: { contains: term, mode: 'insensitive' } }
      );
    }

    const items = await prisma.software.findMany({
      where: {
        status: ResourceStatus.PUBLISHED,
        isTestData: false,
        OR: orConditions,
      },
      take: 8,
      include: {
        category: true,
        versions: { where: { isLatest: true }, include: { downloadSources: true } },
        licenses: true,
      }
    });

    return reply.send({
      success: true,
      data: items.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        englishName: s.englishName || s.name,
        categoryName: s.category?.name || '常用工具',
        categorySlug: s.category?.slug || 'tools',
        licenseLabel: '官方渠道',
        summary: s.summary,
      }))
    });
  });

  // 管理后台：搜索热词与意图分析
  server.get('/api/v1/admin/search/analytics', {
    preHandler: [requireAuth],
  }, async (_req: FastifyRequest, reply: FastifyReply) => {
    const [totalSearches, zeroResultsTotal, topQueriesGroup, zeroQueriesGroup] = await Promise.all([
      prisma.searchQueryLog.count(),
      prisma.searchQueryLog.count({ where: { hasResults: false } }),
      prisma.searchQueryLog.groupBy({
        by: ['normalizedQuery'],
        _count: { id: true },
        _avg: { resultsCount: true },
        orderBy: { _count: { id: 'desc' } },
        take: 15,
      }),
      prisma.searchQueryLog.groupBy({
        by: ['normalizedQuery'],
        where: { hasResults: false },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 15,
      }),
    ]);

    const zeroResultRate = totalSearches > 0 ? parseFloat(((zeroResultsTotal / totalSearches) * 100).toFixed(1)) : 0;

    return reply.send({
      success: true,
      data: {
        totalSearches,
        zeroResultsTotal,
        zeroResultRate: `${zeroResultRate}%`,
        topQueries: topQueriesGroup.map((q) => ({
          query: q.normalizedQuery,
          count: q._count.id,
          avgResults: Math.round(q._avg.resultsCount || 0),
        })),
        zeroHitQueries: zeroQueriesGroup.map((q) => ({
          query: q.normalizedQuery,
          count: q._count.id,
        })),
      },
    });
  });
}
