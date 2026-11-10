import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface AdminOrder {
  id: string;
  orderNo: string;
  username: string;
  email: string;
  productName: string;
  productType: string;
  totalAmountFen: number;
  totalAmountYuan: string;
  status: string;
  payChannel?: string;
  transactionId?: string;
  createdAt: string;
  paidAt?: string;
}

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      let url = '/api/v1/admin/orders?limit=50';
      if (statusFilter !== 'ALL') {
        url += `&status=${statusFilter}`;
      }
      if (searchTerm.trim()) {
        url += `&orderNo=${encodeURIComponent(searchTerm.trim())}`;
      }

      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = '订单流水管理 - 软游部落管理后台';
    fetchOrders();
  }, [statusFilter]);

  const handleCloseOrder = async (orderNo: string) => {
    if (!window.confirm(`确定要强制关闭未支付订单 ${orderNo} 吗？`)) return;
    try {
      const res = await fetch(`/api/v1/admin/orders/${orderNo}/close`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      } else {
        alert(data.error?.message || '操作失败');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B132B] text-slate-900 dark:text-slate-100 p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* 顶部导航与操作栏 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#1769D2]" />
                <span>商业化订单与支付流水管理</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                实时查验全站充值、会员购买、单次授权流水与支付防篡改日志
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchOrders}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>刷新数据</span>
            </button>
            <Link
              to="/admin/refunds"
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>退款审核管理</span>
            </Link>
          </div>
        </div>

        {/* 搜索与过滤 */}
        <div className="bg-white dark:bg-[#141F33] p-4 rounded-xl border border-slate-200 dark:border-slate-800 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">状态筛选:</span>
            {['ALL', 'PAID', 'PENDING_PAYMENT', 'REFUNDED', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#1769D2] text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL'
                  ? '全部'
                  : st === 'PAID'
                  ? '已支付'
                  : st === 'PENDING_PAYMENT'
                  ? '待支付'
                  : st === 'REFUNDED'
                  ? '已退款'
                  : '已关闭'}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchOrders();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="精确搜索订单号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 w-56 focus:outline-none focus:border-[#1769D2]"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#1769D2] hover:bg-[#1258B5] text-white rounded-lg text-xs font-medium cursor-pointer"
            >
              查询
            </button>
          </form>
        </div>

        {/* 订单表格 */}
        <div className="bg-white dark:bg-[#141F33] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#1769D2] mb-2" />
              <p className="text-xs">加载订单记录中...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              未检索到符合条件的订单
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">订单号</th>
                    <th className="py-3 px-4 font-semibold">会员账号</th>
                    <th className="py-3 px-4 font-semibold">购买商品</th>
                    <th className="py-3 px-4 font-semibold">金额</th>
                    <th className="py-3 px-4 font-semibold">支付流水号</th>
                    <th className="py-3 px-4 font-semibold">状态</th>
                    <th className="py-3 px-4 font-semibold">下单时间</th>
                    <th className="py-3 px-4 font-semibold text-right">管理操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="py-3.5 px-4 font-mono font-medium">{o.orderNo}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold">{o.username}</div>
                        <div className="text-[11px] text-slate-400">{o.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium">{o.productName}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        ¥{o.totalAmountYuan}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                        {o.transactionId || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        {o.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>已付款生效</span>
                          </span>
                        ) : o.status === 'PENDING_PAYMENT' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded text-[11px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>待付款</span>
                          </span>
                        ) : o.status === 'REFUNDED' ? (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[11px] font-bold">
                            已退款
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[11px]">
                            已关闭
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 tabular-nums">
                        {new Date(o.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {o.status === 'PENDING_PAYMENT' && (
                          <button
                            onClick={() => handleCloseOrder(o.orderNo)}
                            className="text-red-500 hover:underline cursor-pointer"
                          >
                            关闭订单
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
      </div>
    </div>
  );
};
