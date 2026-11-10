const API_BASE = '/api/v1';

export interface CommunityThread {
  id: string;
  softwareId?: string | null;
  userId: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  isResolved: boolean;
  acceptedPostId?: string | null;
  tags?: string | null;
  status: string;
  viewCount: number;
  replyCount: number;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
  software?: {
    id: string;
    name: string;
    slug: string;
    iconUrl?: string | null;
  } | null;
  posts?: CommunityPost[];
}

export interface CommunityPost {
  id: string;
  threadId: string;
  userId: string;
  parentPostId?: string | null;
  content: string;
  isDeveloperReply: boolean;
  isAccepted: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
    avatarUrl?: string | null;
    developerProfile?: {
      id: string;
      displayName: string;
      verificationStatus: string;
    } | null;
  };
}

export interface CommunityStats {
  totalThreads: number;
  totalPosts: number;
  resolvedThreads: number;
  unresolvedThreads: number;
  resolutionRate: number;
  categoryCounts: Record<string, number>;
}

export async function listThreads(params?: {
  softwareId?: string;
  category?: string;
  isResolved?: boolean;
  sort?: 'latest' | 'hottest' | 'unresolved';
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams();
  if (params?.softwareId) query.set('softwareId', params.softwareId);
  if (params?.category) query.set('category', params.category);
  if (params?.isResolved !== undefined) query.set('isResolved', String(params.isResolved));
  if (params?.sort) query.set('sort', params.sort);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));

  const res = await fetch(`${API_BASE}/community/threads?${query.toString()}`);
  return res.json();
}

export async function getCommunityStats(): Promise<{ success: boolean; data: CommunityStats }> {
  const res = await fetch(`${API_BASE}/community/stats`);
  return res.json();
}

export async function getPendingQuestions(limit = 5) {
  const res = await fetch(`${API_BASE}/community/pending?limit=${limit}`);
  return res.json();
}

export async function getThread(id: string) {
  const res = await fetch(`${API_BASE}/community/threads/${id}`);
  return res.json();
}

export async function createThread(data: {
  softwareId?: string;
  title: string;
  content: string;
  category?: string;
  tags?: string;
}) {
  const res = await fetch(`${API_BASE}/community/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function resolveThread(threadId: string, acceptedPostId?: string) {
  const res = await fetch(`${API_BASE}/community/threads/${threadId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ acceptedPostId }),
  });
  return res.json();
}

export async function unresolveThread(threadId: string) {
  const res = await fetch(`${API_BASE}/community/threads/${threadId}/unresolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

export async function createPost(threadId: string, data: { parentPostId?: string; content: string }) {
  const res = await fetch(`${API_BASE}/community/threads/${threadId}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function reportContent(data: { threadId?: string; postId?: string; reason: string }) {
  const res = await fetch(`${API_BASE}/community/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
