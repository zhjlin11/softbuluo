import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Layers,
  Clock,
  AlertTriangle,
  GitPullRequest,
  CheckCircle2,
  RefreshCw,
  Bell,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  getOperationsStats,
  getPendingActions,
  getNotifications,
  markNotificationAsRead,
} from '../../services/operationsService';

export const AdminOperationsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sRes, pRes, nRes] = await Promise.all([
        getOperationsStats(),
        getPendingActions(),
        getNotifications(1),
      ]);
      if (sRes.success) setStats(sRes.data);
      if (pRes.success) setPending(pRes.data);
      if (nRes.success) setNotifications(nRes.data?.items || []);
    } catch (err) {
      console.error('加载运营工作台数据失败', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    const res = await markNotificationAsRead(id);
    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  return (
    <AdminLayout title="运营控制工作台">
      {/* 头部摘要 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            自动化运营工作台
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            监控全站资源收录、官方版本探测、失效链接巡检与待办审核流
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          刷新数据
        </button>
      </div>

      {/* 核心指标统计卡 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">全站总收录资源</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {stats?.resources?.total ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">{stats?.resources?.published ?? 0}</span> 已正式公开发布
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">新版本候选待审</span>
            <GitPullRequest className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">
            {stats?.versionCandidates?.pendingReview ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            累计捕获 {stats?.versionCandidates?.total ?? 0} 个官方新版
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">下载链接健康巡检</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {stats?.links?.brokenOrNeedsReview ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats?.links?.broken ?? 0} 失效 / {stats?.links?.needsReview ?? 0} 待人工复核
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">官方来源注册数</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {stats?.sources?.verified ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            共接入 {stats?.sources?.total ?? 0} 个官方 Releases/官网
          </div>
        </div>
      </div>

      {/* 待办中心与通知两栏布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左栏：待办审核清单 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              运营待办审核中心
            </h3>
            <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full font-medium">
              共 {(pending?.pendingVersions?.length || 0) + (pending?.pendingImports?.length || 0) + (pending?.brokenLinks?.length || 0)} 项待办
            </span>
          </div>

          <div className="space-y-4">
            {/* 新版本待审 */}
            {pending?.pendingVersions && pending.pendingVersions.length > 0 && (
              <div className="border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                    新版本发现待审核 ({pending.pendingVersions.length})
                  </span>
                  <Link to="/admin/version-monitor" className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
                    前往审核 <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-1.5">
                  {pending.pendingVersions.slice(0, 3).map((v: any) => (
                    <div key={v.id} className="text-xs bg-white dark:bg-slate-800 p-2 rounded border border-indigo-100 dark:border-indigo-900 flex justify-between items-center">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{v.software?.name || '未知软件'}</span>
                      <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[10px]">
                        v{v.candidateVersion}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 批量导入冲突待审 */}
            {pending?.pendingImports && pending.pendingImports.length > 0 && (
              <div className="border border-amber-100 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                    批量收录冲突/待确认 ({pending.pendingImports.length})
                  </span>
                  <Link to="/admin/import" className="text-xs text-amber-600 hover:underline flex items-center gap-0.5">
                    解决冲突 <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-1.5">
                  {pending.pendingImports.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="text-xs bg-white dark:bg-slate-800 p-2 rounded border border-amber-100 dark:border-amber-900 flex justify-between items-center">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                      <span className="text-[10px] text-amber-600">{item.matchStatus}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 失效链接 */}
            {pending?.brokenLinks && pending.brokenLinks.length > 0 && (
              <div className="border border-rose-100 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-rose-900 dark:text-rose-300">
                    失效/异常下载链接 ({pending.brokenLinks.length})
                  </span>
                  <Link to="/admin/link-monitor" className="text-xs text-rose-600 hover:underline flex items-center gap-0.5">
                    查看日志 <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-1.5">
                  {pending.brokenLinks.slice(0, 3).map((link: any) => (
                    <div key={link.id} className="text-xs bg-white dark:bg-slate-800 p-2 rounded border border-rose-100 dark:border-rose-900 flex justify-between items-center">
                      <span className="truncate max-w-[200px] text-slate-700 dark:text-slate-300">{link.url}</span>
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                        HTTP {link.httpStatus || 'ERR'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!pending?.pendingVersions?.length && !pending?.pendingImports?.length && !pending?.brokenLinks?.length) && (
              <div className="py-12 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                当前无待办审核事项，所有自动化任务运行良好。
              </div>
            )}
          </div>
        </div>

        {/* 右栏：站内异常提醒与通知 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              运营消息与异常提醒
            </h3>
            <span className="text-xs text-slate-500">
              最新 10 条
            </span>
          </div>

          <div className="space-y-3">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-lg border text-xs transition-colors flex justify-between items-start gap-3 ${
                    n.isRead
                      ? 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500'
                      : 'border-blue-100 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20 text-slate-900 dark:text-slate-100 font-medium'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-2 h-2 rounded-full ${n.level === 'CRITICAL' || n.level === 'WARNING' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                      <span className="font-semibold">{n.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      {n.content}
                    </p>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="text-[10px] text-blue-600 hover:underline shrink-0"
                    >
                      标为已读
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                暂无运营通知与提醒
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
