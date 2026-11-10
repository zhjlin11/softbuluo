/**
 * 会员收藏与书签服务 (P8.5 商业化与会员互动闭环)
 */

export interface BookmarkItem {
  id: string;
  targetType: string;
  targetId: string;
  notes?: string | null;
  createdAt: string;
  software?: {
    id: string;
    name: string;
    slug: string;
    iconUrl?: string;
    developer: string;
    summary: string;
    category?: { name: string; slug: string };
  };
}

export const BookmarkService = {
  async listBookmarks(page = 1, pageSize = 20): Promise<{ success: boolean; data?: { items: BookmarkItem[]; total: number } }> {
    try {
      const res = await fetch(`/api/v1/user/bookmarks?page=${page}&pageSize=${pageSize}`, {
        credentials: 'include',
      });
      return await res.json();
    } catch (e: any) {
      return { success: false };
    }
  },

  async addBookmark(targetType: 'SOFTWARE' | 'TUTORIAL' | 'GAME', targetId: string, notes?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/v1/user/bookmarks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, notes }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async removeBookmark(bookmarkId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`/api/v1/user/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async checkIsBookmarked(targetId: string): Promise<{ isBookmarked: boolean; bookmarkId?: string }> {
    try {
      const res = await this.listBookmarks(1, 100);
      if (res.success && res.data?.items) {
        const found = res.data.items.find((b: any) => b.targetId === targetId);
        if (found) return { isBookmarked: true, bookmarkId: found.id };
      }
    } catch {}
    return { isBookmarked: false };
  },
};
