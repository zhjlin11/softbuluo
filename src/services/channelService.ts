import { SoftwareItem } from '../types/resource';

export interface ChannelSoftwareItem {
  id: string;
  slug: string;
  name: string;
  englishName: string | null;
  summary: string;
  iconUrl: string | null;
  type: 'SOFTWARE' | 'TOOL' | 'GAME';
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
  registeredSourcesCount?: number;
  badgeText?: string | null;
  editorialNote?: string | null;
}

export interface HeroSlideItem {
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

export interface ChannelCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  count: number;
  representativeSoftwares: Array<{
    id: string;
    slug: string;
    name: string;
    iconUrl: string | null;
    categorySlug: string;
  }>;
}

export interface ChannelTopicItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverUrl: string | null;
  isFeatured: boolean;
  publishedAt: string;
  resourceCount: number;
  previewSoftwares: Array<{
    slug: string;
    name: string;
    iconUrl: string | null;
    categorySlug: string;
  }>;
}

export interface ChannelTutorialItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  viewCount: number;
  publishedAt: string;
  software: {
    slug: string;
    name: string;
    iconUrl: string | null;
  } | null;
}

export interface ChannelComparisonItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  updatedAt: string;
  softwares: Array<{
    slug: string;
    name: string;
    iconUrl: string | null;
  }>;
}

export interface SoftwareChannelData {
  meta: {
    channel: string;
    totalSoftwareCount: number;
    verifiedSourcesCount: number;
    registeredSourcesCount?: number;
    approvedHealthySourcesCount?: number;
    pendingSourcesCount?: number;
    sha256VerifiedCount?: number;
    topicsCount: number;
    tutorialsCount: number;
    comparisonsCount: number;
    totalDownloadEvents: number;
    viewStatsLabel: string;
    downloadStatsLabel: string;
  };
  categories: ChannelCategoryItem[];
  heroSlides: HeroSlideItem[];
  weeklyPicks: ChannelSoftwareItem[];
  editorPicks: ChannelSoftwareItem[];
  leaderboards: {
    mostViewed: ChannelSoftwareItem[];
    mostDownloaded: ChannelSoftwareItem[];
  };
  hotTopics: ChannelTopicItem[];
  categoryBlocks: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    totalCount: number;
    softwares: ChannelSoftwareItem[];
  }>;
  tutorials: ChannelTutorialItem[];
  comparisons: ChannelComparisonItem[];
  latestUpdates: {
    versionUpdates: ChannelSoftwareItem[];
    newlyCataloged: ChannelSoftwareItem[];
  };
}

export interface SystemToolChannelItem extends ChannelSoftwareItem {
  domainSlug: string;
  domainName: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  requireBackup: boolean;
  requireAdmin: boolean;
  riskNotice: string | null;
  verifiedSha256Count: number;
}

export interface ToolScenarioItem {
  id: string;
  title: string;
  shortLabel: string;
  summary: string;
  badge: string;
  accentTone: 'amber' | 'rose' | 'blue' | 'indigo' | 'emerald' | 'slate';
  safetyWarning: string;
  steps: string[];
  recommendedDomainSlug: string;
  tools: SystemToolChannelItem[];
  tutorials: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    publishedAt: string;
    requireBackup: boolean;
  }>;
  relatedTopic: {
    slug: string;
    title: string;
    resourceCount: number;
  } | null;
}

export interface SystemToolDomainBlock {
  slug: string;
  name: string;
  description: string;
  filterCategorySlug: string;
  safetyNote: string;
  totalCount: number;
  tools: SystemToolChannelItem[];
  relatedTopic: {
    slug: string;
    title: string;
  } | null;
}

export interface SystemToolsChannelData {
  meta: {
    channel: string;
    totalToolsCount: number;
    utilityToolsCount: number;
    highRiskToolsCount: number;
    registeredSourcesCount: number;
    approvedHealthySourcesCount: number;
    pendingSourcesCount: number;
    sha256VerifiedCount: number;
    topicsCount: number;
    tutorialsCount: number;
    totalDownloadEvents: number;
    viewStatsLabel: string;
    downloadStatsLabel: string;
  };
  heroSlides: HeroSlideItem[];
  commonTools: SystemToolChannelItem[];
  scenarios: ToolScenarioItem[];
  domainBlocks: SystemToolDomainBlock[];
  editorPicks: SystemToolChannelItem[];
  leaderboards: {
    mostViewed: SystemToolChannelItem[];
    mostDownloaded: SystemToolChannelItem[];
  };
  hotTopics: ChannelTopicItem[];
  tutorials: Array<
    ChannelTutorialItem & {
      requireBackup?: boolean;
      requireAdmin?: boolean;
    }
  >;
  comparisons: ChannelComparisonItem[];
  latestUpdates: {
    versionUpdates: SystemToolChannelItem[];
    newlyCataloged: SystemToolChannelItem[];
  };
}

