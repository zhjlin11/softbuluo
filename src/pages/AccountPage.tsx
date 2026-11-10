import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Crown,
  User,
  Package,
  ShieldCheck,
  CreditCard,
  RotateCcw,
  Lock,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  Calendar,
  Sparkles,
  Bookmark,
} from 'lucide-react';
import {
  getMemberProfile,
  getMemberOrders,
  getMemberEntitlements,
  getMemberRefunds,
  logoutMember,
  changeMemberPassword,
  requestRefund,
} from '../services/commerceService';
import { BookmarkService, BookmarkItem } from '../services/bookmarkService';
import {
  MemberProfile,
  OrderItem,
  EntitlementItem,
  RefundItem,
} from '../types/commerce';
import { AuthModal } from '../components/auth/AuthModal';

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();

  const [member, setMember] = useState<MemberProfile | null>(null);
  const [isVip, setIsVip] = useState<boolean>(false);
  const [vipExpiresAt, setVipExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'entitlements' | 'refunds' | 'bookmarks' | 'security'>('orders');

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [entitlements, setEntitlements] = useState<EntitlementItem[]>([]);
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  // 密码修改表单状态
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 退款弹窗状态
  const [refundTargetOrder, setRefundTargetOrder] = useState<OrderItem | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const profile = await getMemberProfile();
      setMember(profile.member);
      setIsVip(profile.isVip);
      setVipExpiresAt(profile.vipExpiresAt);

      const [ordersData, entitlementsData, refundsData, bookmarksData] = await Promise.all([
        getMemberOrders().catch(() => []),
        getMemberEntitlements().catch(() => []),
        getMemberRefunds().catch(() => []),
        BookmarkService.listBookmarks(1, 50).catch(() => ({ success: false, data: { items: [] } })),
      ]);

      setOrders(ordersData);
      setEntitlements(entitlementsData);
      setRefunds(refundsData);
      setBookmarks(bookmarksData.data?.items || []);
    } catch (err) {
      setMember(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBookmark = async (bookmarkId: string) => {
    try {
      const res = await BookmarkService.removeBookmark(bookmarkId);
      if (res.success) {
        setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      } else {
        alert(res.message || '取消收藏失败');
      }
    } catch {
      alert('取消收藏失败');
    }
  };

  useEffect(() => {
    document.title = '个人中心与权益管理 - 软游部落';
    loadData();
  }, []);

  const handleLogout = async () => {
    await logoutMember();
    setMember(null);
    setIsVip(false);
    navigate('/');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    setIsChangingPassword(true);
    try {
      const res = await changeMemberPassword({ oldPassword, newPassword });
      setPasswordMsg({ type: 'success', text: res.message });
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || '密码修改失败' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleApplyRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTargetOrder) return;
    setRefundError(null);
    setIsSubmittingRefund(true);
    try {
      await requestRefund(refundTargetOrder.orderNo, refundReason);
      setRefundTargetOrder(null);
      setRefundReason('');
      await loadData();
      setActiveTab('refunds');
    } catch (err: any) {
      setRefundError(err.message || '退款申请提交失败');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-24 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#1769D2] mb-3" />
        <p className="text-xs">加载会员账户信息中...</p>
      </div>
    );
  }

  // 未登录状态展示
  if (!member) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto p-8 bg-white dark:bg-[#141F33] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
            尚未登录会员账号
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            登录后即可查看您的 VIP 会员有效期、下载授权记录与订单流水。
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full py-2.5 bg-[#1769D2] hover:bg-[#1258B5] text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            立即登录 / 注册账号
          </button>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={loadData}
        />
      </div>
    );
  }

  const daysRemaining = vipExpiresAt
    ? Math.max(0, Math.ceil((new Date(vipExpiresAt).getTime() - Date.now()) / (24 * 3600 * 1000)))
    : 0;

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20">
      {/* 顶部账户身份卡片 */}
      <div className="bg-white dark:bg-[#141F33] rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 mb-6 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-[#1769D2]/30 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xl shrink-0">
              {member.username.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  {member.username}
                </h1>
                {isVip ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[11px] font-bold rounded-full shadow-2xs">
                    <Crown className="w-3 h-3 fill-white" />
                    <span>VIP 尊享会员</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] rounded font-medium">
                    普通注册用户
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                <span>绑定邮箱: {member.email}</span>
                <span>·</span>
                <span>注册时间: {new Date(member.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <Link
              to="/membership"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1769D2] hover:bg-[#1258B5] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>{isVip ? '顺延续费 VIP' : '升级尊享 VIP'}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>退出登录</span>
            </button>
          </div>
        </div>

        {/* VIP 状态专区栏 */}
        {isVip && vipExpiresAt && (
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>
                尊享 VIP 权益有效至：
                <strong className="font-mono ml-1 text-slate-900 dark:text-slate-100 font-bold">
                  {new Date(vipExpiresAt).toLocaleString()}
                </strong>
                （剩余约 {daysRemaining} 天）
              </span>
            </div>
            <div className="text-slate-400 text-[11px]">
              享有：全站托管高速直连 · 纯净安全保障 · 专属技术支持
            </div>
          </div>
        )}
      </div>

      {/* 主选项卡导航 */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'orders'
              ? 'border-[#1769D2] text-[#1769D2]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>我的订单 ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('entitlements')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'entitlements'
              ? 'border-[#1769D2] text-[#1769D2]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>专属权益明细 ({entitlements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('refunds')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'refunds'
              ? 'border-[#1769D2] text-[#1769D2]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>退款记录 ({refunds.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'bookmarks'
              ? 'border-[#1769D2] text-[#1769D2]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>我的收藏 ({bookmarks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'security'
              ? 'border-[#1769D2] text-[#1769D2]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>密码安全设置</span>
        </button>
      </div>

      {/* 选项卡内容区 */}
      {/* 1. 订单列表 */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-[#141F33] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          {orders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>暂无任何订单记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">订单号</th>
                    <th className="py-3 px-4 font-semibold">购买项目</th>
                    <th className="py-3 px-4 font-semibold">实付金额</th>
                    <th className="py-3 px-4 font-semibold">下单时间</th>
                    <th className="py-3 px-4 font-semibold">订单状态</th>
                    <th className="py-3 px-4 font-semibold text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="py-3.5 px-4 font-mono font-medium">{o.orderNo}</td>
                      <td className="py-3.5 px-4 font-semibold">{o.productName}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        ¥{o.totalAmountYuan}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 tabular-nums">
                        {new Date(o.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {o.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>已支付生效</span>
                          </span>
                        ) : o.status === 'PENDING_PAYMENT' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded text-[11px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>待支付</span>
                          </span>
                        ) : o.status === 'REFUND_PENDING' ? (
                          <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded text-[11px] font-bold">
                            退款审核中
                          </span>
                        ) : o.status === 'REFUNDED' ? (
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[11px] font-medium">
                            已原路退款
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded text-[11px]">
                            已取消/关闭
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {o.status === 'PENDING_PAYMENT' && (
                          <Link
                            to={`/checkout/${o.orderNo}`}
                            className="inline-flex items-center gap-1 text-[#1769D2] hover:underline font-bold"
                          >
                            <span>去付款</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                        {o.status === 'PAID' && (
                          <button
                            onClick={() => {
                              setRefundTargetOrder(o);
                              setRefundReason('');
                              setRefundError(null);
                            }}
                            className="text-slate-500 hover:text-red-500 hover:underline cursor-pointer"
                          >
                            申请退款
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
      )}

      {/* 2. 权益明细 */}
      {activeTab === 'entitlements' && (
        <div className="bg-white dark:bg-[#141F33] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          {entitlements.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>暂无有效专属权益，选购套餐后自动发放</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {entitlements.map((item) => (
                <div key={item.id} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {item.product?.name || item.entitlementType}
                      </span>
                      {item.status === 'ACTIVE' ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold">
                          生效中
                        </span>
                      ) : item.status === 'REVOKED' ? (
                        <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold">
                          已撤销/已退款
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px]">
                          已过期
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {item.entitlementType === 'MEMBERSHIP_ACCESS'
                        ? '全站所有资源免限速直达下载通道与 VIP 专属指导服务'
                        : `单次专属下载/排错指导额度 (剩余: ${item.quotaRemaining} 次)`}
                    </div>
                  </div>
                  <div className="text-right text-slate-500 tabular-nums">
                    <div>生效时间: {new Date(item.startsAt).toLocaleDateString()}</div>
                    <div className="text-[11px] text-slate-400">
                      截止时间: {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : '永久有效/直至消耗'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. 退款记录 */}
      {activeTab === 'refunds' && (
        <div className="bg-white dark:bg-[#141F33] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          {refunds.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>暂无任何退款记录</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {refunds.map((r) => (
                <div key={r.id} className="p-4 sm:p-5 text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      退款单号: <span className="font-mono">{r.refundNo}</span>（关联订单: {r.orderNo}）
                    </div>
                    <div>
                      {r.status === 'PENDING_REVIEW' ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[11px] font-bold">
                          等待人工审核
                        </span>
                      ) : r.status === 'SUCCESS' ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[11px] font-bold">
                          已全额退回
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[11px] font-bold">
                          已驳回
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    退款金额: <strong>¥{r.amountYuan}</strong> · 原因: {r.reason}
                  </div>
                  {r.rejectReason && (
                    <div className="text-red-500 text-[11px]">
                      驳回原因: {r.rejectReason}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400">
                    申请时间: {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. 安全密码修改 */}
      {activeTab === 'security' && (
        <div className="max-w-md bg-white dark:bg-[#141F33] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
            修改登录密码
          </h2>

          {passwordMsg && (
            <div
              className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}
            >
              {passwordMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
                当前旧密码
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入当前密码"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1769D2]"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
                新密码 (至少8位字符，含字母与数字)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1769D2]"
              />
            </div>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full py-2.5 bg-[#1769D2] hover:bg-[#1258B5] text-white font-bold rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isChangingPassword ? '正在修改...' : '确认更新密码'}
            </button>
          </form>
        </div>
      )}

      {/* 5. 我的收藏选项卡 */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-4">
          {bookmarks.length === 0 ? (
            <div className="bg-white dark:bg-[#141F33] rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
              <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#1769D2]" />
              <p className="text-sm font-semibold mb-1 text-slate-800 dark:text-slate-200">暂无收藏的软件资源</p>
              <p className="text-xs text-slate-500 mb-4">
                在软件详情页点击“收藏”按钮，方便在此快捷查找与使用
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1769D2] hover:bg-[#1258B5] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
              >
                <span>发现优秀软件</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookmarks.map((b) => {
                const sw = b.software;
                return (
                  <div
                    key={b.id}
                    className="bg-white dark:bg-[#141F33] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-[#1769D2] font-bold text-xs shrink-0">
                            {sw?.name?.slice(0, 2) || '软'}
                          </div>
                          <div>
                            <Link
                              to={`/software/${sw?.slug || b.targetId}`}
                              className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-[#1769D2] transition-colors"
                            >
                              {sw?.name || '未知软件'}
                            </Link>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {sw?.category?.name || '实用软件'} · {sw?.developer || '官方开发者'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveBookmark(b.id)}
                          className="text-[11px] text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 px-2 py-1 rounded transition-colors cursor-pointer"
                        >
                          取消收藏
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {sw?.summary || '点击进入详情档案查看完整版本与官方下载渠道'}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>收藏于 {new Date(b.createdAt).toLocaleDateString()}</span>
                      <Link
                        to={`/software/${sw?.slug || b.targetId}`}
                        className="text-[#1769D2] hover:underline flex items-center gap-0.5 font-medium"
                      >
                        <span>查看详情</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 退款申请弹窗 */}
      {refundTargetOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#141F33] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              申请订单退款
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              订单号: {refundTargetOrder.orderNo} · 金额: ¥{refundTargetOrder.totalAmountYuan}
            </p>

            {refundError && (
              <div className="mb-4 p-2.5 bg-red-50 text-red-600 rounded text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{refundError}</span>
              </div>
            )}

            <form onSubmit={handleApplyRefund} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  退款详细原因说明 (至少3个字)
                </label>
                <textarea
                  required
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="例如：系统环境不匹配无法使用、重复购买等"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1769D2]"
                />
              </div>
              <div className="text-[11px] text-slate-400">
                审核通过后，款项将在 1-2 个工作日内全额原路退回付款微信渠道，已发放的关联权益将同步收回。
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setRefundTargetOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRefund}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isSubmittingRefund ? '正在提交...' : '提交退款申请'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
