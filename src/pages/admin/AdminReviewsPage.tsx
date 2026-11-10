import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  AlertTriangle,
  Flag,
  CheckCircle,
  XCircle,
  Trash2,
  Star,
  Eye,
  Filter,
} from 'lucide-react';
import { GrowthService } from '../../services/growthService';

export const AdminReviewsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'corrections' | 'reviews' | 'reports'>('corrections');

  // 评价状态
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewsTotal, setReviewsTotal] = useState(0);

  // 纠错反馈状态
  const [corrections, setCorrections] = useState<any[]>([]);
  const [correctionStatus, setCorrectionStatus] = useState('');

  // 举报状态
  const [reports, setReports] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCurrentTab();
  }, [activeTab, reviewStatus, correctionStatus]);

  const loadCurrentTab = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'reviews') {
        const res = await GrowthService.adminGetReviews(1, 30, reviewStatus || undefined);
        if (res.success && res.data) {
          setReviews(res.data.items || []);
          setReviewsTotal(res.data.total || 0);
        }
      } else if (activeTab === 'corrections') {
        const res = await GrowthService.adminGetCorrections(1, 30, correctionStatus || undefined);
        if (res.success && res.data) {
          setCorrections(res.data.items || []);
        }
      } else if (activeTab === 'reports') {
        const res = await fetch('/api/v1/admin/reports').then((r) => r.json());
        if (res.success && res.data) {
          setReports(res.data.items || []);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReviewStatus = async (id: string, status: string) => {
    try {
      const res = await GrowthService.adminUpdateReviewStatus(id, status);
      if (res.success) {
        loadCurrentTab();
      } else {
        alert(res.error || '操作失败');
      }
    } catch (err: any) {
      alert(err.message || '请求失败');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('确定彻底物理删除该评价吗？')) return;
    try {
      const res = await GrowthService.adminDeleteReview(id);
      if (res.success) {
        loadCurrentTab();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateCorrection = async (id: string, status: string) => {
    try {
      const res = await GrowthService.adminUpdateCorrectionStatus(id, status);
      if (res.success) {
        loadCurrentTab();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部标题与 Tab 切换 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            真实用户评价审核与纠错反馈中心
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            审核真实用户体验评测、受理失效外链报错纠错工单，并处置社区恶意举报。
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'reviews'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            用户评价审核
          </button>
          <button
            onClick={() => setActiveTab('corrections')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'corrections'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            资源报错纠错
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'reports'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            恶意评价举报
          </button>
        </div>
      </div>

      {/* Tab 1: 评价审核 */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">审核状态：</span>
            {['', 'APPROVED', 'PENDING_REVIEW', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setReviewStatus(st)}
                className={`px-3 py-1 rounded-md text-xs font-medium ${
                  reviewStatus === st ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === '' ? '全部' : st === 'APPROVED' ? '已通过' : st === 'PENDING_REVIEW' ? '待审核' : '已拒绝'}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="p-3.5 font-semibold">软件与用户</th>
                  <th className="p-3.5 font-semibold">评分</th>
                  <th className="p-3.5 font-semibold">评价标题与详细内容</th>
                  <th className="p-3.5 font-semibold">当前状态</th>
                  <th className="p-3.5 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      加载中...
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      暂无评价记录
                    </td>
                  </tr>
                ) : (
                  reviews.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {r.software?.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          用户：{r.user?.username || r.user?.email}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                          <span>{r.rating}</span>
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                        </div>
                      </td>
                      <td className="p-3.5 max-w-md">
                        <div className="font-bold text-slate-900 dark:text-white mb-1">
                          {r.title}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {r.content}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            r.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : r.status === 'PENDING_REVIEW'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          {r.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleUpdateReviewStatus(r.id, 'APPROVED')}
                              className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100"
                            >
                              通过
                            </button>
                          )}
                          {r.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleUpdateReviewStatus(r.id, 'REJECTED')}
                              className="px-2 py-1 rounded bg-amber-50 text-amber-700 font-semibold hover:bg-amber-100"
                            >
                              驳回
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReview(r.id)}
                            className="text-rose-600 hover:text-rose-700 p-1"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: 纠错反馈 */}
      {activeTab === 'corrections' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="p-3.5 font-semibold">报错软件</th>
                <th className="p-3.5 font-semibold">问题类型</th>
                <th className="p-3.5 font-semibold">问题详细描述</th>
                <th className="p-3.5 font-semibold">联系邮箱</th>
                <th className="p-3.5 font-semibold">状态</th>
                <th className="p-3.5 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    加载中...
                  </td>
                </tr>
              ) : corrections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    暂无纠错工单
                  </td>
                </tr>
              ) : (
                corrections.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                      {c.software?.name}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800">
                        {c.correctionType}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {c.details}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {c.contactEmail || '未留邮箱'}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${c.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {c.status === 'PENDING' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateCorrection(c.id, 'VERIFIED')}
                            className="px-2.5 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
                          >
                            已复核修正
                          </button>
                          <button
                            onClick={() => handleUpdateCorrection(c.id, 'REJECTED')}
                            className="px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                          >
                            忽略
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">已办结</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: 举报处理 */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="p-3.5 font-semibold">举报原因</th>
                <th className="p-3.5 font-semibold">举报人</th>
                <th className="p-3.5 font-semibold">被举报评价内容</th>
                <th className="p-3.5 font-semibold">状态</th>
                <th className="p-3.5 font-semibold">提交时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">加载中...</td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">暂无举报记录</td>
                </tr>
              ) : (
                reports.map((rep) => (
                  <tr key={rep.id}>
                    <td className="p-3.5 font-semibold text-rose-600">{rep.reason}</td>
                    <td className="p-3.5">{rep.reporter?.username || '用户'}</td>
                    <td className="p-3.5 max-w-sm text-slate-600 dark:text-slate-300">{rep.review?.content}</td>
                    <td className="p-3.5">{rep.status}</td>
                    <td className="p-3.5 text-slate-400">{new Date(rep.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
