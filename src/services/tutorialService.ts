const API_BASE = '/api/v1';

export type TutorialDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type TutorialRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TutorialCategoryMeta {
  id: string;
  name: string;
  description: string;
  count: number;
}

export interface EnrichedTutorialDto {
  id: string;
  title: string;
  slug: string;
  summary: string;
  coverUrl: string | null;
  status: string;
  viewCount: number;
  publishedAt: string | null;
  updatedAt: string;
  category: string;
  categoryName: string;
  difficulty: TutorialDifficulty;
  difficultyLabel: string;
  platform: string;
  riskLevel: TutorialRiskLevel;
  isHighRisk: boolean;
  tags: string[];
  readingMinutes: number;
  preflightChecklist: string[];
  software: {
    id: string;
    name: string;
    slug: string;
    iconUrl: string | null;
    developer: string | null;
    category?: string | null;
    currentVersion?: string | null;
  } | null;
}

export interface QuickTroubleshootEntry {
  id: string;
  problem: string;
  description: string;
  slug: string;
  category: string;
  badge: string;
}

export interface TutorialHeading {
  id: string;
  level: 2 | 3;
  text: string;
}

export interface TutorialChannelData {
  hero: EnrichedTutorialDto;
  quickTroubleshooting: QuickTroubleshootEntry[];
  categories: TutorialCategoryMeta[];
  items: EnrichedTutorialDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalTutorials: number;
    totalCategories: number;
    totalViews: number;
    verifiedGuidesCount: number;
  };
}

export interface TutorialDetailData extends EnrichedTutorialDto {
  content: string;
  seoTitle?: string | null;
  seoKeywords?: string | null;
  seoDescription?: string | null;
  headings: TutorialHeading[];
  software: {
    id: string;
    name: string;
    slug: string;
    iconUrl: string | null;
    developer: string | null;
    summary?: string | null;
    category?: string | null;
    latestVersion?: string | null;
    downloadSources?: Array<{
      id: string;
      sourceName: string;
      sourceType: string;
      url: string;
      platform: string;
      verificationStatus: string;
      sha256?: string | null;
    }>;
  } | null;
  relatedTutorials: Array<{
    id: string;
    title: string;
    slug: string;
    summary: string;
    coverUrl: string | null;
    publishedAt: string | null;
    categoryName: string;
    difficultyLabel: string;
  }>;
  prevTutorial: { slug: string; title: string } | null;
  nextTutorial: { slug: string; title: string } | null;
}

export async function fetchTutorialsChannel(params?: {
  category?: string;
  difficulty?: string;
  platform?: string;
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<TutorialChannelData> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== 'all') query.set('category', params.category);
  if (params?.difficulty && params.difficulty !== 'ALL') query.set('difficulty', params.difficulty);
  if (params?.platform && params.platform !== 'ALL') query.set('platform', params.platform);
  if (params?.q) query.set('q', params.q.trim());
  if (params?.sort) query.set('sort', params.sort);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const url = `${API_BASE}/channels/tutorials${qs ? `?${qs}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`获取教程频道数据失败 (HTTP ${res.status})`);
  }
  const json = await res.json();
  if (json.success && json.data) {
    return json.data;
  }
  throw new Error(json.error?.message || '获取教程频道数据失败');
}

export async function fetchTutorialDetail(slug: string): Promise<TutorialDetailData> {
  const res = await fetch(`${API_BASE}/channels/tutorials/${encodeURIComponent(slug)}`);
  if (!res.ok) {
    throw new Error(`获取教程详情失败 (HTTP ${res.status})`);
  }
  const json = await res.json();
  if (json.success && json.data) {
    return json.data;
  }
  throw new Error(json.error?.message || '获取教程详情失败');
}
