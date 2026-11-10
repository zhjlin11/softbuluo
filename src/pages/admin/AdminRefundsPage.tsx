import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';

interface AdminRefund {
  id: string;
  refundNo: string;
  orderNo: string;
  productName: string;
  username: string;
  email: string;
  amountFen: number;
  amountYuan: string;
  reason: string;
  status: string;
  rejectReason?: string;
  processedAt?: string;
  createdAt: string;
}

export const AdminRefundsPage: React.FC = () => {
  const [refunds, setRefunds] = useState<AdminRefund[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reviewModalTarget, setReviewModalTarget] = useState<AdminRefund | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchRefunds = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/refunds', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setRefunds(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = '退款审核与争议处理 - 软游部落管理后台';
    fetchRefunds();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalTarget) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/admin/refunds/${reviewModalTarget.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: reviewAction,
          rejectReason: reviewAction === 'REJECT' ? rejectReason : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewModalTarget(null);
        setRejectReason('');
        await fetchRefunds();
      } else {
        alert(data.error?.message || '审核失败');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B132B] text-slate-900 dark:text-slate-100 p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/orders"
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-600" />
                <span>退款申请审核与争议中心</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                人工处理会员发起的退款申请，通过后将自动收回已发放权益并执行原路退款
              </p>
            </div>
          </div>

          <button
            onClick={fetchRefunds}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>刷新申请列表</span>
          </button>
        </div>

        {/* 退款列表 */}
        <div className="bg-white dark:bg-[#141F33] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600 mb-2" />
              <p className="text-xs">加载退款工单中...</p>
            </div>
          ) : refunds.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              目前没有待处理或历史退款申请
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">退款单号</th>
                    <th className="py-3 px-4 font-semibold">关联订单</th>
                    <th className="py-3 px-4 font-semibold">用户</th>
                    <th className="py-3 px-4 font-semibold">退款金额</th>
                    <th className="py-3 px-4 font-semibold">用户说明原因</th>
                    <th className="py-3 px-4 font-semibold">状态</th>
                    <th className="py-3 px-4 font-semibold">申请时间</th>
                    <th className="py-3 px-4 font-semibold text-right">审核操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {refunds.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="py-3.5 px-4 font-mono font-medium">{r.refundNo}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono">{r.orderNo}</div>
                        <div className="text-[11px] text-slate-400">{r.productName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold">{r.username}</div>
                        <div className="text-[11px] text-slate-400">{r.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        ¥{r.amountYuan}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate" title={r.reason}>
                        {r.reason}
                      </td>
                      <td className="py-3.5 px-4">
                        {r.status === 'PENDING_REVIEW' ? (
                          <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded text-[11px] font-bold">
                            待人工审核
                          </span>
                        ) : r.status === 'SUCCESS' ? (
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded text-[11px] font-bold">
                            已退款成功
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[11px] font-bold">
                            已驳回拒绝
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 tabular-nums">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {r.status === 'PENDING_REVIEW' && (
                          <button
                            onClick={() => {
                              setReviewModalTarget(r);
                              setReviewAction('APPROVE');
                              setRejectReason('');
                            }}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded text-xs cursor-pointer shadow-2xs"
                          >
                            审核处理
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 审核弹窗 */}
        {reviewModalTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-[#141F33] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                退款工单审核
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                单号: {reviewModalTarget.refundNo} · 申请退款金额: ¥{reviewModalTarget.amountYuan}
              </p>

              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg text-xs mb-4 text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-slate-100">用户退款理由:</span> {reviewModalTarget.reason}
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">
                    审核决议
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="reviewAction"
                        checked={reviewAction === 'APPROVE'}
                        onChange={() => setReviewAction('APPROVE')}
                      />
                      <span className="text-emerald-600 font-bold">同意全额退款并收回权益</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="reviewAction"
                        checked={reviewAction === 'REJECT'}
                        onChange={() => setReviewAction('REJECT')}
                      />
                      <span className="text-red-500 font-bold">驳回申请</span>
                    </label>
                  </div>
                </div>

                {reviewAction === 'REJECT' && (
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      驳回原因告知
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="请说明驳回原因，将展示给用户"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewModalTarget(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? '正在提交...' : '确认审核结论'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
