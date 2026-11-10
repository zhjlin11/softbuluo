import { ResourceStatus, ResourceType, TopicStatus, ComparisonStatus } from '@prisma/client';
import { prisma } from '../../db';
import { validateSafeExternalUrl } from '../../utils/security';

export const ALLOWED_CHANNELS = ['SOFTWARE', 'SYSTEM_TOOLS', 'GAMES', 'ESSENTIALS', 'COMPARE'] as const;
export const ALLOWED_SLOTS = [
  'HERO',
  'WEEKLY_PICK',
  'EDITOR_PICK',
  'TOPIC_PICK',
  'CATEGORY_PICK',
] as const;
export const ALLOWED_TARGET_TYPES = [
  'SOFTWARE',
  'TOPIC',
  'COMPARISON',
  'TUTORIAL',
  'CATEGORY',
] as const;

export type ChannelSlotType = (typeof ALLOWED_SLOTS)[number];
export type ChannelTargetEntity = (typeof ALLOWED_TARGET_TYPES)[number];

export interface CompactSoftwareDto {
  id: string;
  slug: string;
  name: string;
  englishName: string | null;
  summary: string;
  iconUrl: string | null;
  type: ResourceType;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  developer: string | null;
  licenseType: string;
  priceType: string;
  viewCount: number;
  downloadCount: number;
  latestVersion: string | null;
  releaseDate: string | null;
  platform: string | null;
  fileSize: string | null;
  changelog: string | null;
  publishedAt: string | null;
  catalogedAt: string;
  updatedAt: string;
  isFeatured: boolean;
  featuredOrder: number;
  hasVerifiedSource: boolean;
  registeredSourcesCount: number;
  badgeText?: string | null;
  editorialNote?: string | null;
}

export interface HeroSlideDto {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  targetUrl: string;
  targetType: string;
  coverImage: string | null;
  theme: 'blue' | 'indigo' | 'emerald';
  statsText: string;
  previewSoftwares: Array<{
    slug: string;
    name: string;
    iconUrl: string | null;
    categorySlug: string;
    latestVersion: string | null;
  }>;
}

export const SLIDE_THEMES: Array<'blue' | 'indigo' | 'emerald'> = ['blue', 'indigo', 'emerald'];
export const INTERNAL_POLICY_TUTORIAL_SLUGS = new Set([
  'developer-verification-guide',
  'software-claim-verification-tutorial',
  'community-guidelines-and-feedback-rules',
  'official-download-source-policy',
]);

export function isWithinSchedule(rec: { isActive: boolean; startAt: Date | null; endAt: Date | null }, now: Date): boolean {
  if (!rec.isActive) return false;
  if (rec.startAt && rec.startAt > now) return false;
  if (rec.endAt && rec.endAt < now) return false;
  return true;
}

export async function validateSafeImageUrl(rawUrl?: string | null): Promise<{ valid: boolean; normalized: string | null; reason?: string }> {
  if (!rawUrl || !rawUrl.trim()) {
    return { valid: true, normalized: null };
  }
  const trimmed = rawUrl.trim();
  if (trimmed.length > 500 || /[\r\n<>'"`]/.test(trimmed)) {
    return { valid: false, normalized: null, reason: '图片地址包含非法字符或长度超限' };
  }
  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//') || trimmed.includes('..')) {
      return { valid: false, normalized: null, reason: '相对路径不允许 // 或目录穿越字符' };
    }
    return { valid: true, normalized: trimmed };
  }
  if (!trimmed.startsWith('https://')) {
    return { valid: false, normalized: null, reason: '外部图片地址必须使用 HTTPS 或站内相对路径' };
  }
  const check = await validateSafeExternalUrl(trimmed);
  if (!check.valid) {
    return { valid: false, normalized: null, reason: check.reason || '不安全的图片链接' };
  }
  return { valid: true, normalized: trimmed };
}

