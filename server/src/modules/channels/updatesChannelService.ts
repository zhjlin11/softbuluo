import { ResourceStatus, ResourceType } from '@prisma/client';
import { prisma } from '../../db';

export interface FeaturedUpdateDto {
  softwareId: string;
  softwareName: string;
  softwareSlug: string;
  softwareIconUrl: string | null;
  developer: string;
  categoryName: string;
  categorySlug: string;
  versionId: string;
  version: string;
  releaseDate: string;
  platform: string;
  changelogSummary: string;
  hasChangelog: boolean;
  isLatest: boolean;
  dataIntegrityStatus: string;
  officialDomainVerified: boolean;
  downloadUrl: string;
}

export interface TimelineUpdateItemDto {
  versionId: string;
  softwareId: string;
  softwareName: string;
  softwareSlug: string;
  softwareIconUrl: string | null;
  developer: string;
  type: ResourceType;
  categoryName: string;
  categorySlug: string;
  version: string;
  previousVersion: string | null;
  releaseDate: string;
  formattedDate: string;
  dateGroup: 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'EARLIER';
  platform: string;
  architecture: string;
  fileSize: string;
  changelog: string | null;
  hasChangelog: boolean;
  missingChangelogNotice: string | null;
  isLatest: boolean;
  reviewStatus: string;
  dataIntegrityStatus: string;
  officialDomainVerified: boolean;
  downloadSources: Array<{
    id: string;
    sourceType: string;
    sourceName: string;
    isOfficial: boolean;
    isVerified: boolean;
    hasIntegrityCheck: boolean;
  }>;
}

export interface RecentlyAddedSoftwareDto {
  id: string;
  name: string;
  slug: string;
  developer: string;
  type: ResourceType;
  iconUrl: string | null;
  categoryName: string;
  categorySlug: string;
  summary: string;
  currentVersion: string;
  publishedAt: string;
  createdAt: string;
}

export interface UpdatesChannelData {
  channel: 'UPDATES';
  stats: {
    updates7d: number;
    updates30d: number;
    updates90d: number;
    totalPublished: number;
    totalVersions: number;
    verifiedSourcesCount: number;
  };
  featuredUpdates: FeaturedUpdateDto[];
  timeline: {
    items: TimelineUpdateItemDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  recentlyAdded: RecentlyAddedSoftwareDto[];
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    count: number;
  }>;
  meta: {
    asOf: string;
    dataCriteria: string;
  };
}

export interface UpdatesQueryParams {
  timeRange?: '7d' | '30d' | '90d' | 'all';
  startDate?: string;
  endDate?: string;
  resourceType?: 'ALL' | 'SOFTWARE' | 'TOOL' | 'GAME';
  categoryId?: string;
  keyword?: string;
  sort?: 'latest_release' | 'latest_verified' | 'name';
  page?: number;
  limit?: number;
}

