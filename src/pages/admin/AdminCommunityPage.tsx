import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  MessageSquare,
  Flag,
  Pin,
  EyeOff,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

export const AdminCommunityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'threads' | 'reports'>('threads');
  const [threads, setThreads] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = () => {
    setIsLoading(true);
    if (activeTab === 'threads') {
      fetch('/api/v1/admin/community/threads')
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setThreads(json.data);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      fetch('/api/v1/admin/community/reports')
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setReports(json.data);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleThreadAction = async (id: string, action: string, title: string) => {
    const reason = prompt(`请输入执行 [${action}] 操作的原因:`, '社区合规与反垃圾广告治理');
    if (reason === null) return;

    try {
      const res = await fetch(`/api/v1/admin/community/threads/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback(`主题 "${title}" 已成功执行 [${action}] 操作`);
        loadData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResolveReport = async (id: string, status: string) => {
    const notes = prompt(`处理举报备注 (${status}):`, status === 'RESOLVED' ? '已处理违规内容并对违规行为进行限制' : '经核实未发现违规，忽略举报');
    if (notes === null) return;

    try {
      const res = await fetch(`/api/v1/admin/community/reports/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes: notes }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback(`举报 #${id.slice(-6)} 处理完成 (${status})`);
        loadData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <AdminLayout title="社区互动与内容治理后台">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">社区互动与内容治理后台</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            审核社区讨论内容、处理用户举报、屏蔽垃圾营销广告与置顶优质心得
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('threads')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              activeTab === 'threads' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs' : 'text-slate-500'
            }`}
          >
            全部主题清单
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              activeTab === 'reports' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-2xs' : 'text-slate-500'
            }`}
          >
            违规举报队列
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 mb-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)}>×</button>
        </div>
      )}

      {activeTab === 'threads' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>主题列表</span>
            <span className="text-slate-400 font-mono text-[11px]">{threads.length} 篇</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                <span>加载主题中...</span>
              </div>
            ) : threads.length === 0 ? (
              <div className="p-12 text-center text-slate-400">暂无讨论主题</div>
            ) : (
              threads.map((t) => (
                <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{t.title}</span>
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded text-[10px]">
                        {t.category}
                      </span>
                      {t.status === 'HIDDEN' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px]">已隐藏</span>
                      )}
                      {t.status === 'DELETED' && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px]">已删除</span>
                      )}
                    </div>
                    <p className="text-slate-500 line-clamp-1">{t.content}</p>
                    <div className="text-slate-400 text-[11px]">
                      作者: {t.user?.username} · 回复: {t._count?.posts || 0} · 浏览: {t.viewCount} · 日期: {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleThreadAction(t.id, 'PIN', t.title)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs cursor-pointer"
                    >
                      {t.isPinned ? '取消置顶' : '置顶'}
                    </button>
                    <button
                      onClick={() => handleThreadAction(t.id, 'HIDE', t.title)}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs cursor-pointer"
                    >
                      隐藏
                    </button>
                    <button
                      onClick={() => handleThreadAction(t.id, 'DELETE', t.title)}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs cursor-pointer"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>用户举报清单</span>
            <span className="text-slate-400 font-mono text-[11px]">{reports.length} 条</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-rose-600 mb-2" />
                <span>加载举报中...</span>
              </div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center text-slate-400">当前没有待处理的违规举报</div>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        举报原因: {r.reason}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${r.status === 'PENDING' ? 'bg-amber-100 text-amber-700 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      举报人: {r.reporter?.username} · 举报目标: {r.thread ? `主题: ${r.thread.title}` : `回复内容: ${r.post?.content}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {r.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleResolveReport(r.id, 'RESOLVED')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          确认违规并处理
                        </button>
                        <button
                          onClick={() => handleResolveReport(r.id, 'DISMISSED')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs cursor-pointer"
                        >
                          忽略此举报
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