export async function validateChannelTarget(
  targetType: string,
  targetId: string,
  channel?: string
): Promise<{ valid: boolean; reason?: string; label?: string }> {
  if (targetType === 'SOFTWARE') {
    const sw = await prisma.software.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        name: true,
        status: true,
        isTestData: true,
        type: true,
        category: { select: { slug: true } },
      },
    });
    if (!sw) return { valid: false, reason: '目标软件不存在' };
    if (sw.status !== ResourceStatus.PUBLISHED) return { valid: false, reason: '仅允许推荐已发布 (PUBLISHED) 软件，严禁绕过审核' };
    if (sw.isTestData) return { valid: false, reason: '禁止将测试数据添加到正式推荐位' };
    if (channel === 'GAMES') {
      if (sw.type !== ResourceType.GAME) {
        return { valid: false, reason: '游戏中心频道仅允许推荐已发布游戏本体，辅助工具不可混入游戏主推荐位' };
      }
    } else if (sw.type === ResourceType.GAME) {
      return { valid: false, reason: '桌面与系统工具频道禁止添加游戏类型资源' };
    }
    if (
      channel === 'SYSTEM_TOOLS' &&
      sw.type !== ResourceType.TOOL &&
      !['sys-tools', 'hardware', 'network', 'security', 'drivers'].includes(sw.category?.slug || '')
    ) {
      return { valid: false, reason: '系统工具频道仅允许推荐系统维护、硬件检测或网络诊断类工具，禁止混入办公/影音等非工具软件' };
    }
    return { valid: true, label: sw.name };
  }
  if (targetType === 'TOPIC') {
    const topic = await prisma.topic.findUnique({
      where: { id: targetId },
      select: { id: true, title: true, status: true, slug: true },
    });
    if (!topic) return { valid: false, reason: '目标专题不存在' };
    if (topic.status !== TopicStatus.PUBLISHED) return { valid: false, reason: '仅允许推荐已发布状态的专题' };
    if (topic.slug.startsWith('topic-p3-')) return { valid: false, reason: '禁止将测试专题加入运营推荐位' };
    return { valid: true, label: topic.title };
  }
  if (targetType === 'COMPARISON') {
    const comp = await prisma.softwareComparison.findUnique({
      where: { id: targetId },
      select: { id: true, title: true, status: true },
    });
    if (!comp) return { valid: false, reason: '目标评测对比不存在' };
    if (comp.status !== ComparisonStatus.PUBLISHED) return { valid: false, reason: '仅允许推荐已发布评测对比' };
    return { valid: true, label: comp.title };
  }
  if (targetType === 'TUTORIAL') {
    const tut = await prisma.tutorial.findUnique({
      where: { id: targetId },
      select: { id: true, title: true, status: true, slug: true },
    });
    if (!tut) return { valid: false, reason: '目标教程不存在' };
    if (tut.status !== 'PUBLISHED' || tut.slug.startsWith('tut-p3-')) {
      return { valid: false, reason: '仅允许推荐已发布的正式软件教程' };
    }
    return { valid: true, label: tut.title };
  }
  if (targetType === 'CATEGORY') {
    const cat = await prisma.category.findUnique({
      where: { id: targetId },
      select: { id: true, name: true, isVisible: true },
    });
    if (!cat || !cat.isVisible) return { valid: false, reason: '目标分类不存在或已隐藏' };
    return { valid: true, label: cat.name };
  }
  return { valid: false, reason: '不支持的推荐目标类型' };
}

export function sanitizeChannelIconUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.includes('dicebear.com') || url.includes('google.com/chrome/static')) {
    return null;
  }
  return url;
}

export function conciseHeroText(text: string, maxChars: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  const firstClause = clean.split(/[。！？!]/)[0]?.trim() || clean;
  if (firstClause.length <= maxChars) return firstClause;
  const slice = clean.slice(0, maxChars);
  const lastSep = Math.max(slice.lastIndexOf('，'), slice.lastIndexOf('、'), slice.lastIndexOf('；'));
  if (lastSep >= Math.floor(maxChars * 0.55)) {
    return `${slice.slice(0, lastSep).trim()}…`;
  }
  return `${slice.slice(0, maxChars - 1).trim()}…`;
}