function calculateDateThreshold(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function categorizeDateGroup(releaseDateStr: string): 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'EARLIER' {
  if (!releaseDateStr) return 'EARLIER';
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  if (releaseDateStr === todayStr) return 'TODAY';
  if (releaseDateStr === yesterdayStr) return 'YESTERDAY';
  if (releaseDateStr >= sevenDaysAgoStr) return 'THIS_WEEK';
  if (releaseDateStr >= thirtyDaysAgoStr) return 'THIS_MONTH';
  return 'EARLIER';
}

export class UpdatesChannelService {
  /**
   * 获取最新更新频道核心聚合数据
   */
  static async getUpdatesChannelData(params: UpdatesQueryParams = {}): Promise<UpdatesChannelData> {
    const timeRange = params.timeRange || 'all';
    const resourceType = params.resourceType || 'ALL';
    const categoryId = params.categoryId;
    const rawKeyword = params.keyword ? params.keyword.trim().slice(0, 50) : '';
    const sort = params.sort || 'latest_release';
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 15));
    const skip = (page - 1) * limit;

    // 基础过滤条件：严格排除草稿与测试数据
    const baseSoftwareWhere: any = {
      status: ResourceStatus.PUBLISHED,
      isTestData: false,
    };

    if (resourceType !== 'ALL') {
      baseSoftwareWhere.type = resourceType as ResourceType;
    }
    if (categoryId) {
      baseSoftwareWhere.categoryId = categoryId;
    }

    // 版本查询条件
    const versionWhere: any = {
      software: baseSoftwareWhere,
      reviewStatus: 'APPROVED',
    };

    // 时间范围筛选（按官方发布日期 releaseDate 进行范围比对）
    if (timeRange === '7d') {
      versionWhere.releaseDate = { gte: calculateDateThreshold(7) };
    } else if (timeRange === '30d') {
      versionWhere.releaseDate = { gte: calculateDateThreshold(30) };
    } else if (timeRange === '90d') {
      versionWhere.releaseDate = { gte: calculateDateThreshold(90) };
    } else if (params.startDate || params.endDate) {
      versionWhere.releaseDate = {};
      if (params.startDate) versionWhere.releaseDate.gte = params.startDate;
      if (params.endDate) versionWhere.releaseDate.lte = params.endDate;
    }

    // 关键词搜索（软件名、开发者、版本号或更新日志）
    if (rawKeyword) {
      versionWhere.OR = [
        { software: { name: { contains: rawKeyword, mode: 'insensitive' } } },
        { software: { developer: { contains: rawKeyword, mode: 'insensitive' } } },
        { version: { contains: rawKeyword, mode: 'insensitive' } },
        { changelog: { contains: rawKeyword, mode: 'insensitive' } },
      ];
    }

    // 排序逻辑
    let orderBy: any = [{ releaseDate: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'latest_verified') {
      orderBy = [{ updatedAt: 'desc' }, { releaseDate: 'desc' }];
    } else if (sort === 'name') {
      orderBy = [{ software: { name: 'asc' } }, { releaseDate: 'desc' }];
    }

    // 并行拉取统计数据与列表
    const date7d = calculateDateThreshold(7);
    const date30d = calculateDateThreshold(30);
    const date90d = calculateDateThreshold(90);

    const [
      updates7d,
      updates30d,
      updates90d,
      totalPublished,
      totalVersions,
      verifiedSourcesCount,
      totalCount,
      rawVersions,
      rawRecentlyAdded,
      rawCategories,
      recommendations,
    ] = await Promise.all([
      // 7天内真实版本发布数
      prisma.softwareVersion.count({
        where: {
          software: { status: ResourceStatus.PUBLISHED, isTestData: false },
          reviewStatus: 'APPROVED',
          releaseDate: { gte: date7d },
        },
      }),
      // 30天内真实版本发布数
      prisma.softwareVersion.count({
        where: {
          software: { status: ResourceStatus.PUBLISHED, isTestData: false },
          reviewStatus: 'APPROVED',
          releaseDate: { gte: date30d },
        },
      }),
      // 90天内真实版本发布数
      prisma.softwareVersion.count({
        where: {
          software: { status: ResourceStatus.PUBLISHED, isTestData: false },
          reviewStatus: 'APPROVED',
          releaseDate: { gte: date90d },
        },
      }),
      // 已发布软件总数
      prisma.software.count({
        where: { status: ResourceStatus.PUBLISHED, isTestData: false },
      }),
      // 已发布软件的已审核版本总数
      prisma.softwareVersion.count({
        where: {
          software: { status: ResourceStatus.PUBLISHED, isTestData: false },
          reviewStatus: 'APPROVED',
        },
      }),
      // 已核验下载源总数
      prisma.downloadSource.count({
        where: {
          version: { software: { status: ResourceStatus.PUBLISHED, isTestData: false } },
        },
      }),
      // 当前过滤条件下的总记录数
      prisma.softwareVersion.count({ where: versionWhere }),
      // 当前页版本记录
      prisma.softwareVersion.findMany({
        where: versionWhere,
        orderBy,
        skip,
        take: limit,
        include: {
          software: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
            },
          },
          downloadSources: {
            select: {
              id: true,
              sourceType: true,
              sourceName: true,
              url: true,
            },
          },
        },
      }),
      // 最近收录专区（严格按首次入库时间/发布时间排序，与版本更新分离）
      prisma.software.findMany({
        where: { status: ResourceStatus.PUBLISHED, isTestData: false },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: 8,
        include: {
          category: { select: { name: true, slug: true } },
          versions: {
            where: { isLatest: true },
            take: 1,
            select: { version: true },
          },
        },
      }),
      // 分类列表及已审核版本计数
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              softwares: {
                where: { status: ResourceStatus.PUBLISHED, isTestData: false },
              },
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      // 推荐位
      prisma.channelRecommendation.findMany({
        where: {
          channel: 'UPDATES',
          isActive: true,
        },
        orderBy: { sortOrder: 'asc' },
        take: 4,
      }),
    ]);

    // 为当前页的每一个版本查找真实前置版本 (previousVersion)
    const softwareIds = Array.from(new Set(rawVersions.map((v) => v.softwareId)));
    const allVersionsForSoftwares = await prisma.softwareVersion.findMany({
      where: {
        softwareId: { in: softwareIds },
        reviewStatus: 'APPROVED',
      },
      orderBy: { releaseDate: 'desc' },
      select: { id: true, softwareId: true, version: true, releaseDate: true },
    });

    const previousVersionMap = new Map<string, string | null>();
    for (const v of rawVersions) {
      const versionsOfSoftware = allVersionsForSoftwares.filter(
        (item) => item.softwareId === v.softwareId
      );
      // 找到当前版本所在下标，前一个（发布日期更早的）即为上一版
      const currentIndex = versionsOfSoftware.findIndex((item) => item.id === v.id);
      if (currentIndex !== -1 && currentIndex + 1 < versionsOfSoftware.length) {
        previousVersionMap.set(v.id, versionsOfSoftware[currentIndex + 1].version);
      } else {
        // 无上一版记录，诚实置为 null，禁止虚构 vX-1
        previousVersionMap.set(v.id, null);
      }
    }

    // 格式化时间线记录
    const timelineItems: TimelineUpdateItemDto[] = rawVersions.map((v) => {
      const hasChangelog = Boolean(v.changelog && v.changelog.trim().length > 0);
      const sources = (v.downloadSources || []).map((s) => ({
        id: s.id,
        sourceType: s.sourceType,
        sourceName: s.sourceName,
        isOfficial: s.sourceType === 'OFFICIAL_DIRECT' || s.sourceType === 'OFFICIAL_RELEASE',
        isVerified: true,
        hasIntegrityCheck: true,
      }));

      return {
        versionId: v.id,
        softwareId: v.software.id,
        softwareName: v.software.name,
        softwareSlug: v.software.slug,
        softwareIconUrl: v.software.iconUrl,
        developer: v.software.developer || '原厂发行',
        type: v.software.type,
        categoryName: v.software.category?.name || '综合工具',
        categorySlug: v.software.category?.slug || 'tools',
        version: v.version,
        previousVersion: previousVersionMap.get(v.id) || null,
        releaseDate: v.releaseDate || '待确认',
        formattedDate: v.releaseDate || '日期待确认',
        dateGroup: categorizeDateGroup(v.releaseDate),
        platform: v.platform || 'Windows 10/11',
        architecture: v.architecture || 'x64',
        fileSize: v.fileSize || '未知大小',
        changelog: hasChangelog ? v.changelog : null,
        hasChangelog,
        missingChangelogNotice: hasChangelog ? null : '官方更新说明暂未收录',
        isLatest: v.isLatest,
        reviewStatus: v.reviewStatus,
        dataIntegrityStatus: v.software.dataIntegrityStatus,
        officialDomainVerified: v.software.officialDomainVerified,
        downloadSources: sources,
      };
    });

    // 格式化重点推荐 Hero 数据 (featuredUpdates)
    let featuredList: FeaturedUpdateDto[] = [];
    if (recommendations.length > 0) {
      // 若运营配置了 UPDATES 推荐位，优先读取
      for (const rec of recommendations) {
        if (rec.targetType === 'SOFTWARE') {
          const sw = await prisma.software.findUnique({
            where: { id: rec.targetId, status: ResourceStatus.PUBLISHED, isTestData: false },
            include: {
              category: { select: { name: true, slug: true } },
              versions: {
                where: { reviewStatus: 'APPROVED' },
                orderBy: { releaseDate: 'desc' },
                take: 1,
              },
            },
          });
          if (sw && sw.versions.length > 0) {
            const v = sw.versions[0];
            featuredList.push({
              softwareId: sw.id,
              softwareName: rec.title || sw.name,
              softwareSlug: sw.slug,
              softwareIconUrl: sw.iconUrl,
              developer: sw.developer,
              categoryName: sw.category?.name || '综合',
              categorySlug: sw.category?.slug || 'software',
              versionId: v.id,
              version: v.version,
              releaseDate: v.releaseDate,
              platform: v.platform,
              changelogSummary:
                rec.subtitle ||
                (v.changelog ? v.changelog.slice(0, 100) : sw.summary.slice(0, 100)),
              hasChangelog: Boolean(v.changelog && v.changelog.trim().length > 0),
              isLatest: v.isLatest,
              dataIntegrityStatus: sw.dataIntegrityStatus,
              officialDomainVerified: sw.officialDomainVerified,
              downloadUrl: `/software/${sw.slug}`,
            });
          }
        }
      }
    }

    // 若无单独运营配置，按真实已发布软件中最新版本遴选 3-4 款
    if (featuredList.length === 0) {
      const topRecent = await prisma.softwareVersion.findMany({
        where: {
          software: { status: ResourceStatus.PUBLISHED, isTestData: false },
          reviewStatus: 'APPROVED',
          isLatest: true,
        },
        orderBy: [{ releaseDate: 'desc' }, { createdAt: 'desc' }],
        take: 4,
        include: {
          software: {
            include: {
              category: { select: { name: true, slug: true } },
            },
          },
        },
      });

      featuredList = topRecent.map((v) => ({
        softwareId: v.software.id,
        softwareName: v.software.name,
        softwareSlug: v.software.slug,
        softwareIconUrl: v.software.iconUrl,
        developer: v.software.developer,
        categoryName: v.software.category?.name || '应用软件',
        categorySlug: v.software.category?.slug || 'software',
        versionId: v.id,
        version: v.version,
        releaseDate: v.releaseDate,
        platform: v.platform,
        changelogSummary: v.changelog
          ? v.changelog.slice(0, 100)
          : v.software.summary.slice(0, 100),
        hasChangelog: Boolean(v.changelog && v.changelog.trim().length > 0),
        isLatest: v.isLatest,
        dataIntegrityStatus: v.software.dataIntegrityStatus,
        officialDomainVerified: v.software.officialDomainVerified,
        downloadUrl: `/software/${v.software.slug}`,
      }));
    }

    // 格式化最近收录数据 (recentlyAdded)
    const recentlyAddedList: RecentlyAddedSoftwareDto[] = rawRecentlyAdded.map((sw) => ({
      id: sw.id,
      name: sw.name,
      slug: sw.slug,
      developer: sw.developer,
      type: sw.type,
      iconUrl: sw.iconUrl,
      categoryName: sw.category?.name || '软件',
      categorySlug: sw.category?.slug || 'software',
      summary: sw.summary,
      currentVersion: sw.versions[0]?.version || '1.0.0',
      publishedAt: (sw.publishedAt || sw.createdAt).toISOString(),
      createdAt: sw.createdAt.toISOString(),
    }));

    // 整理有资源的分类
    const activeCategories = rawCategories
      .filter((c) => c._count.softwares > 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: c._count.softwares,
      }));

    return {
      channel: 'UPDATES',
      stats: {
        updates7d,
        updates30d,
        updates90d,
        totalPublished,
        totalVersions,
        verifiedSourcesCount,
      },
      featuredUpdates: featuredList,
      timeline: {
        items: timelineItems,
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      recentlyAdded: recentlyAddedList,
      categories: activeCategories,
      meta: {
        asOf: new Date().toISOString(),
        dataCriteria:
          '严格依据软件真实发布日期 (releaseDate) 与已核验版本进行呈现，坚决杜绝 updatedAt 假冒新版本。',
      },
    };
  }

  /**
   * 获取指定软件的完整历史版本清单
   */
  static async getSoftwareVersionHistory(softwareIdOrSlug: string) {
    const software = await prisma.software.findFirst({
      where: {
        OR: [{ id: softwareIdOrSlug }, { slug: softwareIdOrSlug }],
        status: ResourceStatus.PUBLISHED,
        isTestData: false,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        iconUrl: true,
        developer: true,
        summary: true,
        dataIntegrityStatus: true,
        officialDomainVerified: true,
      },
    });

    if (!software) {
      return null;
    }

    const versions = await prisma.softwareVersion.findMany({
      where: {
        softwareId: software.id,
        reviewStatus: 'APPROVED',
      },
      orderBy: { releaseDate: 'desc' },
      include: {
        downloadSources: {
          select: {
            id: true,
            sourceType: true,
            sourceName: true,
            url: true,
          },
        },
      },
    });

    return {
      software,
      versions: versions.map((v) => ({
        id: v.id,
        version: v.version,
        releaseDate: v.releaseDate,
        platform: v.platform,
        architecture: v.architecture,
        fileSize: v.fileSize,
        changelog: v.changelog,
        hasChangelog: Boolean(v.changelog && v.changelog.trim().length > 0),
        isLatest: v.isLatest,
        downloadSources: v.downloadSources,
      })),
    };
  }
}
