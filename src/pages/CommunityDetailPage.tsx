import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Clock,
  Eye,
  Send,
  Flag,
  ShieldCheck,
  Package,
  Loader2,
  AlertCircle,
  Award,
  User,
  Share2,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import {
  getThread,
  createPost,
  resolveThread,
  unresolveThread,
  CommunityThread,
  CommunityPost
} from '../services/communityService';
import { getCategoryBadgeMeta } from '../components/community/CommunityThreadList';
import { CommunityReportModal } from '../components/community/CommunityReportModal';

export const CommunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [thread, setThread] = useState<CommunityThread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 举报弹窗状态
  const [reportModalState, setReportModalState] = useState<{
    isOpen: boolean;
    threadId?: string;
    postId?: string;
    targetTitle?: string;
  }>({ isOpen: false });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = () => {
    if (!id) return;
    setIsLoading(true);
    getThread(id)
      .then((res) => {
        if (res.success && res.data) {
          setThread(res.data);
        } else {
          setThread(null);
        }
      })
      .catch((err) => {
        setErrorMessage(err.message || '获取讨论详情失败');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // 发表回复
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !id) return;
    setIsSubmittingReply(true);
    setErrorMessage(null);

    try {
      const res = await createPost(id, { content: replyContent });
      if (res.success) {
        setReplyContent('');
        showToast('回复发表成功！感谢您的热心解答。');
        loadData();
      } else {
        setErrorMessage(res.error?.message || '发表回复失败，请确认是否已登录');
      }
    } catch (err: any) {
      setErrorMessage(err.message || '网络连接异常');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // 采纳最佳解答
  const handleAcceptPost = async (postId: string) => {
    if (!id) return;
    if (!window.confirm('确认采纳此回答为该讨论的最佳解答吗？')) return;

    try {
      const res = await resolveThread(id, postId);
      if (res.success) {
        showToast('已成功采纳最佳解答并标记为已解决！');
        loadData();
      } else {
        alert(res.error?.message || '操作失败');
      }
    } catch (err: any) {
      alert(err.message || '操作异常');
    }
  };

  // 切换已解决 / 取消已解决
  const handleToggleResolve = async () => {
    if (!id || !thread) return;
    try {
      if (thread.isResolved) {
        if (!window.confirm('确定要取消该讨论的已解决状态吗？')) return;
        const res = await unresolveThread(id);
        if (res.success) {
          showToast('已取消解决状态');
          loadData();
        } else {
          alert(res.error?.message || '操作失败');
        }
      } else {
        const res = await resolveThread(id);
        if (res.success) {
          showToast('已将该讨论标记为已解决！');
          loadData();
        } else {
          alert(res.error?.message || '操作失败');
        }
      }
    } catch (err: any) {
      alert(err.message || '操作异常');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 py-24 text-center">
        <Loader2 className="w-9 h-9 animate-spin mx-auto text-blue-600 mb-3" />
        <p className="text-xs text-slate-500 dark:text-slate-400">正在载入讨论内容与回复...</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="max-w-[600px] mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h1 className="text-base font-bold text-slate-900 dark:text-white mb-2">讨论主题不存在或已被关闭</h1>
        <p className="text-xs text-slate-500 mb-6">该讨论可能因违规被管理员治理或已被发起者删除。</p>
        <Link
          to="/community"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回社区交流主页</span>
        </Link>
      </div>
    );
  }

  const categoryMeta = getCategoryBadgeMeta(thread.category);
  const tagList = thread.tags
    ? thread.tags.split(/[,， ]+/).filter((t) => t.trim().length > 0)
    : [];

  // 寻找被采纳的帖子
  const acceptedPost = thread.posts?.find(
    (p) => p.isAccepted || p.id === thread.acceptedPostId
  );

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* 消息 Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 面包屑导航与返回 */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-blue-600 transition-colors">
            首页
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
          <Link to="/community" className="hover:text-blue-600 transition-colors">
            社区交流
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
          <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px] sm:max-w-[300px]">
            {thread.title}
          </span>
        </div>

        <Link
          to="/community"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回社区主页</span>
        </Link>
      </div>

      {errorMessage && (
        <div className="p-3 mb-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </span>
          <button onClick={() => setErrorMessage(null)} className="p-1 cursor-pointer">
            ×
          </button>
        </div>
      )}

      {/* 主帖正文卡片 */}
      <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xs mb-8">
        {/* 顶部标签状态条与操作 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 解决状态 */}
            {thread.isResolved ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>已解决</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs font-semibold">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>待协助解决</span>
              </span>
            )}

            {/* 板块分类 */}
            <span
              className={`inline-flex items-center px-2.5 py-1 border rounded-lg text-xs font-medium ${categoryMeta.color}`}
            >
              {categoryMeta.label}
            </span>

            {/* 关联软件卡片胶囊 */}
            {thread.software && (
              <Link
                to={`/software/${thread.software.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-800 dark:text-slate-200 hover:text-blue-600 text-xs font-semibold rounded-lg transition-colors border border-slate-200/80 dark:border-slate-700/80"
              >
                <Package className="w-3.5 h-3.5 text-blue-500" />
                <span>关联软件: {thread.software.name}</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* 发起者操作快捷按钮 */}
            <button
              onClick={handleToggleResolve}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                thread.isResolved
                  ? 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300'
                  : 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{thread.isResolved ? '标记为未解决' : '标记为已解决'}</span>
            </button>

            {/* 举报按钮 */}
            <button
              onClick={() =>
                setReportModalState({
                  isOpen: true,
                  threadId: thread.id,
                  targetTitle: thread.title,
                })
              }
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 cursor-pointer p-1"
              title="举报该讨论"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>举报</span>
            </button>
          </div>
        </div>

        {/* 讨论主标题 */}
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-4">
          {thread.title}
        </h1>

        {/* 发帖人信息与发布元数据 */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pb-5 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
              {thread.user?.username?.slice(0, 1).toUpperCase() || 'U'}
            </div>
            <span>{thread.user?.username || '部落用户'}</span>
          </div>

          <span>·</span>

          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>发布于 {new Date(thread.createdAt).toLocaleString()}</span>
          </span>

          <span>·</span>

          <span className="inline-flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{thread.viewCount} 次浏览</span>
          </span>

          {tagList.length > 0 && (
            <>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                {tagList.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 正文内容 */}
        <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-normal">
          {thread.content}
        </div>
      </article>

      {/* 最佳解答高亮展示区 (若已被采纳) */}
      {acceptedPost && (
        <section className="bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-500/60 dark:border-emerald-600/50 rounded-3xl p-6 sm:p-7 mb-8 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80 dark:border-emerald-900/60 mb-4">
            <div className="inline-flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
              <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>发起者采纳的最佳解答</span>
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded font-medium">
              解决率认证
            </span>
          </div>

          <div className="flex items-center gap-2 mb-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {acceptedPost.user?.username}
            </span>
            {acceptedPost.isDeveloperReply && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3" />
                <span>官方认证开发者</span>
              </span>
            )}
            <span>·</span>
            <span>{new Date(acceptedPost.createdAt).toLocaleString()}</span>
          </div>

          <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
            {acceptedPost.content}
          </div>
        </section>
      )}

      {/* 回复流列表 */}
      <section className="space-y-4 mb-8">
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>全部交流回复 ({thread.posts?.length || 0})</span>
          </h2>
          <span className="text-xs text-slate-400">按发帖时间正序排列</span>
        </div>

        {thread.posts && thread.posts.length > 0 ? (
          thread.posts.map((post, idx) => {
            const isThisAccepted = post.isAccepted || post.id === thread.acceptedPostId;

            return (
              <div
                key={post.id}
                id={`post-${post.id}`}
                className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                  isThisAccepted
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : post.isDeveloperReply
                    ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* 楼层头部 */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {post.user?.username}
                    </span>

                    {/* 官方认证开发者徽章 */}
                    {post.isDeveloperReply && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold shadow-2xs">
                        <ShieldCheck className="w-3 h-3" />
                        <span>官方认证开发者回复</span>
                      </span>
                    )}

                    {/* 采纳徽章 */}
                    {isThisAccepted && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] font-bold shadow-2xs">
                        <Award className="w-3 h-3" />
                        <span>最佳解答</span>
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400">
                      #{idx + 1} 楼 · {new Date(post.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 采纳按钮 (若未被采纳，发起者可点击) */}
                    {!isThisAccepted && (
                      <button
                        onClick={() => handleAcceptPost(post.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold rounded-lg border border-emerald-300 dark:border-emerald-800 cursor-pointer transition-colors"
                        title="采纳此回答为最佳解答"
                      >
                        <Award className="w-3 h-3" />
                        <span>采纳此回答</span>
                      </button>
                    )}

                    {/* 举报按钮 */}
                    <button
                      onClick={() =>
                        setReportModalState({
                          isOpen: true,
                          postId: post.id,
                          targetTitle: `楼层 #${idx + 1} (${post.user?.username})`,
                        })
                      }
                      className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer"
                      title="举报该回复"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 回复正文 */}
                <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center shadow-2xs">
            <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              暂无回复。如果您知晓解决思路或有排障建议，欢迎发表第一条解答！
            </p>
          </div>
        )}
      </section>

      {/* 发表回复区 */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">发表您的回复与排障解答</h3>
        <p className="text-[11px] text-slate-400 mb-4">
          请保持友善交流、实事求是。提供具体命令行、系统配置修改或设置入口更易被题主采纳为最佳答案。
        </p>

        <form onSubmit={handleReplySubmit} className="space-y-4">
          <textarea
            required
            rows={4}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="写下您的解答、排障分析或使用建议..."
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-slate-400">
              平台已开启 anti-XSS 安全过滤及违规内容监测
            </span>

            <button
              type="submit"
              disabled={isSubmittingReply}
              className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmittingReply ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>提交回复</span>
            </button>
          </div>
        </form>
      </section>

      {/* 举报弹窗 */}
      <CommunityReportModal
        isOpen={reportModalState.isOpen}
        threadId={reportModalState.threadId}
        postId={reportModalState.postId}
        targetTitle={reportModalState.targetTitle}
        onClose={() => setReportModalState({ isOpen: false })}
        onSuccess={() => {
          showToast('举报已提交至审核队列，感谢维护纯净技术社区！');
        }}
      />
    </div>
  );
};
