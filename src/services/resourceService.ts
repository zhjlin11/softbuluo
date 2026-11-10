/**
 * 软游部落核心资源服务层 (Service Layer)
 * 统一连接真实 REST API，处理数据映射、异常状态兜底与防刷打点。
 */

import {
  Category,
  SoftwareItem,
  GameItem,
  TutorialItem,
  SearchResult,
} from '../types/resource';

const API_BASE = '/api/v1';

// 允许在演示或测试环境中切换空状态
let simulateEmptyDb = false;
export const setSimulateEmptyDatabase = (val: boolean) => {
  simulateEmptyDb = val;
};
export const getSimulateEmptyDatabase = () => simulateEmptyDb;

/**
 * 首页聚合数据结构
 */
export interface HomeDataResult {
  categories: Category[];
  featured: SoftwareItem[];
  popular: SoftwareItem[];
  latest: SoftwareItem[];
  repairTools: SoftwareItem[];
  games: GameItem[];
  tutorials: TutorialItem[];
}

/**
 * 获取首页所有核心板块数据（一次请求聚合）
 */
export async function getHomeData(): Promise<HomeDataResult> {
  if (simulateEmptyDb) {
    return {
      categories: [],
      featured: [],
      popular: [],
      latest: [],
      repairTools: [],
      games: [],
      tutorials: []
    };
  }

  const res = await fetch(`${API_BASE}/home`, {
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`获取首页数据异常 HTTP ${res.status}`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || '获取首页数据失败');
  }

  return json.data;
}

/**
 * 单个资源独立详情获取 (按 Slug)
 */
export async function getResourceDetail(slug: string): Promise<{ resource: SoftwareItem & { historyVersions?: any[]; viewCount?: number }; related: SoftwareItem[] }> {
  const res = await fetch(`${API_BASE}/resources/${encodeURIComponent(slug)}`);
  if (!res.ok) {
    throw new Error(res.status === 404 ? '资源不存在' : `请求失败 HTTP ${res.status}`);
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || '读取资源详情失败');
  }
  return json.data;
}

/**
 * 软件资源多维搜索
 */
