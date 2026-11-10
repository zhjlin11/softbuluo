import React from 'react';
import { Link } from 'react-router-dom';
import {
  Pin,
  CheckCircle2,
  HelpCircle,
  Package,
  Clock,
  Eye,
  MessageCircle,
  Tag,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Award
} from 'lucide-react';
import { CommunityThread } from '../../services/communityService';

export interface CommunityThreadListProps {
  threads: CommunityThread[];
  isLoading: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onOpenCreateModal: () => void;
}

export const getCategoryBadgeMeta = (category: string) => {
  switch (category) {
    case 'INSTALL_ISSUE':
      return { label: '安装排障', color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50' };
    case 'QUESTION':
      return { label: '技术问答', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50' };
    case 'WINDOWS':
      return { label: 'Windows 系统', color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50' };
    case 'REPAIR':
      return { label: '电脑维修与装机', color: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50' };
    case 'NETWORK':
      return { label: '网络与安全', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' };
    case 'GAMES':
      return { label: '游戏讨论', color: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900/50' };
    case 'FEEDBACK':
      return { label: '功能建议', color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50' };
    default:
      return { label: '使用心得', color: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/50' };
  }
};

export const CommunityThreadList: React.FC<CommunityThreadListProps> = ({
  threads,
  isLoading,
  pagination,
  onPageChange,
  onOpenCreateModal,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center shadow-2xs">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
        <p className="text-xs text-slate-500 dark:text-slate-400">正在检索社区讨论与技术问答...</p>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 mx-auto flex items-center justify-center mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">该板块暂无匹配的讨论或求助</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
          您是遇到了未收录的疑难杂症，还是有独到的调优经验？欢迎成为本板块的第一位分享者！
        </p>
        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <span>发起第一篇讨论</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {threads.map((thread) => {
          const badgeMeta = getCategoryBadgeMeta(thread.category);
          const tagList = thread.tags
            ? thread.tags.split(/[,， ]+/).filter((t) => t.trim().length > 0)
            : [];

          return (
            <article
              key={thread.id}
              className="p-4 sm:p-5 hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              {/* 主体信息区 */}
              <div className="flex-1 min-w-0">
                {/* 状态与分类标签条 */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {thread.isPinned && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-rose-500 text-white rounded-md text-[10px] font-bold shadow-2xs">
                      <Pin className="w-3 h-3" />
                      <span>置顶</span>
                    </span>
                  )}

                  {/* 解决状态 */}
                  {thread.isResolved ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-md text-[10px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>已解决</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-md text-[10px] font-medium">
                      <HelpCircle className="w-3 h-3" />
                      <span>待解答</span>
                    </span>
                  )}

                  {/* 板块分类 */}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 border rounded-md text-[10px] font-medium ${badgeMeta.color}`}
                  >
                    {badgeMeta.label}
                  </span>

                  {/* 关联软件 */}
                  {thread.software && (
                    <Link
                      to={`/software/${thread.software.slug}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md text-[10px] transition-colors"
                      title={`关联软件: ${thread.software.name}`}
                    >
                      <Package className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate max-w-[120px]">{thread.software.name}</span>
                    </Link>
                  )}

                  {/* 最佳解答标识 */}
                  {thread.acceptedPostId && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-medium shadow-2xs">
                      <Award className="w-3 h-3" />
                      <span>含最佳解答</span>
                    </span>
                  )}
                </div>

                {/* 标题 */}
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-snug line-clamp-1 mb-1.5">
                  <Link to={`/community/thread/${thread.id}`}>{thread.title}</Link>
                </h2>

                {/* 正文摘要 */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {thread.content}
                </p>

                {/* 底部元数据栏 */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] text-slate-600 dark:text-slate-300">
                      <User className="w-2.5 h-2.5" />
                    </div>
                    <span>{thread.user?.username || '部落用户'}</span>
                  </div>

                  <span>·</span>

                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                  </span>

                  {tagList.length > 0 && (
                    <>
                      <span>·</span>
                      <div className="inline-flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <div className="flex items-center gap-1">
                          {tagList.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[10px]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 右侧统计信息 */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{thread.replyCount} 回复</span>
                </div>

                <div className="inline-flex items-center gap-1 text-[11px] text-slate-400 px-1">
                  <Eye className="w-3 h-3" />
                  <span>{thread.viewCount} 浏览</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* 分页控制器 */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            共 {pagination.total} 条讨论，第 {pagination.page} / {pagination.totalPages} 页
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>上一页</span>
            </button>

            <button
              onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <span>下一页</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