export function getProductFamilyKey(slug: string): string {
  if (slug.startsWith('windows-')) return 'family-windows-os';
  if (slug.startsWith('office-') || slug === 'microsoft-365') return 'family-microsoft-office';
  return `sw-${slug}`;
}

export function toCompactSoftware(
  sw: any,
  dlCountMap: Map<string, number>,
  override?: { badgeText?: string | null; subtitle?: string | null }
): CompactSoftwareDto {
  const latestVer = sw.versions?.[0] || null;
  const activeSources = latestVer?.downloadSources || [];
  const hasVerifiedSource = activeSources.some(
    (src: any) =>
      src.verificationStatus === 'VERIFIED' &&
      src.reviewStatus === 'APPROVED' &&
      src.lastCheckStatus === 'HEALTHY'
  );
  return {
    id: sw.id,
    slug: sw.slug,
    name: sw.name,
    englishName: sw.englishName || null,
    summary: sw.summary,
    iconUrl: sanitizeChannelIconUrl(sw.iconUrl),
    type: sw.type,
    categoryId: sw.categoryId,
    categoryName: sw.category?.name || '常用软件',
    categorySlug: sw.category?.slug || 'sys-tools',
    developer: sw.developer || null,
    licenseType: sw.licenseType || 'Freeware',
    priceType: sw.priceType || 'FREE',
    viewCount: sw.viewCount || 0,
    downloadCount: dlCountMap.get(sw.id) ?? 0,
    latestVersion: latestVer?.version || null,
    releaseDate: latestVer?.releaseDate || null,
    platform: latestVer?.platform || null,
    fileSize: latestVer?.fileSize || null,
    changelog: latestVer?.changelog || null,
    publishedAt: sw.publishedAt ? sw.publishedAt.toISOString() : null,
    catalogedAt: (sw.publishedAt || sw.createdAt).toISOString(),
    updatedAt: sw.updatedAt.toISOString(),
    isFeatured: Boolean(sw.isFeatured),
    featuredOrder: sw.featuredOrder ?? 99,
    hasVerifiedSource,
    registeredSourcesCount: activeSources.length,
    badgeText: override?.badgeText || null,
    editorialNote: override?.subtitle || null,
  };
}

