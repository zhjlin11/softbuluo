import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Clock,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  getLinkHealthLogs,
  getLinkHealthSummary,
  triggerBatchLinkCheck,
} from '../../services/operationsService';

export const AdminLinkMonitorPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [lRes, sRes] = await Promise.all([
        getLinkHealthLogs(1, statusFilter),
        getLinkHealthSummary(),
      ]);
      if (lRes.success && lRes.data) setLogs(lRes.data.items || []);
      if (sRes.success && sRes.data) setSummary(sRes.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleBatchCheck = async () => {
    setIsChecking(true);
    try {
      const res = await triggerBatchLinkCheck(20);
      if (res.success) {
        await loadData();
      } else {
        alert(res.message || '巡检触发失败');
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <AdminLayout title="下载链接健康监测">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-600" />
            下载链接健康与可用性巡检
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            实时检测 HTTP 状态、重定向链、403 防爬待审与 404 失效，严格防御 SSRF 私网穿透
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          >
            <option value="">全部状态</option>
            <option value="HEALTHY">正常 (HEALTHY)</option>
            <option value="REDIRECTED">重定向 (REDIRECTED)</option>
            <option value="NEEDS_REVIEW">待人工复核 (403/NEEDS_REVIEW)</option>
            <option value="BROKEN">失效 (404/5xx/BROKEN)</option>
          </select>

          <button
            onClick={handleBatchCheck}
            disabled={isChecking}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            批量执行巡检
          </button>
        </div>
      </div>

      {/* 状态统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-500">正常可用 (200 OK)</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {summary?.healthy ?? 0}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-500">跳转重定向 (301/302)</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {summary?.redirected ?? 0}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-500">待人工复核 (403等限制)</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {summary?.needsReview ?? 0}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-slate-500">明确失效 (404/网络异常)</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {summary?.broken ?? 0}
          </div>
        </div>
      </div>

      {/* 巡检日志表格 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            <tr>
              <th className="py-3 px-4 font-semibold">探测目标 URL</th>
              <th className="py-3 px-4 font-semibold">健康状态</th>
              <th className="py-3 px-4 font-semibold">HTTP 状态</th>
              <th className="py-3 px-4 font-semibold">耗时</th>
              <th className="py-3 px-4 font-semibold">详细诊断 / 错误</th>
              <th className="py-3 px-4 font-semibold text-right">探测时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => {
              const statusBadge = {
                HEALTHY: 'bg-emerald-100 text-emerald-800',
                REDIRECTED: 'bg-blue-100 text-blue-800',
                NEEDS_REVIEW: 'bg-amber-100 text-amber-800',
                BROKEN: 'bg-rose-100 text-rose-800',
              }[log.status as string] || 'bg-slate-100 text-slate-800';

              return (
                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <a
                      href={log.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 flex items-center gap-1 max-w-[280px] truncate"
                    >
                      {log.url} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold">
                    {log.httpStatus || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {log.responseTimeMs ? `${log.responseTimeMs}ms` : '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate" title={log.errorMessage || log.finalUrl}>
                    {log.errorMessage ? (
                      <span className="text-rose-500">{log.errorMessage}</span>
                    ) : log.finalUrl && log.finalUrl !== log.url ? (
                      <span className="text-blue-500">跳至: {log.finalUrl}</span>
                    ) : (
                      '服务响应正常'
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-right text-[11px]">
                    {new Date(log.checkedAt).toLocaleTimeString()}
                  </td>
                </tr>
              );
            })}
            {logs.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  暂无匹配状态的链接巡检记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};
