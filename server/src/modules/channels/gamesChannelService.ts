import { ComparisonStatus, ResourceStatus, ResourceType, TopicStatus } from '@prisma/client';
import { prisma } from '../../db';
import {
  CompactSoftwareDto,
  HeroSlideDto,
  INTERNAL_POLICY_TUTORIAL_SLUGS,
  SLIDE_THEMES,
  conciseHeroText,
  isWithinSchedule,
  pickChannelSoftwares,
  toCompactSoftware,
} from './softwareChannelService';

export type GameSourceDeliveryType =
  | 'DIRECT_INSTALLER'
  | 'OFFICIAL_DOWNLOAD_PAGE'
  | 'STORE_PAGE'
  | 'OFFICIAL_WEBSITE';

export interface GamePortalItemDto extends CompactSoftwareDto {
  genre: string;
  genreSlug: string;
  genreName: string;
  coverUrl: string;
  heroImageUrl: string;
  gallery: string[];
  distributionPlatform: string | null;
  distributionChannels: string[];
  officialWebsite: string | null;
  supportedPlatforms: string;
  platformsList: string[];
  deliveryType: GameSourceDeliveryType;
  deliveryLabel: string;
  verifiedSha256Count: number;
  approvedHealthyCount: number;
}

export interface GameGenreBlockDto {
  slug: string;
  name: string;
  badge: string;
  description: string;
  totalCount: number;
  games: GamePortalItemDto[];
}

export interface GameCompanionToolDto extends CompactSoftwareDto {
  roleLabel: string;
  isCompanionTool: true;
}

export interface GamesChannelData {
  channel: 'GAMES';
  meta: {
    totalGamesCount: number;
    openSourceGamesCount: number;
    registeredSourcesCount: number;
    approvedHealthySourcesCount: number;
    verifiedSha256Count: number;
    directDownloadGamesCount: number;
    officialPageGamesCount: number;
    storeLinkedGamesCount: number;
    companionToolsCount: number;
    topicsCount: number;
    guidesCount: number;
    draftQueueCount: number;
    sampleNote: string;
    redistributionNotice: string;
    generatedAt: string;
  };
  heroSlides: HeroSlideDto[];
  quickFilters: Array<{
    slug: string;
    name: string;
    count: number;
  }>;
  spotlightGames: GamePortalItemDto[];
  genreBlocks: GameGenreBlockDto[];
  upcomingGenreLabels: string[];
  companionTools: GameCompanionToolDto[];
  hotTopics: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    coverUrl: string | null;
    resourceCount: number;
    previewGames: Array<{
      slug: string;
      name: string;
      coverUrl: string;
    }>;
  }>;
  guides: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    viewCount: number;
    publishedAt: string | null;
    relatedSlug: string | null;
    relatedName: string | null;
    guideScopeLabel: string;
  }>;
  leaderboards: {
    sampleThreshold: number;
    popularTop: Array<{ rank: number; software: GamePortalItemDto }>;
    downloadsTop: Array<{ rank: number; software: GamePortalItemDto }>;
  };
  latestUpdates: {
    versionUpdates: GamePortalItemDto[];
    newlyCataloged: GamePortalItemDto[];
  };
  distributionStandards: Array<{
    title: string;
    badge: string;
    description: string;
    tone: 'emerald' | 'blue' | 'amber';
  }>;
}

interface GameArtworkProfile {
  coverUrl: string;
  heroImageUrl: string;
  gallery: string[];
}

const VERIFIED_GAME_ARTWORK: Record<string, GameArtworkProfile> = {
  mindustry: {
    coverUrl: '/images/games/mindustry-cover.jpg',
    heroImageUrl: '/images/games/mindustry-screen-1.jpg',
    gallery: [
      '/images/games/mindustry-screen-1.jpg',
      '/images/games/mindustry-screen-2.jpg',
      '/images/games/mindustry-screen-3.jpg',
    ],
  },
  supertuxkart: {
    coverUrl: '/images/games/supertuxkart-cover.jpg',
    heroImageUrl: '/images/games/supertuxkart-screen-1.jpg',
    gallery: [
      '/images/games/supertuxkart-screen-1.jpg',
      '/images/games/supertuxkart-screen-2.jpg',
      '/images/games/supertuxkart-screen-3.jpg',
    ],
  },
};