export async function searchResources(
  rawQuery: string,
  options?: {
    categorySlug?: string;
    limit?: number;
    type?: string;
  }
): Promise<SearchResult> {
  const query = (rawQuery || '').trim();
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (options?.categorySlug && options.categorySlug !== 'all') {
    params.set('categorySlug', options.categorySlug);
  }
  if (options?.type) params.set('type', options.type);
  if (options?.limit) params.set('limit', options.limit.toString());

  const res = await fetch(`${API_BASE}/search?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`搜索请求失败 HTTP ${res.status}`);
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || '搜索处理异常');
  }

  return json.data;
}

/**
 * 实时搜索建议
 */
export async function getSearchSuggestions(query: string): Promise<SoftwareItem[]> {
  if (!query || query.trim().length < 2) return [];

  const res = await fetch(`${API_BASE}/search/suggestions?q=${encodeURIComponent(query.trim())}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.success ? json.data : [];
}

/**
 * P8.7 公开列表与栏目专用数据获取接口
 */
export async function getResourcesList(params?: {
  type?: string;
  categorySlug?: string;
  search?: string;
  sort?: string;
  platform?: string;
  license?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: SoftwareItem[]; total: number; limit: number; offset: number }> {
  const q = new URLSearchParams();
  if (params?.type) q.set('type', params.type);
  if (params?.categorySlug && params.categorySlug !== 'all') q.set('categorySlug', params.categorySlug);
  if (params?.search) q.set('search', params.search);
  if (params?.sort) q.set('sort', params.sort);
  if (params?.platform && params.platform !== 'all') q.set('platform', params.platform);
  if (params?.license && params.license !== 'all') q.set('license', params.license);
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.offset !== undefined) q.set('offset', String(params.offset));

  const res = await fetch(`${API_BASE}/resources?${q.toString()}`);
  if (!res.ok) throw new Error(`获取资源列表失败 HTTP ${res.status}`);
  const json = await res.json();
  return json.data || { items: [], total: 0, limit: 20, offset: 0 };
}

export async function getCategoriesList(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function getTopicsList(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/topics`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function getTutorialsList(params?: { softwareId?: string; page?: number; limit?: number }): Promise<{ items: any[]; total: number; totalPages: number }> {
  const q = new URLSearchParams();
  if (params?.softwareId) q.set('softwareId', params.softwareId);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));

  const res = await fetch(`${API_BASE}/tutorials?${q.toString()}`);
  if (!res.ok) return { items: [], total: 0, totalPages: 0 };
  const json = await res.json();
  return {
    items: json.data || [],
    total: json.pagination?.total || 0,
    totalPages: json.pagination?.totalPages || 0,
  };
}

export async function getTutorialBySlug(slug: string): Promise<any> {
  const res = await fetch(`${API_BASE}/tutorials/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error(res.status === 404 ? '教程不存在' : '加载教程失败');
  const json = await res.json();
  return json.data;
}

export async function getVersionUpdatesList(params?: { limit?: number; offset?: number; platform?: string }): Promise<{ items: any[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.offset !== undefined) q.set('offset', String(params.offset));
  if (params?.platform && params.platform !== 'all') q.set('platform', params.platform);

  const res = await fetch(`${API_BASE}/versions/feed?${q.toString()}`);
  if (!res.ok) return { items: [], total: 0 };
  const json = await res.json();
  return json.data || { items: [], total: 0 };
}

/**
 * 记录下载事件打点
 */
export async function recordDownloadClick(
  softwareId: string,
  sourceId: string,
  eventType: 'OFFICIAL_LINK_CLICK' | 'HOSTED_DOWNLOAD_AUTHORIZED' = 'OFFICIAL_LINK_CLICK'
): Promise<void> {
  try {
    await fetch(`${API_BASE}/downloads/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        softwareId,
        sourceId,
        eventType,
      }),
    });
  } catch (err) {
    console.warn('下载打点上报失败 (不影响正常跳转):', err);
  }
}

/**
 * =====================================
 * 后台管理 API 封装
 * =====================================
 */

export async function adminLogin(identifier: string, password: string) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  return res.json();
}

export async function adminGetMe() {
  const res = await fetch(`${API_BASE}/admin/me`);
  return res.json();
}

export async function adminLogout() {
  try {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'PURGE_USER_DATA' });
    }
  } catch {}
  const res = await fetch(`${API_BASE}/admin/logout`, { method: 'POST' });
  return res.json();
}

export async function adminGetStatistics() {
  const res = await fetch(`${API_BASE}/admin/statistics`);
  return res.json();
}

export async function adminGetResources(params: Record<string, string | number>) {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') query.set(k, String(v));
  }
  const res = await fetch(`${API_BASE}/admin/resources?${query.toString()}`);
  return res.json();
}

export async function adminCreateResource(payload: any) {
  const res = await fetch(`${API_BASE}/admin/resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function adminSubmitResource(id: string) {
  const res = await fetch(`${API_BASE}/admin/resources/${id}/submit`, { method: 'POST' });
  return res.json();
}

export async function adminApproveResource(id: string) {
  const res = await fetch(`${API_BASE}/admin/resources/${id}/approve`, { method: 'POST' });
  return res.json();
}

export async function adminRejectResource(id: string, reason?: string) {
  const res = await fetch(`${API_BASE}/admin/resources/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  return res.json();
}

export async function adminArchiveResource(id: string) {
  const res = await fetch(`${API_BASE}/admin/resources/${id}/archive`, { method: 'POST' });
  return res.json();
}

export async function adminToggleTestData(id: string) {
  const res = await fetch(`${API_BASE}/admin/resources/${id}/toggle-test-data`, { method: 'PATCH' });
  return res.json();
}

export async function adminGetDownloadSources() {
  const res = await fetch(`${API_BASE}/admin/download-sources`);
  return res.json();
}

export async function adminCheckDownloadSource(url: string, sourceId?: string) {
  const res = await fetch(`${API_BASE}/admin/download-sources/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, sourceId }),
  });
  return res.json();
}

export async function adminGetCategories() {
  const res = await fetch(`${API_BASE}/categories`);
  return res.json();
}

/**
 * P6-A 增强：审核工作台与证据 API
 */
export async function adminGetNextPendingResource() {
  const res = await fetch(`${API_BASE}/admin/resources/review/next-pending`);
  return res.json();
}

export async function adminGetResourceEvidences(id: string) {
  const res = await fetch(`${API_BASE}/admin/resources/${id}/evidences`);
  return res.json();
}

export async function adminAddResourceEvidence(id: string, data: any) {
  const res = await fetch(`${API_BASE}/admin/resources/${id}/evidences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function adminNeedsCorrection(id: string, notes: string) {
  const res = await fetch(`${API_BASE}/admin/resources/${id}/needs-correction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
  return res.json();
}

