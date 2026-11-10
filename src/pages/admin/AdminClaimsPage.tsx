import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ShieldCheck, CheckCircle2, XCircle, Clock, ExternalLink, Loader2 } from 'lucide-react';

export const AdminClaimsPage: React.FC = () => {
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadClaims = () => {
    setIsLoading(true);
    fetch(`/api/v1/admin/developer/claims${statusFilter ? `?status=${statusFilter}` : ''}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setClaims(json.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadClaims();
  }, [statusFilter]);

  const handleReview = async (id: string, swName: string, status: string) => {
    let reason = null;
    if (status === 'REJECTED') {
      reason = prompt('请输入驳回原因:', 'DNS 记录未检测到或项目控制权凭证不符');
      if (!reason) return;
    } else {
      if (!confirm(`确认核准软件 "${swName}" 的所有权认领？`)) return;
    }

    try {
      const res = await fetch(`/api/v1/admin/developer/claims/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback(`软件 "${swName}" 的认领状态已更新为: ${status}`);
        loadClaims();
      } else {
        alert(json.error?.message || '操作失败');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <AdminLayout title="软件所有权认领审核">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">软件所有权认领审核</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            人工核验开发者提交的 DNS TXT、根目录挑战文件与官方 GitHub 项目控制权凭证
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">全部认领状态</option>
          <option value="PENDING">待核验 (PENDING)</option>
          <option value="VERIFIED">已核准认领 (VERIFIED)</option>
          <option value="REJECTED">已驳回 (REJECTED)</option>
        </select>
      </div>

      {feedback && (
        <div className="p-3 mb-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)}>×</button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>软件认领记录</span>
          <span className="text-slate-400 font-mono text-[11px]">{claims.length} 笔申请</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
              <span>加载认领申请中...</span>
            </div>
          ) : claims.length === 0 ? (
            <div className="p-12 text-center text-slate-400">暂无软件认领申请记录</div>
          ) : (
            claims.map((c) => (
              <div key={c.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      认领软件: {c.software?.name}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">({c.software?.slug})</span>
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded text-[11px]">
                      认领方式: {c.claimMethod}
                    </span>
                    {c.status === 'VERIFIED' ? (
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded text-[11px] font-semibold">
                        已核准认领
                      </span>
                    ) : c.status === 'PENDING' ? (
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded text-[11px] font-semibold">
                        待人工核验
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded text-[11px]">
                        已驳回
                      </span>
                    )}
                  </div>

                  <div className="text-slate-500 text-[11px]">
                    申请开发者: {c.developer?.displayName} ({c.developer?.member?.username}) · 组织:{' '}
                    {c.developer?.organizationName || '个人'}
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 font-mono text-[11px] space-y-0.5">
                    <div>挑战随机码: {c.challengeCode}</div>
                    <div>验证说明: {c.verificationTarget}</div>
                    {c.evidenceUrl && (
                      <div className="text-blue-600 truncate">
                        提交证据: <a href={c.evidenceUrl} target="_blank" rel="noreferrer" className="underline">{c.evidenceUrl}</a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {c.status !== 'VERIFIED' && (
                    <button
                      onClick={() => handleReview(c.id, c.software?.name, 'VERIFIED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      核准认领
                    </button>
                  )}
                  {c.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleReview(c.id, c.software?.name, 'REJECTED')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      驳回认领
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