export const GAME_GENRE_DEFS: Array<{
  slug: string;
  name: string;
  badge: string;
  description: string;
  keywords: string[];
}> = [
  {
    slug: 'strategy-tower',
    name: '策略塔防与建造',
    badge: 'Strategy / TD',
    description: '注重资源流水线规划、基地建造、即时战略博弈与高重玩深度。',
    keywords: ['策略', '塔防', '工厂', '建造', '战略', '战棋', 'rts', 'slg'],
  },
  {
    slug: 'racing-sports',
    name: '3D 竞速与娱乐',
    badge: 'Racing / Arcade',
    description: '支持本机分屏与联机竞速的多人欢乐赛道、物理竞速与体育体验。',
    keywords: ['竞速', '赛车', '卡丁车', '体育', '赛道'],
  },
  {
    slug: 'simulation-sandbox',
    name: '模拟经营与沙盒',
    badge: 'Simulation',
    description: '自由建造世界、物流运输网络经营与开放沙盒探索作品。',
    keywords: ['模拟', '经营', '沙盒', '运输', '太空', '体素'],
  },
  {
    slug: 'tactics-adventure',
    name: '地牢探索与战棋',
    badge: 'Roguelike / RPG',
    description: '聚焦回合制策略战棋与随机生成地牢挑战的轻量化经典独立作。',
    keywords: ['地牢', 'roguelike', '冒险', '角色', 'rpg'],
  },
];

const COMPANION_TOOL_ROLES: Record<string, string> = {
  'obs-studio': '60FPS 游戏录屏与实况推流',
  vlc: '本地游戏实机录像回放查看',
};

const GAME_GUIDE_ALLOWED_SLUGS = new Set([
  'obs-studio-game-recording-settings',
  'how-to-verify-genuine-iso-checksums',
]);

function classifyGameGenre(raw: {
  name: string;
  genre?: string | null;
  summary: string;
  description?: string | null;
}) {
  const haystack = `${raw.genre || ''} ${raw.name} ${raw.summary} ${raw.description || ''}`.toLowerCase();
  for (const def of GAME_GENRE_DEFS) {
    if (def.keywords.some((kw) => haystack.includes(kw))) {
      return {
        genreSlug: def.slug,
        genreName: def.name,
        displayGenre: raw.genre || def.name,
      };
    }
  }
  return {
    genreSlug: 'strategy-tower',
    genreName: '策略与独立精品',
    displayGenre: raw.genre || '开源独立游戏',
  };
}

function classifyGameDelivery(raw: any): {
  deliveryType: GameSourceDeliveryType;
  deliveryLabel: string;
  verifiedSha256Count: number;
  approvedHealthyCount: number;
} {
  const latestVer = raw.versions?.[0];
  const activeSources = (latestVer?.downloadSources || []).filter((s: any) => s.isActive !== false);

  const verifiedSha256Count = activeSources.filter((s: any) => Boolean(s.sha256)).length;
  const approvedHealthyCount = activeSources.filter(
    (s: any) =>
      s.verificationStatus === 'VERIFIED' &&
      s.reviewStatus === 'APPROVED' &&
      s.lastCheckStatus === 'HEALTHY'
  ).length;
  const hasDirectInstaller = activeSources.some(
    (s: any) =>
      Boolean(s.fileId) ||
      Boolean(s.directFileUrl) ||
      ['HOSTED_MIRROR', 'GITHUB_RELEASE', 'DIRECT_DOWNLOAD', 'OFFICIAL_DIRECT'].includes(s.sourceType)
  );

  if (approvedHealthyCount > 0 && verifiedSha256Count > 0) {
    return {
      deliveryType: 'DIRECT_INSTALLER',
      deliveryLabel: '已核验直连安装 · 含原厂 SHA-256',
      verifiedSha256Count,
      approvedHealthyCount,
    };
  }
  if (hasDirectInstaller) {
    return {
      deliveryType: 'DIRECT_INSTALLER',
      deliveryLabel: '官方/开源安装包直链（核验明细见详情）',
      verifiedSha256Count,
      approvedHealthyCount,
    };
  }
  if (activeSources.length > 0) {
    return {
      deliveryType: 'OFFICIAL_DOWNLOAD_PAGE',
      deliveryLabel: '官方下载引导页（尚未实机哈希校验）',
      verifiedSha256Count,
      approvedHealthyCount,
    };
  }
  if ((raw.distributionPlatform || '').match(/steam|epic|gog|itch/i)) {
    return {
      deliveryType: 'STORE_PAGE',
      deliveryLabel: '正规商店/发行主页指引',
      verifiedSha256Count,
      approvedHealthyCount,
    };
  }
  return {
    deliveryType: 'OFFICIAL_WEBSITE',
    deliveryLabel: '开发团队官方主页来源',
    verifiedSha256Count,
    approvedHealthyCount,
  };
}