export type GameSourceDeliveryType =
  | 'DIRECT_INSTALLER'
  | 'OFFICIAL_DOWNLOAD_PAGE'
  | 'STORE_PAGE'
  | 'OFFICIAL_WEBSITE';

export interface GamePortalItem extends ChannelSoftwareItem {
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

export interface GameGenreBlockItem {
  slug: string;
  name: string;
  badge: string;
  description: string;
  totalCount: number;
  games: GamePortalItem[];
}

export interface GameCompanionToolItem extends ChannelSoftwareItem {
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
  heroSlides: HeroSlideItem[];
  quickFilters: Array<{
    slug: string;
    name: string;
    count: number;
  }>;
  spotlightGames: GamePortalItem[];
  genreBlocks: GameGenreBlockItem[];
  upcomingGenreLabels: string[];
  companionTools: GameCompanionToolItem[];
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
    popularTop: Array<{ rank: number; software: GamePortalItem }>;
    downloadsTop: Array<{ rank: number; software: GamePortalItem }>;
  };
  latestUpdates: {
    versionUpdates: GamePortalItem[];
    newlyCataloged: GamePortalItem[];
  };
  distributionStandards: Array<{
    title: string;
    badge: string;
    description: string;
    tone: 'emerald' | 'blue' | 'amber';
  }>;
}

export interface EssentialsPlanSoftwareItem extends ChannelSoftwareItem {
  groupName: string;
  installOrder: number;
  rolePurpose: string;
  installTip: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  requireBackup: boolean;
  riskNotice: string | null;
}

export interface EssentialsSetupPlanItem {
  id: string;
  title: string;
  shortName: string;
  tagline: string;
  targetUsers: string;
  accentTone: 'blue' | 'emerald' | 'indigo' | 'violet' | 'sky' | 'amber';
  illustrationType: 'office' | 'gaming' | 'creative' | 'developer' | 'student' | 'repair';
  installAdvice: string;
  driverAdvice: string;
  recommendedCount: number;
  groups: string[];
  items: EssentialsPlanSoftwareItem[];
  externalChannelHints: Array<{
    title: string;
    channelLabel: string;
    description: string;
    url?: string;
    internalRoute?: string;
  }>;
}

export interface EssentialsInstallStepItem {
  step: number;
  id: string;
  title: string;
  shortLabel: string;
  summary: string;
  checklist: string[];
  complianceWarning: string | null;
  isHighRisk: boolean;
  relatedSoftwares: Array<{ slug: string; name: string }>;
  relatedTutorials: Array<{ slug: string; title: string }>;
}

export interface EssentialsToolboxGroupItem {
  id: string;
  title: string;
  description: string;
  isHighRisk: boolean;
  safetyNotice: string;
  tools: Array<
    ChannelSoftwareItem & {
      riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
      requireBackup: boolean;
      requireAdmin: boolean;
      riskNotice: string | null;
    }
  >;
}

export interface EssentialsCategoryShelfItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  totalCount: number;
  softwares: ChannelSoftwareItem[];
}

export interface EssentialsChannelData {
  channel: 'ESSENTIALS';
  meta: {
    totalPublishedSoftwareCount: number;
    totalDesktopCount: number;
    totalToolsCount: number;
    registeredSourcesCount: number;
    approvedHealthySourcesCount: number;
    pendingSourcesCount: number;
    sha256VerifiedCount: number;
    topicsCount: number;
    tutorialsCount: number;
    totalDownloadEvents: number;
    draftQueueCount: number;
    viewStatsLabel: string;
    downloadStatsLabel: string;
    checklistSecurityNotice: string;
    generatedAt: string;
  };
  stageNav: Array<{ id: string; label: string }>;
  heroSlides: HeroSlideItem[];
  quickTools: ChannelSoftwareItem[];
  setupPlans: EssentialsSetupPlanItem[];
  installWorkflow: EssentialsInstallStepItem[];
  toolboxGroups: EssentialsToolboxGroupItem[];
  categoryShelves: EssentialsCategoryShelfItem[];
  editorPicks: ChannelSoftwareItem[];
  leaderboards: {
    mostViewed: ChannelSoftwareItem[];
    mostDownloaded: ChannelSoftwareItem[];
  };
  hotTopics: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    coverUrl: string;
    isFeatured: boolean;
    publishedAt: string;
    resourceCount: number;
    previewSoftwares: Array<{
      slug: string;
      name: string;
      iconUrl: string | null;
      categorySlug: string;
    }>;
  }>;
  tutorials: Array<ChannelTutorialItem & { isHighRisk?: boolean }>;
  comparisons: ChannelComparisonItem[];
  latestUpdates: {
    versionUpdates: ChannelSoftwareItem[];
    newlyCataloged: ChannelSoftwareItem[];
  };
}

