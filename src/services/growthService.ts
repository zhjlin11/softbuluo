// 软游部落 P4 阶段增长服务客户端 SDK (SEO, 对比, 评价, AI, 数据分析)

export interface ComparisonItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  conclusion: string;
  targetAudience?: string;
  scenarioGuide?: string;
  viewCount: number;
  publishedAt?: string;
  updatedAt: string;
  items: Array<{
    id: string;
    softwareId: string;
    editorNotes?: string;
    isRecommended: boolean;
    sortOrder: number;
    software: {
      id: string;
      name: string;
      slug: string;
      iconUrl: string;
      developer?: string;
      licenseType?: string;
    };
  }>;
  attributes?: Array<{
    id: string;
    attributeName: string;
    category: string;
    values: Record<string, string>;
    isHighlighted: boolean;
    sortOrder: number;
    evidenceStatus?: 'MEASURED' | 'OFFICIAL_DOCUMENTATION' | 'EDITORIAL_JUDGMENT' | 'UNVERIFIED';
    sourceUrl?: string;
    testEnvironment?: string;
    measuredAt?: string;
    reviewedAt?: string;
  }>;
}

export interface SoftwareAlternativeItem {
  id: string;
  reason: string;
  relationType: 'FREE_ALTERNATIVE' | 'OPEN_SOURCE_ALTERNATIVE' | 'CROSS_PLATFORM' | 'SIMILAR_FUNCTION' | 'LIGHTWEIGHT_OPTION';
  createdAt: string;
  alternative: {
    id: string;
    name: string;
    slug: string;
    iconUrl: string;
    summary: string;
    licenseType?: string;
    category?: { id: string; name: string; slug: string };
    latestVersion?: string | null;
  };
}

export interface SoftwareReviewItem {
  id: string;
  rating: number;
  title: string;
  content: string;
  versionUsed?: string;
  operatingSystem?: string;
  helpfulCount: number;
  unhelpfulCount: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number | null;
  distribution: Record<number, number>;
}