function enrichGameDto(raw: any, dlCountMap: Map<string, number>): GamePortalItemDto {
  const base = toCompactSoftware(raw, dlCountMap);
  const genreInfo = classifyGameGenre(raw);
  const delivery = classifyGameDelivery(raw);
  const mappedArt = VERIFIED_GAME_ARTWORK[raw.slug];
  const fallbackCover = raw.coverUrl || mappedArt?.coverUrl || '/images/games/hero-indie-collection.svg';
  const heroImageUrl = mappedArt?.heroImageUrl || raw.coverUrl || fallbackCover;
  const gallery =
    mappedArt?.gallery && mappedArt.gallery.length > 0 ? mappedArt.gallery : [heroImageUrl];

  const distributionChannels = (raw.distributionPlatform || '')
    .split('/')
    .map((s: string) => s.trim())
    .filter(Boolean);

  const platformsList = (raw.supportedPlatforms || 'Windows 10/11')
    .split(/[,/]/)
    .map((s: string) => s.trim())
    .filter(Boolean);

  return {
    ...base,
    genre: genreInfo.displayGenre,
    genreSlug: genreInfo.genreSlug,
    genreName: genreInfo.genreName,
    coverUrl: fallbackCover,
    heroImageUrl,
    gallery,
    distributionPlatform: raw.distributionPlatform || null,
    distributionChannels,
    officialWebsite: raw.officialWebsite || null,
    supportedPlatforms: raw.supportedPlatforms || 'Windows 10/11',
    platformsList,
    deliveryType: delivery.deliveryType,
    deliveryLabel: delivery.deliveryLabel,
    verifiedSha256Count: delivery.verifiedSha256Count,
    approvedHealthyCount: delivery.approvedHealthyCount,
  };
}