export interface ChannelRecommendationRecord {
  id: string;
  channel: string;
  slot: 'HERO' | 'WEEKLY_PICK' | 'EDITOR_PICK' | 'TOPIC_PICK' | 'CATEGORY_PICK';
  targetType: 'SOFTWARE' | 'TOPIC' | 'COMPARISON' | 'TUTORIAL' | 'CATEGORY';
  targetId: string;
  title: string | null;
  subtitle: string | null;
  badgeText: string | null;
  coverImage: string | null;
  sortOrder: number;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
  targetValid?: boolean;
  targetInvalidReason?: string | null;
  targetLabel?: string;
}

export async function getSoftwareChannelPortal(): Promise<SoftwareChannelData> {
  const res = await fetch('/api/v1/channels/software');
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || '电脑软件频道数据加载失败');
  }
  return json.data;
}

export async function getSystemToolsChannelPortal(): Promise<SystemToolsChannelData> {
  const res = await fetch('/api/v1/channels/system-tools');
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || '系统工具频道数据加载失败');
  }
  return json.data;
}

export async function getGamesChannelPortal(): Promise<GamesChannelData> {
  const res = await fetch('/api/v1/channels/games');
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || '游戏中心频道数据加载失败');
  }
  return json.data;
}

export async function getEssentialsChannelPortal(): Promise<EssentialsChannelData> {
  const res = await fetch('/api/v1/channels/essentials');
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || '装机必备频道数据加载失败');
  }
  return json.data;
}

interface FilteredResourcesQuery {
  categorySlug?: string;
  genre?: string;
  search?: string;
  sort?: string;
  platform?: string;
  license?: string;
  limit?: number;
  offset?: number;
}

async function fetchResourcesByChannelType(
  type: 'DESKTOP' | 'TOOL' | 'GAME',
  params?: FilteredResourcesQuery
): Promise<{ items: SoftwareItem[]; total: number; limit: number; offset: number }> {
  const query = new URLSearchParams();
  query.set('type', type);
  if (params?.categorySlug && params.categorySlug !== 'all') query.set('categorySlug', params.categorySlug);
  if (params?.genre && params.genre !== 'all') query.set('genre', params.genre);
  if (params?.search) query.set('search', params.search);
  if (params?.sort) query.set('sort', params.sort);
  if (params?.platform && params.platform !== 'all') query.set('platform', params.platform);
  if (params?.license && params.license !== 'all') query.set('license', params.license);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset !== undefined) query.set('offset', String(params.offset));

  const res = await fetch(`/api/v1/resources?${query.toString()}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || '获取资源列表失败');
  }
  return json.data;
}

export async function getDesktopResourcesList(params?: FilteredResourcesQuery) {
  return fetchResourcesByChannelType('DESKTOP', params);
}

export async function getSystemToolsResourcesList(params?: FilteredResourcesQuery) {
  return fetchResourcesByChannelType('TOOL', params);
}

export async function getGamesResourcesList(params?: FilteredResourcesQuery) {
  return fetchResourcesByChannelType('GAME', params);
}

async function adminChannelFetch<T>(url: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; message?: string }> {
  try {
    const res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, message: json.error?.message || json.message || `请求失败 (${res.status})` };
    }
    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, message: err.message || '网络异常' };
  }
}

export async function adminGetChannelRecommendations(channel = 'SOFTWARE') {
  return adminChannelFetch<{ items: ChannelRecommendationRecord[] }>(`/api/v1/admin/channels/${channel}/recommendations`);
}

export async function adminGetChannelCandidates(channel = 'SOFTWARE') {
  return adminChannelFetch<{
    softwares: Array<{ id: string; name: string; slug: string; category?: { name: string } }>;
    topics: Array<{ id: string; title: string; slug: string }>;
    comparisons: Array<{ id: string; title: string; slug: string }>;
    tutorials: Array<{ id: string; title: string; slug: string }>;
  }>(`/api/v1/admin/channels/${channel}/candidates`);
}

export async function adminUpsertChannelRecommendation(
  channel: string,
  payload: {
    slot: string;
    targetType: string;
    targetId: string;
    title?: string | null;
    subtitle?: string | null;
    badgeText?: string | null;
    coverImage?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    startAt?: string | null;
    endAt?: string | null;
  }
) {
  return adminChannelFetch<ChannelRecommendationRecord>(`/api/v1/admin/channels/${channel}/recommendations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function adminUpdateChannelRecommendation(channel: string, id: string, payload: Record<string, any>) {
  return adminChannelFetch<ChannelRecommendationRecord>(`/api/v1/admin/channels/${channel}/recommendations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function adminDeleteChannelRecommendation(channel: string, id: string) {
  return adminChannelFetch<{ deletedId: string }>(`/api/v1/admin/channels/${channel}/recommendations/${id}`, {
    method: 'DELETE',
  });
}
