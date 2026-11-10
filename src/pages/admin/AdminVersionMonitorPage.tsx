import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  getVersionCandidates,
  reviewVersionCandidate,
  triggerVersionCheck,
} from '../../services/operationsService';

export const AdminVersionMonitorPage: React.FC = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadCandidates = async () => {
    setIsLoading(true);
    try {
      const res = await getVersionCandidates(1, statusFilter);
      if (res.success && res.data) {
        setCandidates(res.data.items || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [statusFilter]);

  const handleTriggerCheck = async () => {
    setIsChecking(true);
    try {
      const res = await triggerVersionCheck();
      if (res.success) {
        await loadCandidates();
      } else {
        alert(res.message || '触发版本检测失败');
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleReview = async (id: string, action: 'APPROVE' | 'REJECT') => {
    setProcessingId(id);
    try {
      const res = await reviewVersionCandidate(id, action);
      if (res.success) {
        await loadCandidates();
      } else {
        alert(res.message || '审核处理失败');
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminLayout title="官方版本更新监测">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-indigo-600" />
            官方版本自动监测与审核
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            智能对比 SemVer / 日期发行版，定时发现官方新版并推入审核候选池，禁止未经人工核验直接公开发布
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          >
            <option value="">全部状态</option>
            <option value="PENDING_REVIEW">待审核 (PENDING_REVIEW)</option>
            <option value="APPROVED">已批准 (APPROVED)</option>
            <option value="REJECTED">已驳回 (REJECTED)</option>
            <option value="DISCOVERED">初始捕获 (DISCOVERED)</option>
          </select>

          <button
            onClick={handleTriggerCheck}
            disabled={isChecking}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            全库触发检测
          </button>
        </div>
      </div>

      {/* 候选卡片列表 */}
      <div className="space-y-4">
        {candidates.map((c) => {
          const statusBadge = {
            PENDING_REVIEW: 'bg-amber-100 text-amber-800 border-amber-200',
            APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
            DISCOVERED: 'bg-blue-100 text-blue-800 border-blue-200',
          }[c.reviewStatus as string] || 'bg-slate-100 text-slate-800';

          return (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {c.software?.name || '未知软件'}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400">当前版本: {c.currentVersion || '无'}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                      新版: v{c.candidateVersion}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded border text-[11px] font-semibold ${statusBadge}`}>
                    {c.reviewStatus}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    发现于 {new Date(c.discoveredAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* 详情与更新日志 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-600 dark:text-slate-400 mb-3">
                <div>
                  <span className="text-slate-400">支持平台：</span>
                  {c.platform || '全平台'}
                </div>
                <div>
                  <span className="text-slate-400">官方来源：</span>
                  {c.source?.name || '自动监测通道'}
                </div>
                <div>
                  <span className="text-slate-400">来源地址：</span>
                  <a
                    href={c.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-0.5 truncate max-w-[200px]"
                  >
                    查看官方发行页 <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {c.changelog && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-slate-700 dark:text-slate-300 mb-3">
                  <div className="font-semibold text-slate-500 text-[11px] mb-1">官方更新日志摘要：</div>
                  <p className="line-clamp-3 leading-relaxed">{c.changelog}</p>
                </div>
              )}

              {/* 操作区 */}
              {c.reviewStatus === 'PENDING_REVIEW' && (
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleReview(c.id, 'APPROVE')}
                    disabled={processingId === c.id}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium flex items-center gap-1 shadow-sm"
                  >
                    {processingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    审核通过并公开发布
                  </button>
                  <button
                    onClick={() => handleReview(c.id, 'REJECT')}
                    disabled={processingId === c.id}
                    className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded text-xs font-medium flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> 驳回
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {candidates.length === 0 && !isLoading && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs">
            暂无匹配条件的版本候选记录
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