export class GamesChannelService {
  static async getGamesChannelData(): Promise<GamesChannelData> {
    const now = new Date();

    const [
      gamesRaw,
      draftCount,
      dlGroups,
      recommendationsRaw,
      topicsRaw,
      tutorialsRaw,
      companionToolsRaw,
      registeredSourcesCount,
      approvedHealthySourcesCount,
      verifiedSha256Count,
    ] = await Promise.all([
      prisma.software.findMany({
        where: {
          status: ResourceStatus.PUBLISHED,
          isTestData: false,
          type: ResourceType.GAME,
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          versions: {
            where: { isLatest: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              downloadSources: {
                where: { isActive: true },
                orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
              },
            },
          },
          licenses: {
            take: 1,
            orderBy: { reviewedAt: 'desc' },
          },
        },
        orderBy: [{ isFeatured: 'desc' }, { viewCount: 'desc' }, { updatedAt: 'desc' }],
      }),
      prisma.software.count({
        where: {
          status: ResourceStatus.DRAFT,
          isTestData: false,
          type: ResourceType.GAME,
        },
      }),
      prisma.downloadEvent.groupBy({
        by: ['softwareId'],
        where: {
          isTestEvent: false,
          software: {
            status: ResourceStatus.PUBLISHED,
            isTestData: false,
            type: ResourceType.GAME,
          },
        },
        _count: { softwareId: true },
      }),
      prisma.channelRecommendation.findMany({
        where: { channel: 'GAMES', isActive: true },
        orderBy: [{ slot: 'asc' }, { sortOrder: 'asc' }],
      }),
      prisma.topic.findMany({
        where: {
          status: TopicStatus.PUBLISHED,
          NOT: { slug: { startsWith: 'topic-p3-' } },
        },
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { updatedAt: 'desc' }],
        include: {
          resources: {
            orderBy: { sortOrder: 'asc' },
            include: {
              software: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  status: true,
                  isTestData: true,
                  type: true,
                  coverUrl: true,
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
        orderBy: [{ publishedAt: 'desc' }, { viewCount: 'desc' }],
        include: {
          software: {
            select: {
              id: true,
              slug: true,
              name: true,
              type: true,
              status: true,
              isTestData: true,
            },
          },
        },
      }),
      prisma.software.findMany({
        where: {
          status: ResourceStatus.PUBLISHED,
          isTestData: false,
          type: { not: ResourceType.GAME },
          slug: { in: Object.keys(COMPANION_TOOL_ROLES) },
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          versions: {
            where: { isLatest: true },
            take: 1,
            include: {
              downloadSources: { where: { isActive: true } },
            },
          },
          licenses: { take: 1 },
        },
      }),
      prisma.downloadSource.count({
        where: {
          isActive: true,
          version: {
            software: {
              status: ResourceStatus.PUBLISHED,
              isTestData: false,
              type: ResourceType.GAME,
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
              type: ResourceType.GAME,
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
              type: ResourceType.GAME,
            },
          },
        },
      }),
    ]);

    const dlCountMap = new Map<string, number>();
    for (const g of dlGroups) {
      dlCountMap.set(g.softwareId, g._count.softwareId);
    }

    const allGames: GamePortalItemDto[] = gamesRaw.map((g) => enrichGameDto(g, dlCountMap));
    const gameById = new Map(allGames.map((g) => [g.id, g]));
    const activeRecs = recommendationsRaw.filter((rec) => isWithinSchedule(rec, now));

    // 1. 合法包含已发布游戏的专题（严格只统计已发布、非测试 GAME）
    const gameTopics = topicsRaw
      .map((t) => {
        const publishedGames = t.resources
          .map((r) => r.software)
          .filter(
            (s) =>
              s &&
              s.status === ResourceStatus.PUBLISHED &&
              !s.isTestData &&
              s.type === ResourceType.GAME
          );
        if (publishedGames.length === 0) return null;
        const hasUnpublishedMembers = publishedGames.length < t.resources.length;
        return {
          id: t.id,
          slug: t.slug,
          title: t.title,
          description: hasUnpublishedMembers
            ? `专题已公开发布 ${publishedGames.length} 款开源独立佳作（部分候选作品尚在合规审核队列，随发布自动扩展显示）。`
            : t.description,
          coverUrl: '/images/games/hero-indie-collection.svg',
          resourceCount: publishedGames.length,
          previewGames: publishedGames.slice(0, 3).map((g) => ({
            slug: g.slug,
            name: g.name,
            coverUrl:
              VERIFIED_GAME_ARTWORK[g.slug]?.coverUrl ||
              g.coverUrl ||
              '/images/games/hero-indie-collection.svg',
          })),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
    const topicById = new Map(gameTopics.map((t) => [t.id, t]));

    // 2. Hero Slides（优先读取后台配置，缺失则从已发布游戏 + 游戏专题自动生成高画质大图轮播）
    const configuredHeroRecs = activeRecs.filter((r) => r.slot === 'HERO').slice(0, 5);
    const heroSlides: HeroSlideDto[] = [];

    for (let i = 0; i < configuredHeroRecs.length; i++) {
      const rec = configuredHeroRecs[i];
      const theme = SLIDE_THEMES[i % SLIDE_THEMES.length];
      if (rec.targetType === 'SOFTWARE') {
        const game = gameById.get(rec.targetId);
        if (!game) continue;
        heroSlides.push({
          id: rec.id,
          title: rec.title || game.name,
          subtitle: conciseHeroText(rec.subtitle || game.summary, 66),
          badge: rec.badgeText || `${game.genreName} · 开源免费`,
          targetUrl: `/game/${game.slug}`,
          targetType: 'GAME',
          coverImage: rec.coverImage || game.heroImageUrl,
          theme,
          statsText: `${game.latestVersion || '官方发行'} · ${game.deliveryLabel}`,
          previewSoftwares: [
            {
              slug: game.slug,
              name: game.name,
              iconUrl: game.iconUrl,
              categorySlug: game.categorySlug,
              latestVersion: game.latestVersion,
            },
          ],
        });
      } else if (rec.targetType === 'TOPIC') {
        const topic = topicById.get(rec.targetId);
        if (!topic) continue;
        heroSlides.push({
          id: rec.id,
          title: rec.title || topic.title,
          subtitle: conciseHeroText(rec.subtitle || topic.description, 66),
          badge: rec.badgeText || '精选游戏专题',
          targetUrl: `/topics/${topic.slug}`,
          targetType: 'TOPIC',
          coverImage: rec.coverImage || topic.coverUrl || '/images/games/hero-indie-collection.svg',
          theme,
          statsText: `已收录 ${topic.resourceCount} 款已发布作品`,
          previewSoftwares: [],
        });
      }
    }

    if (heroSlides.length === 0) {
      allGames.slice(0, 3).forEach((game, idx) => {
        heroSlides.push({
          id: `auto-game-hero-${game.slug}`,
          title: game.name,
          subtitle: conciseHeroText(game.summary, 68),
          badge: `${game.genreName} · 开源合规`,
          targetUrl: `/game/${game.slug}`,
          targetType: 'GAME',
          coverImage: game.heroImageUrl,
          theme: SLIDE_THEMES[idx % SLIDE_THEMES.length],
          statsText: `${game.latestVersion ? `${game.latestVersion} · ` : ''}${game.platformsList.slice(0, 3).join(' / ')}`,
          previewSoftwares: [
            {
              slug: game.slug,
              name: game.name,
              iconUrl: game.iconUrl,
              categorySlug: game.categorySlug,
              latestVersion: game.latestVersion,
            },
          ],
        });
      });

      if (gameTopics.length > 0 && heroSlides.length < 4) {
        const t = gameTopics[0];
        heroSlides.push({
          id: `auto-topic-hero-${t.slug}`,
          title: t.title,
          subtitle: conciseHeroText(t.description, 68),
          badge: '游戏专题合集 · 零捆绑推荐',
          targetUrl: `/topics/${t.slug}`,
          targetType: 'TOPIC',
          coverImage: t.coverUrl || '/images/games/hero-indie-collection.svg',
          theme: 'indigo',
          statsText: `含 ${t.resourceCount} 款已发布开源精品`,
          previewSoftwares: [],
        });
      }
    }

    // 3. 精选主推（支持后台 WEEKLY_PICK / EDITOR_PICK + 智能补齐，按产品族去重）
    const curatedRecs = activeRecs.filter(
      (r) => (r.slot === 'WEEKLY_PICK' || r.slot === 'EDITOR_PICK') && r.targetType === 'SOFTWARE'
    );
    const spotlightPicked = pickChannelSoftwares({
      recs: curatedRecs,
      pool: allGames,
      swMap: gameById,
      limit: Math.min(4, allGames.length),
      maxPerFamily: 1,
    });
    const spotlightGames: GamePortalItemDto[] = spotlightPicked
      .map((item) => {
        const full = gameById.get(item.id);
        return full
          ? { ...full, badgeText: item.badgeText, editorialNote: item.editorialNote }
          : null;
      })
      .filter((x): x is GamePortalItemDto => Boolean(x));

    // 4. 真实品类聚合（空品类自动折叠，绝不造空列表）
    const genreBlocksRaw: GameGenreBlockDto[] = GAME_GENRE_DEFS.map((def) => {
      const matched = allGames.filter((g) => g.genreSlug === def.slug);
      return {
        slug: def.slug,
        name: def.name,
        badge: def.badge,
        description: def.description,
        totalCount: matched.length,
        games: matched,
      };
    });
    const genreBlocks = genreBlocksRaw.filter((b) => b.totalCount > 0);
    const upcomingGenreLabels = genreBlocksRaw.filter((b) => b.totalCount === 0).map((b) => b.name);

    const quickFilters = [
      { slug: 'all', name: '全部游戏', count: allGames.length },
      ...genreBlocks.map((b) => ({ slug: b.slug, name: b.name, count: b.totalCount })),
    ];

    // 5. 游戏配套实用工具（与游戏本体严格区分）
    const companionTools: GameCompanionToolDto[] = companionToolsRaw.map((tool) => ({
      ...toCompactSoftware(tool, dlCountMap),
      roleLabel: COMPANION_TOOL_ROLES[tool.slug] || '游戏影音与系统配套工具',
      isCompanionTool: true,
    }));

    // 6. 游戏实操与录屏攻略（严格排除关联 DRAFT 游戏的文章，防泄露未上线页）
    const guides = tutorialsRaw
      .filter((t) => {
        if (INTERNAL_POLICY_TUTORIAL_SLUGS.has(t.slug)) return false;
        if (t.software) {
          if (t.software.status !== ResourceStatus.PUBLISHED || t.software.isTestData) {
            return false;
          }
          if (t.software.type === ResourceType.GAME) return true;
        }
        return GAME_GUIDE_ALLOWED_SLUGS.has(t.slug);
      })
      .slice(0, 4)
      .map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        summary: t.summary,
        viewCount: t.viewCount,
        publishedAt: (t.publishedAt || t.createdAt).toISOString().slice(0, 10),
        relatedSlug: t.software ? t.software.slug : null,
        relatedName: t.software ? t.software.name : null,
        guideScopeLabel:
          t.software?.type === ResourceType.GAME
            ? '游戏攻略'
            : t.slug === 'obs-studio-game-recording-settings'
              ? '游戏录屏调优'
              : '安全校验通用',
      }));

    // 7. 诚实排行榜（严格不填充 0 访问与非游戏软件）
    const sampleThreshold = 5;
    const popularTop = [...allGames]
      .filter((g) => g.viewCount > 0)
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10)
      .map((software, idx) => ({ rank: idx + 1, software }));

    const downloadsTop = [...allGames]
      .filter((g) => g.downloadCount > 0)
      .sort((a, b) => b.downloadCount - a.downloadCount)
      .slice(0, 10)
      .map((software, idx) => ({ rank: idx + 1, software }));

    // 8. 最近版本更新与近期收录（严格区分 updatedAt 与 publishedAt）
    const versionUpdates = [...allGames]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 6);
    const newlyCataloged = [...allGames]
      .sort((a, b) => (b.publishedAt || b.catalogedAt).localeCompare(a.publishedAt || a.catalogedAt))
      .slice(0, 6);

    const openSourceGamesCount = allGames.filter(
      (g) =>
        g.priceType === 'OPEN_SOURCE' ||
        /open|gpl|mit|apache|lgpl/i.test(g.licenseType || '')
    ).length;

    const directDownloadGamesCount = allGames.filter((g) => g.deliveryType === 'DIRECT_INSTALLER').length;
    const officialPageGamesCount = allGames.filter(
      (g) => g.deliveryType === 'OFFICIAL_DOWNLOAD_PAGE' || g.deliveryType === 'OFFICIAL_WEBSITE'
    ).length;
    const storeLinkedGamesCount = allGames.filter((g) =>
      g.distributionChannels.some((c) => /steam|gog|itch|epic/i.test(c))
    ).length;

    return {
      channel: 'GAMES',
      meta: {
        totalGamesCount: allGames.length,
        openSourceGamesCount,
        registeredSourcesCount,
        approvedHealthySourcesCount,
        verifiedSha256Count,
        directDownloadGamesCount,
        officialPageGamesCount,
        storeLinkedGamesCount,
        companionToolsCount: companionTools.length,
        topicsCount: gameTopics.length,
        guidesCount: guides.length,
        draftQueueCount: draftCount,
        sampleNote: `当前正式库收录 ${allGames.length} 款已发布游戏（另有 ${draftCount} 款正版开源候选尚在草稿审校中，不混入前台显示）；辅助工具单列展示且不计入游戏数量。`,
        redistributionNotice:
          '软游部落严守软件与游戏版权规范：仅收录 GPL/MIT 等开源自由许可或官方明确授权直链渠道的游戏与商店发布页指引，坚决不提供盗版镜像、破解补丁或作弊外挂工具。',
        generatedAt: now.toISOString(),
      },
      heroSlides: heroSlides.slice(0, 5),
      quickFilters,
      spotlightGames,
      genreBlocks,
      upcomingGenreLabels,
      companionTools,
      hotTopics: gameTopics,
      guides,
      leaderboards: {
        sampleThreshold,
        popularTop,
        downloadsTop,
      },
      latestUpdates: {
        versionUpdates,
        newlyCataloged,
      },
      distributionStandards: [
        {
          title: '开源免费 · 可溯源源码与许可',
          badge: 'GPL / MIT / LGPL',
          description: '遵守开源许可证条款分发或引导至 GitHub Releases 与开发团队官方主页。',
          tone: 'emerald',
        },
        {
          title: '官方页面与正规数字商店分流',
          badge: 'Steam / Itch.io / 官网',
          description: '明确标注外部下载页与正版商店入口，如实提示当前文件哈希核验状态，绝不伪造安全印章。',
          tone: 'blue',
        },
        {
          title: '零盗版破解 · 零捆绑诱导',
          badge: '合规底线',
          description: '严禁提供修改器、破解补丁、私服外挂与任何携带广告弹窗的第三方重打包端。',
          tone: 'amber',
        },
      ],
    };
  }
}