export class SoftwareChannelService {
  static async getSoftwareChannelData() {
    const now = new Date();

    const [
      categoriesRaw,
      softwaresRaw,
      dlGroups,
      recommendationsRaw,
      topicsRaw,
      tutorialsRaw,
      comparisonsRaw,
      activeSourcesCount,
      approvedHealthySourcesCount,
      sha256SourcesCount,
    ] = await Promise.all([
      prisma.category.findMany({
        where: { isVisible: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.software.findMany({
        where: {
          status: ResourceStatus.PUBLISHED,
          isTestData: false,
          type: { not: ResourceType.GAME },
        },
        include: {
          category: true,
          versions: {
            orderBy: [{ isLatest: 'desc' }, { createdAt: 'desc' }],
            take: 1,
            include: {
              downloadSources: {
                where: { isActive: true },
                select: { id: true, verificationStatus: true, reviewStatus: true, lastCheckStatus: true },
              },
            },
          },
        },
        orderBy: [{ featuredOrder: 'asc' }, { viewCount: 'desc' }],
      }),
      prisma.downloadEvent.groupBy({
        by: ['softwareId'],
        where: { isTestEvent: false },
        _count: { softwareId: true },
      }),
      prisma.channelRecommendation.findMany({
        where: { channel: 'SOFTWARE', isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.topic.findMany({
        where: {
          status: TopicStatus.PUBLISHED,
          NOT: { slug: { startsWith: 'topic-p3-' } },
        },
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { publishedAt: 'desc' }],
        include: {
          resources: {
            orderBy: { sortOrder: 'asc' },
            include: {
              software: {
                include: {
                  category: true,
                  versions: { where: { isLatest: true }, take: 1 },
                },
              },
            },
          },
        },
      }),
      prisma.tutorial.findMany({
        where: {
          status: 'PUBLISHED',
          NOT: { slug: { startsWith: 'tut-p3-' } },
        },
        orderBy: { publishedAt: 'desc' },
        include: {
          software: {
            select: { id: true, slug: true, name: true, iconUrl: true, type: true, status: true, isTestData: true },
          },
        },
      }),
      prisma.softwareComparison.findMany({
        where: { status: ComparisonStatus.PUBLISHED },
        orderBy: { updatedAt: 'desc' },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              software: {
                select: { id: true, slug: true, name: true, status: true, isTestData: true, iconUrl: true },
              },
            },
          },
        },
      }),
      prisma.downloadSource.count({
        where: {
          isActive: true,
          version: {
            software: {
              status: ResourceStatus.PUBLISHED,
              isTestData: false,
              type: { not: ResourceType.GAME },
            },
          },
        },
      }),
      prisma.downloadSource.count({
        where: {
          isActive: true,
          verificationStatus: 'VERIFIED',
          reviewStatus: 'APPROVED',
          lastCheckStatus: 'HEALTHY',
          version: {
            software: {
              status: ResourceStatus.PUBLISHED,
              isTestData: false,
              type: { not: ResourceType.GAME },
            },
          },
        },
      }),
      prisma.downloadSource.count({
        where: {
          isActive: true,
          sha256: { not: null },
          version: {
            software: {
              status: ResourceStatus.PUBLISHED,
              isTestData: false,
              type: { not: ResourceType.GAME },
            },
          },
        },
      }),
    ]);

    const dlCountMap = new Map<string, number>();
    let totalDesktopDownloads = 0;
    const swIdsSet = new Set(softwaresRaw.map((s) => s.id));
    for (const g of dlGroups) {
      dlCountMap.set(g.softwareId, g._count.softwareId);
      if (swIdsSet.has(g.softwareId)) {
        totalDesktopDownloads += g._count.softwareId;
      }
    }

    const allSoftwares = softwaresRaw.map((s) => toCompactSoftware(s, dlCountMap));
    const swMap = new Map(allSoftwares.map((s) => [s.id, s]));

    // 过滤当前有效时间窗的后台推荐配置
    const activeRecs = recommendationsRaw.filter((rec) => isWithinSchedule(rec, now));

    // 构建合法桌面专题集合（仅统计已发布且非测试关联软件）
    const desktopTopics = topicsRaw
      .map((t) => {
        const validResources = (t.resources || [])
          .filter((r) => r.software && r.software.status === ResourceStatus.PUBLISHED && !r.software.isTestData && r.software.type !== ResourceType.GAME)
          .map((r) => swMap.get(r.softwareId))
          .filter((s): s is CompactSoftwareDto => Boolean(s));
        return {
          id: t.id,
          slug: t.slug,
          title: t.title,
          description: t.description,
          coverUrl: t.coverUrl,
          isFeatured: t.isFeatured,
          publishedAt: t.publishedAt ? t.publishedAt.toISOString() : t.createdAt.toISOString(),
          resourceCount: validResources.length,
          previewSoftwares: validResources.slice(0, 4).map((s) => ({
            slug: s.slug,
            name: s.name,
            iconUrl: s.iconUrl,
            categorySlug: s.categorySlug,
          })),
        };
      })
      .filter((t) => t.slug !== 'open-source-games-collection' && t.resourceCount > 0);
    const topicMap = new Map(desktopTopics.map((t) => [t.id, t]));

    // 1. 构建焦点 Hero 展位 (3 帧，优先读取 HERO 配置，不足则用精选真实专题/重点软件兜底)
    const heroSlides: HeroSlideDto[] = [];
    const seenHeroKeys = new Set<string>();
    const heroRecs = activeRecs.filter((r) => r.slot === 'HERO');
    for (let i = 0; i < heroRecs.length && heroSlides.length < 3; i++) {
      const rec = heroRecs[i];
      if (rec.targetType === 'TOPIC' && topicMap.has(rec.targetId)) {
        const topic = topicMap.get(rec.targetId)!;
        const key = `TOPIC:${topic.id}`;
        if (seenHeroKeys.has(key)) continue;
        seenHeroKeys.add(key);
        heroSlides.push({
          id: rec.id,
          title: conciseHeroText(rec.title || topic.title, 32),
          subtitle: conciseHeroText(rec.subtitle || topic.description, 64),
          badge: rec.badgeText || '精选软件专题',
          targetUrl: `/topics/${topic.slug}`,
          targetType: 'TOPIC',
          coverImage: rec.coverImage || null,
          theme: SLIDE_THEMES[heroSlides.length % 3],
          statsText: `已收录 ${topic.resourceCount} 款公开资源`,
          previewSoftwares: topic.previewSoftwares.map((s) => ({
            ...s,
            latestVersion: swMap.get(allSoftwares.find((x) => x.slug === s.slug)?.id || '')?.latestVersion || null,
          })),
        });
      } else if (rec.targetType === 'SOFTWARE' && swMap.has(rec.targetId)) {
        const sw = swMap.get(rec.targetId)!;
        const key = `SOFTWARE:${sw.id}`;
        if (seenHeroKeys.has(key)) continue;
        seenHeroKeys.add(key);
        heroSlides.push({
          id: rec.id,
          title: conciseHeroText(rec.title || sw.name, 26),
          subtitle: conciseHeroText(rec.subtitle || sw.summary, 48),
          badge: rec.badgeText || '编辑重点推荐',
          targetUrl: `/software/${sw.slug}`,
          targetType: 'SOFTWARE',
          coverImage: rec.coverImage || null,
          theme: SLIDE_THEMES[heroSlides.length % 3],
          statsText: sw.hasVerifiedSource ? '含已审核直达来源' : '已登记发布渠道 · 请核对授权',
          previewSoftwares: [
            {
              slug: sw.slug,
              name: sw.name,
              iconUrl: sw.iconUrl,
              categorySlug: sw.categorySlug,
              latestVersion: sw.latestVersion,
            },
          ],
        });
      }
    }

    // 兜底补齐焦点展位至 3 个真实内容（精简主视觉标题与一行简介，避免堆砌文案）
    for (const topic of desktopTopics) {
      if (heroSlides.length >= 3) break;
      const key = `TOPIC:${topic.id}`;
      if (seenHeroKeys.has(key)) continue;
      seenHeroKeys.add(key);
      heroSlides.push({
        id: `auto-topic-${topic.slug}`,
        title: conciseHeroText(topic.title, 32),
        subtitle: conciseHeroText(topic.description, 64),
        badge: topic.isFeatured ? '编辑精选专题' : '精选软件专题',
        targetUrl: `/topics/${topic.slug}`,
        targetType: 'TOPIC',
        coverImage: null,
        theme: SLIDE_THEMES[heroSlides.length % 3],
        statsText: `收录 ${topic.resourceCount} 款相关资源`,
        previewSoftwares: topic.previewSoftwares.map((s) => ({
          ...s,
          latestVersion: allSoftwares.find((x) => x.slug === s.slug)?.latestVersion || null,
        })),
      });
    }

    // 2. 本周热推矩阵 (8 款高实用度工具，限制单系列占比，优先 WEEKLY_PICK 运营配置)
    const weeklyPool = [...allSoftwares].sort(
      (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.viewCount - a.viewCount
    );
    const weeklyPicks = pickChannelSoftwares({
      recs: activeRecs.filter((r) => r.slot === 'WEEKLY_PICK' && r.targetType === 'SOFTWARE'),
      pool: weeklyPool,
      swMap,
      limit: 8,
      maxPerFamily: 1,
    });

    // 3. 编辑精选 (8 款，严格去重：排除本周热推已展示软件，保留多样化跨分类工具)
    const weeklyIds = new Set(weeklyPicks.map((s) => s.id));
    const editorPool = [
      ...allSoftwares.filter((s) => !weeklyIds.has(s.id) && s.isFeatured),
      ...allSoftwares.filter((s) => !weeklyIds.has(s.id) && !s.isFeatured),
    ];
    const editorPicks = pickChannelSoftwares({
      recs: activeRecs.filter((r) => r.slot === 'EDITOR_PICK' && r.targetType === 'SOFTWARE'),
      pool: editorPool,
      swMap,
      limit: 8,
      maxPerFamily: 1,
    });

    // 4. 双榜排行（严格真实统计口径：绝不用无点击 0 值凑满 TOP 10）
    const mostViewed = [...allSoftwares]
      .filter((s) => s.viewCount > 0)
      .sort((a, b) => b.viewCount - a.viewCount || b.downloadCount - a.downloadCount)
      .slice(0, 10);

    const mostDownloaded = [...allSoftwares]
      .filter((s) => s.downloadCount > 0)
      .sort((a, b) => b.downloadCount - a.downloadCount || b.viewCount - a.viewCount)
      .slice(0, 10);

    // 5. 热门分类导航与分类软件区块（仅保留有真实非游戏软件的分类，每类预览首行 4 款避免大面积冗余重复）
    const categoryPickRecs = activeRecs.filter((r) => r.slot === 'CATEGORY_PICK' && r.targetType === 'SOFTWARE');
    const categories = categoriesRaw
      .map((cat) => {
        const catSoftwares = allSoftwares.filter((s) => s.categoryId === cat.id);
        if (catSoftwares.length === 0) return null;
        const prioritizedIds = categoryPickRecs
          .filter((r) => swMap.get(r.targetId)?.categoryId === cat.id)
          .map((r) => r.targetId);
        const ordered = [
          ...prioritizedIds.map((id) => swMap.get(id)!).filter(Boolean),
          ...catSoftwares.filter((s) => !prioritizedIds.includes(s.id)).sort((a, b) => b.viewCount - a.viewCount),
        ];
        return {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description || '',
          count: catSoftwares.length,
          representativeSoftwares: ordered.slice(0, 3).map((s) => ({
            id: s.id,
            slug: s.slug,
            name: s.name,
            iconUrl: s.iconUrl,
            categorySlug: s.categorySlug,
          })),
          softwares: ordered.slice(0, 4),
        };
      })
      .filter((c): c is NonNullable<typeof c> => Boolean(c));

    // 6. 热门专题推荐 (6 个，优先 TOPIC_PICK)
    const topicPickIds = activeRecs
      .filter((r) => r.slot === 'TOPIC_PICK' && r.targetType === 'TOPIC')
      .map((r) => r.targetId);
    const hotTopics = [
      ...topicPickIds.map((id) => topicMap.get(id)!).filter(Boolean),
      ...desktopTopics.filter((t) => !topicPickIds.includes(t.id)),
    ].slice(0, 6);

    // 7. 实用教程与评测对比
    const validTutorials = tutorialsRaw
      .filter((t) => !t.software || (t.software.status === ResourceStatus.PUBLISHED && !t.software.isTestData && t.software.type !== ResourceType.GAME))
      .sort((a, b) => {
        const aMeta = INTERNAL_POLICY_TUTORIAL_SLUGS.has(a.slug) ? 1 : 0;
        const bMeta = INTERNAL_POLICY_TUTORIAL_SLUGS.has(b.slug) ? 1 : 0;
        if (aMeta !== bMeta) return aMeta - bMeta;
        return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
      })
      .slice(0, 6)
      .map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        summary: t.summary,
        viewCount: t.viewCount,
        publishedAt: (t.publishedAt || t.createdAt).toISOString(),
        software: t.software
          ? { slug: t.software.slug, name: t.software.name, iconUrl: t.software.iconUrl }
          : null,
      }));

    const validComparisons = comparisonsRaw
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        summary: c.summary,
        updatedAt: c.updatedAt.toISOString(),
        softwares: c.items
          .filter((it) => it.software.status === ResourceStatus.PUBLISHED && !it.software.isTestData)
          .map((it) => ({
            slug: it.software.slug,
            name: it.software.name,
            iconUrl: it.software.iconUrl,
          })),
      }))
      .filter((c) => c.softwares.length >= 1)
      .slice(0, 4);

    // 8. 最近更新（严格区分：已有资源版本发布日 vs 新收录上架日，按软件去重）
    const versionUpdates = [...allSoftwares]
      .filter((s) => Boolean(s.latestVersion))
      .sort((a, b) => {
        const dateA = a.releaseDate || '';
        const dateB = b.releaseDate || '';
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return b.updatedAt.localeCompare(a.updatedAt);
      })
      .slice(0, 10);

    const newlyCataloged = [...allSoftwares]
      .sort((a, b) => new Date(b.catalogedAt).getTime() - new Date(a.catalogedAt).getTime())
      .slice(0, 10);

    return {
      meta: {
        channel: 'SOFTWARE',
        totalSoftwareCount: allSoftwares.length,
        verifiedSourcesCount: approvedHealthySourcesCount,
        registeredSourcesCount: activeSourcesCount,
        approvedHealthySourcesCount,
        pendingSourcesCount: Math.max(0, activeSourcesCount - approvedHealthySourcesCount),
        sha256VerifiedCount: sha256SourcesCount,
        topicsCount: desktopTopics.length,
        tutorialsCount: tutorialsRaw.length,
        comparisonsCount: validComparisons.length,
        totalDownloadEvents: totalDesktopDownloads,
        viewStatsLabel: '页面浏览量（非下载次数）',
        downloadStatsLabel: '站内下载触发次数（非实际文件完成传输数）',
      },
      categories: categories.map(({ softwares: _unused, ...rest }) => rest),
      heroSlides,
      weeklyPicks,
      editorPicks,
      leaderboards: {
        mostViewed,
        mostDownloaded,
      },
      hotTopics,
      categoryBlocks: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        totalCount: c.count,
        softwares: c.softwares,
      })),
      tutorials: validTutorials,
      comparisons: validComparisons,
      latestUpdates: {
        versionUpdates,
        newlyCataloged,
      },
    };
  }
}