export const GrowthService = {
  // --- 1. 横向对比 ---
  async getComparisonList(page = 1, pageSize = 12) {
    const res = await fetch(`/api/v1/comparisons?page=${page}&pageSize=${pageSize}`);
    return await res.json();
  },

  async getComparisonDetail(slug: string) {
    const res = await fetch(`/api/v1/comparisons/${slug}`);
    return await res.json();
  },

  async adminGetComparisons(page = 1, pageSize = 20, status?: string) {
    const url = `/api/v1/admin/comparisons?page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ''}`;
    const res = await fetch(url);
    return await res.json();
  },

  async adminGetComparison(id: string) {
    const res = await fetch(`/api/v1/admin/comparisons/${id}`);
    return await res.json();
  },

  async adminCreateComparison(data: any) {
    const res = await fetch('/api/v1/admin/comparisons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async adminUpdateComparison(id: string, data: any) {
    const res = await fetch(`/api/v1/admin/comparisons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async adminDeleteComparison(id: string) {
    const res = await fetch(`/api/v1/admin/comparisons/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  },

  // --- 2. 软件替代品 ---
  async getSoftwareAlternatives(slug: string): Promise<{ success: boolean; data: SoftwareAlternativeItem[] }> {
    const res = await fetch(`/api/v1/software/${slug}/alternatives`);
    return await res.json();
  },

  async adminGetAlternatives(page = 1, pageSize = 20, status?: string) {
    const url = `/api/v1/admin/alternatives?page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ''}`;
    const res = await fetch(url);
    return await res.json();
  },

  async adminCreateAlternative(data: any) {
    const res = await fetch('/api/v1/admin/alternatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async adminUpdateAlternative(id: string, data: any) {
    const res = await fetch(`/api/v1/admin/alternatives/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async adminDeleteAlternative(id: string) {
    const res = await fetch(`/api/v1/admin/alternatives/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  },

  // --- 3. 真实评价与纠错 ---
  async getSoftwareReviews(slug: string, page = 1, pageSize = 10) {
    const res = await fetch(`/api/v1/software/${slug}/reviews?page=${page}&pageSize=${pageSize}`);
    return await res.json();
  },

  async submitSoftwareReview(softwareId: string, data: { rating: number; title: string; content: string; versionUsed?: string; operatingSystem?: string }) {
    const res = await fetch(`/api/v1/software/${softwareId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async voteReview(reviewId: string, isHelpful: boolean) {
    const res = await fetch(`/api/v1/reviews/${reviewId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isHelpful }),
    });
    return await res.json();
  },

  async reportReview(reviewId: string, reason: string, description?: string) {
    const res = await fetch(`/api/v1/reviews/${reviewId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, description }),
    });
    return await res.json();
  },

  async submitCorrection(softwareId: string, data: { correctionType: string; details: string; contactEmail?: string }) {
    const res = await fetch(`/api/v1/software/${softwareId}/corrections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async adminGetReviews(page = 1, pageSize = 20, status?: string) {
    const url = `/api/v1/admin/reviews?page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ''}`;
    const res = await fetch(url);
    return await res.json();
  },

  async adminUpdateReviewStatus(id: string, status: string) {
    const res = await fetch(`/api/v1/admin/reviews/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return await res.json();
  },

  async adminDeleteReview(id: string) {
    const res = await fetch(`/api/v1/admin/reviews/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  },

  async adminGetCorrections(page = 1, pageSize = 20, status?: string) {
    const url = `/api/v1/admin/corrections?page=${page}&pageSize=${pageSize}${status ? `&status=${status}` : ''}`;
    const res = await fetch(url);
    return await res.json();
  },

  async adminUpdateCorrectionStatus(id: string, status: string) {
    const res = await fetch(`/api/v1/admin/corrections/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return await res.json();
  },

  // --- 4. SEO 关键词与页面质量审计 ---
  async adminGetKeywords(page = 1, pageSize = 20, intent?: string, topic?: string) {
    const url = `/api/v1/admin/seo/keywords?page=${page}&pageSize=${pageSize}${intent ? `&intent=${intent}` : ''}${topic ? `&topic=${encodeURIComponent(topic)}` : ''}`;
    const res = await fetch(url);
    return await res.json();
  },

  async adminCreateKeyword(data: any) {
    const res = await fetch('/api/v1/admin/seo/keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async adminImportKeywords(items: any[]) {
    const res = await fetch('/api/v1/admin/seo/keywords/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    return await res.json();
  },

  async adminGetSeoAuditList(page = 1, pageSize = 20, pageType?: string) {
    const url = `/api/v1/admin/seo/audit?page=${page}&pageSize=${pageSize}${pageType ? `&pageType=${pageType}` : ''}`;
    const res = await fetch(url);
    return await res.json();
  },

  async adminBatchAuditAll() {
    const res = await fetch('/api/v1/admin/seo/audit/batch', {
      method: 'POST',
    });
    return await res.json();
  },

  // --- 5. AI 辅助运营系统 ---
  async adminGetAiProviders() {
    const res = await fetch('/api/v1/admin/ai/providers');
    return await res.json();
  },

  async adminCreateAiProvider(data: any) {
    const res = await fetch('/api/v1/admin/ai/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async adminUpdateAiProvider(id: string, data: any) {
    const res = await fetch(`/api/v1/admin/ai/providers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async adminDeleteAiProvider(id: string) {
    const res = await fetch(`/api/v1/admin/ai/providers/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  },

  async adminGenerateAiDraft(data: { taskType: string; targetType?: string; targetId?: string; inputContext: string; providerId?: string }) {
    const res = await fetch('/api/v1/admin/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  async adminGetAiTasks(page = 1, pageSize = 20, taskType?: string, status?: string) {
    const url = `/api/v1/admin/ai/tasks?page=${page}&pageSize=${pageSize}${taskType ? `&taskType=${taskType}` : ''}${status ? `&status=${status}` : ''}`;
    const res = await fetch(url);
    return await res.json();
  },

  async adminReviewAiTask(id: string, action: 'APPROVE' | 'REJECT', options?: { applyChanges?: boolean; feedback?: string }) {
    const res = await fetch(`/api/v1/admin/ai/tasks/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...options }),
    });
    return await res.json();
  },

  async adminGetAiUsage() {
    const res = await fetch('/api/v1/admin/ai/usage');
    return await res.json();
  },

  // --- 6. 流量大盘与搜索分析 ---
  async collectPageView(pagePath: string, pageType?: string, referer?: string) {
    try {
      await fetch('/api/v1/analytics/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagePath, pageType, referer }),
      });
    } catch {
      // 客户端打点失败静默吞掉
    }
  },

  async adminGetTrafficOverview() {
    const res = await fetch('/api/v1/admin/analytics/overview');
    return await res.json();
  },

  async adminGetSearchAnalytics() {
    const res = await fetch('/api/v1/admin/search/analytics');
    return await res.json();
  },

  async adminGetSearchConsoles() {
    const res = await fetch('/api/v1/admin/seo/search-consoles');
    return await res.json();
  },

  async adminGetGovernanceMetrics() {
    const res = await fetch('/api/v1/admin/governance/metrics');
    return await res.json();
  },
};
