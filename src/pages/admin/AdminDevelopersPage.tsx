import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Globe,
  Github,
  Loader2,
  Filter
} from 'lucide-react';

export const AdminDevelopersPage: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = () => {
    setIsLoading(true);
    fetch(`/api/v1/admin/developer/profiles${statusFilter ? `?status=${statusFilter}` : ''}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setProfiles(json.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleReview = async (id: string, name: string, status: string) => {
    const notes = prompt(`请输入审核备注 (${status}):`, status === 'VERIFIED' ? '官方项目与网站信息核验通过' : '提供的主页信息不完备');
    if (notes === null) return;

    try {
      const res = await fetch(`/api/v1/admin/developer/profiles/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes: notes }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback(`开发者 "${name}" 审核状态已更新为: ${status}`);
        loadData();
      } else {
        alert(json.error?.message || '操作失败');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <AdminLayout title="开发者认证与资质审核">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">开发者认证与资质审核</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            审核软件作者入驻申请，严格核验官方项目归属，防止假冒侵权
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">全部审核状态</option>
          <option value="PENDING_REVIEW">待审核 (PENDING_REVIEW)</option>
          <option value="VERIFIED">已认证 (VERIFIED)</option>
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
          <span>申请入驻列表</span>
          <span className="text-slate-400 font-mono text-[11px]">{profiles.length} 个主体</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
              <span>加载审核列表中...</span>
            </div>
          ) : profiles.length === 0 ? (
            <div className="p-12 text-center text-slate-400">当前没有符合筛选的开发者申请</div>
          ) : (
            profiles.map((p) => (
              <div key={p.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{p.displayName}</span>
                    <span className="text-slate-400 font-mono text-[11px]">(/developers/{p.slug})</span>
                    {p.verificationStatus === 'VERIFIED' ? (
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded text-[11px] font-semibold">
                        已认证
                      </span>
                    ) : p.verificationStatus === 'PENDING_REVIEW' ? (
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded text-[11px] font-semibold">
                        待终审
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded text-[11px]">
                        已驳回
                      </span>
                    )}
                  </div>

                  <div className="text-slate-500 text-[11px]">
                    关联会员: {p.member?.username} ({p.member?.email}) · 组织: {p.organizationName || '个人'}
                  </div>

                  <div className="flex items-center gap-4 text-[11px]">
                    {p.website && (
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        <span>官网: {p.website}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {p.githubUsername && (
                      <span className="text-slate-600 dark:text-slate-300 inline-flex items-center gap-1">
                        <Github className="w-3 h-3" />
                        <span>GitHub: @{p.githubUsername}</span>
                      </span>
                    )}
                  </div>

                  {p.bio && <p className="text-slate-600 dark:text-slate-300 text-xs italic">{p.bio}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {p.verificationStatus !== 'VERIFIED' && (
                    <button
                      onClick={() => handleReview(p.id, p.displayName, 'VERIFIED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      通过认证
                    </button>
                  )}
                  {p.verificationStatus !== 'REJECTED' && (
                    <button
                      onClick={() => handleReview(p.id, p.displayName, 'REJECTED')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      驳回申请
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
