const API_BASE = '/api/v1';

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
  type: string;
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
  type: string;
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

export interface SoftwareVersionHistoryItem {
  id: string;
  version: string;
  releaseDate: string;
  platform: string;
  architecture: string;
  fileSize: string;
  changelog: string | null;
  hasChangelog: boolean;
  isLatest: boolean;
  downloadSources: Array<{
    id: string;
    sourceType: string;
    sourceName: string;
    url: string;
  }>;
}

export interface SoftwareVersionHistoryData {
  software: {
    id: string;
    name: string;
    slug: string;
    iconUrl: string | null;
    developer: string;
    summary: string;
    dataIntegrityStatus: string;
    officialDomainVerified: boolean;
  };
  versions: SoftwareVersionHistoryItem[];
}

export async function fetchUpdatesChannelData(params: UpdatesQueryParams = {}): Promise<UpdatesChannelData> {
  const query = new URLSearchParams();
  if (params.timeRange && params.timeRange !== 'all') query.set('timeRange', params.timeRange);
  if (params.resourceType && params.resourceType !== 'ALL') query.set('resourceType', params.resourceType);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.sort) query.set('sort', params.sort);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  const qs = query.toString();
  const res = await fetch(`${API_BASE}/channels/updates${qs ? `?${qs}` : ''}`);
  if (!res.ok) {
    throw new Error(`加载更新频道数据失败 (HTTP ${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

export async function fetchSoftwareVersionHistory(softwareIdOrSlug: string): Promise<SoftwareVersionHistoryData> {
  const res = await fetch(`${API_BASE}/channels/updates/version-history/${encodeURIComponent(softwareIdOrSlug)}`);
  if (!res.ok) {
    throw new Error(`加载软件历史版本失败 (HTTP ${res.status})`);
  }
  const json = await res.json();
  return json.data;
}
