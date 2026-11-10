/**
 * 软游部落 P3 自动化运营系统前端 API 服务
 */

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; message?: string }> {
  try {
    const res = await fetch(endpoint, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, message: json.message || `请求失败 (${res.status})` };
    }
    return json;
  } catch (err: any) {
    return { success: false, message: err.message || '网络连接异常' };
  }
}

// 1. 运营工作台
export async function getOperationsStats() {
  return apiFetch<any>('/api/v1/admin/operations/stats');
}

export async function getPendingActions() {
  return apiFetch<any>('/api/v1/admin/operations/pending-actions');
}

export async function getNotifications(page = 1, isRead?: boolean) {
  const query = new URLSearchParams({ page: page.toString(), limit: '10' });
  if (typeof isRead === 'boolean') query.append('isRead', isRead.toString());
  return apiFetch<any>(`/api/v1/admin/operations/notifications?${query.toString()}`);
}

export async function markNotificationAsRead(id: string) {
  return apiFetch<any>(`/api/v1/admin/operations/notifications/${id}/read`, { method: 'PATCH' });
}

// 2. 官方来源管理
export async function getSources(page = 1, search = '') {
  const query = new URLSearchParams({ page: page.toString(), limit: '15' });
  if (search) query.append('search', search);
  return apiFetch<any>(`/api/v1/admin/sources?${query.toString()}`);
}

export async function createSource(data: any) {
  return apiFetch<any>('/api/v1/admin/sources', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateSource(id: string, data: any) {
  return apiFetch<any>(`/api/v1/admin/sources/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function checkSource(id: string) {
  return apiFetch<any>(`/api/v1/admin/sources/${id}/verify`, { method: 'POST' });
}

export async function testSourceUrl(url: string) {
  return apiFetch<any>('/api/v1/admin/sources/test', { method: 'POST', body: JSON.stringify({ url }) });
}

// 3. 批量导入与去重
export async function parseImportCsv(csvContent: string) {
  return apiFetch<any>('/api/v1/admin/import/csv', { method: 'POST', body: JSON.stringify({ csvContent }) });
}

export async function importFromUrl(url: string, categoryId?: string) {
  return apiFetch<any>('/api/v1/admin/import/url', { method: 'POST', body: JSON.stringify({ url, categoryId }) });
}

export async function getImportBatches(page = 1) {
  return apiFetch<any>(`/api/v1/admin/import/batches?page=${page}&limit=10`);
}

export async function getImportBatchDetail(id: string) {
  return apiFetch<any>(`/api/v1/admin/import/batches/${id}`);
}

export async function reviewImportItem(batchId: string, itemId: string, action: 'APPROVE' | 'REJECT' | 'RESOLVE_CONFLICT', categoryId?: string) {
  return apiFetch<any>(`/api/v1/admin/import/batches/${batchId}/commit`, {
    method: 'POST',
    body: JSON.stringify({
      itemActions: [{ itemId, action: action === 'REJECT' ? 'REJECT' : 'APPROVE', categoryId }],
    }),
  });
}

// 4. 版本监测
export async function getVersionCandidates(page = 1, status?: string) {
  const query = new URLSearchParams({ page: page.toString(), limit: '15' });
  if (status) query.append('status', status);
  return apiFetch<any>(`/api/v1/admin/versions/candidates?${query.toString()}`);
}

export async function reviewVersionCandidate(id: string, action: 'APPROVE' | 'REJECT', notes?: string) {
  return apiFetch<any>(`/api/v1/admin/versions/candidates/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ action, notes }),
  });
}

export async function triggerVersionCheck(softwareId?: string) {
  return apiFetch<any>('/api/v1/admin/versions/check', {
    method: 'POST',
    body: JSON.stringify({ softwareId }),
  });
}

// 5. 链接健康监控
export async function getLinkHealthLogs(page = 1, status?: string) {
  const query = new URLSearchParams({ page: page.toString(), limit: '20' });
  if (status) query.append('status', status);
  return apiFetch<any>(`/api/v1/admin/link-health/logs?${query.toString()}`);
}

export async function getLinkHealthSummary() {
  return apiFetch<any>('/api/v1/admin/link-health/summary');
}

export async function triggerBatchLinkCheck(limit = 20) {
  return apiFetch<any>('/api/v1/admin/link-health/check-batch', {
    method: 'POST',
    body: JSON.stringify({ limit }),
  });
}

// 6. 任务调度
export async function getJobs() {
  return apiFetch<any>('/api/v1/admin/jobs');
}

export async function triggerJob(id: string) {
  return apiFetch<any>(`/api/v1/admin/jobs/${id}/trigger`, { method: 'POST' });
}

export async function getJobRuns(jobId: string, page = 1) {
  return apiFetch<any>(`/api/v1/admin/jobs/${jobId}/runs?page=${page}&limit=10`);
}

// 7. 专题管理
export async function getTopics(page = 1) {
  return apiFetch<any>(`/api/v1/admin/topics?page=${page}&limit=15`);
}

export async function createTopic(data: any) {
  return apiFetch<any>('/api/v1/admin/topics', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTopic(id: string, data: any) {
  return apiFetch<any>(`/api/v1/admin/topics/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function attachSoftwareToTopic(topicId: string, softwareId: string, customNote?: string, sortOrder = 0) {
  return apiFetch<any>(`/api/v1/admin/topics/${topicId}/resources`, {
    method: 'POST',
    body: JSON.stringify({ softwareId, customNote, sortOrder }),
  });
}

export async function removeSoftwareFromTopic(topicId: string, softwareId: string) {
  return apiFetch<any>(`/api/v1/admin/topics/${topicId}/resources/${softwareId}`, { method: 'DELETE' });
}

// 8. 教程管理
export async function getAdminTutorials(page = 1) {
  return apiFetch<any>(`/api/v1/admin/tutorials?page=${page}&limit=15`);
}

export async function createTutorial(data: any) {
  return apiFetch<any>('/api/v1/admin/tutorials', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTutorial(id: string, data: any) {
  return apiFetch<any>(`/api/v1/admin/tutorials/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}