export function pickChannelSoftwares(params: {
  recs: Array<{ targetId: string; badgeText: string | null; subtitle: string | null }>;
  pool: CompactSoftwareDto[];
  swMap: Map<string, CompactSoftwareDto>;
  limit: number;
  maxPerFamily?: number;
}): CompactSoftwareDto[] {
  const result: CompactSoftwareDto[] = [];
  const seen = new Set<string>();
  const familyCounts = new Map<string, number>();

  for (const rec of params.recs) {
    if (result.length >= params.limit) break;
    const sw = params.swMap.get(rec.targetId);
    if (!sw || seen.has(sw.id)) continue;
    seen.add(sw.id);
    const fk = getProductFamilyKey(sw.slug);
    familyCounts.set(fk, (familyCounts.get(fk) || 0) + 1);
    result.push({
      ...sw,
      badgeText: rec.badgeText || sw.badgeText,
      editorialNote: rec.subtitle || sw.editorialNote,
    });
  }

  for (const sw of params.pool) {
    if (result.length >= params.limit) break;
    if (seen.has(sw.id)) continue;
    const fk = getProductFamilyKey(sw.slug);
    if (params.maxPerFamily && (familyCounts.get(fk) || 0) >= params.maxPerFamily) {
      continue;
    }
    seen.add(sw.id);
    familyCounts.set(fk, (familyCounts.get(fk) || 0) + 1);
    result.push(sw);
  }

  // 若严格限制家族数量导致总数仍未达标，再按顺序补足（绝不制造假软件或重复同 ID）
  if (result.length < params.limit) {
    for (const sw of params.pool) {
      if (result.length >= params.limit) break;
      if (seen.has(sw.id)) continue;
      seen.add(sw.id);
      result.push(sw);
    }
  }

  return result;
}
