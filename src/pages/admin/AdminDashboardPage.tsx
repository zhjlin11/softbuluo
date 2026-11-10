import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  FileEdit,
  Clock,
  AlertTriangle,
  Eye,
  MousePointerClick,
  Plus,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Crown,
  Users,
  RotateCcw,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminGetStatistics } from '../../services/resourceService';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [commerceStats, setCommerceStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [res, comRes] = await Promise.all([
        adminGetStatistics(),
        fetch('/api/v1/admin/commerce/stats', { credentials: 'include' }).then((r) => r.json()).catch(() => null),
      ]);
      if (res.success) {
        setData(res.data);
      }
      if (comRes && comRes.success) {
        setCommerceStats(comRes.data);
      }
    } catch (err) {
      console.error('获取后台统计失败', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const metrics = data?.metrics || {
    publishedCount: 0,
    draftCount: 0,
    pendingReviewCount: 0,
    failedSourcesCount: 0,
    recentUpdatesCount: 0,
    totalViews: 0,
    officialClicksCount: 0,
  };

  const statCards = [
    { label: '商业化累计营收', value: `¥${commerceStats?.totalRevenueYuan || '0.00'}`, icon: CreditCard, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
    { label: '注册前台会员', value: commerceStats?.totalMembers || 0, icon: Users, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' },
    { label: '当前生效 VIP 数', value: commerceStats?.activeVipsCount || 0, icon: Crown, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
    { label: '待处理退款申请', value: commerceStats?.pendingRefundsCount || 0, icon: RotateCcw, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
    { label: '已正式发布资源', value: metrics.publishedCount, icon: Package, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
    { label: '待审核资源', value: metrics.pendingReviewCount, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
    { label: '草稿箱数量', value: metrics.draftCount, icon: FileEdit, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
    { label: '失效/待检下载源', value: metrics.failedSourcesCount, icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' },
    { label: '全站真实访问量', value: metrics.totalViews, icon: Eye, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
    { label: '官方外链累计点击', value: metrics.officialClicksCount, icon: MousePointerClick, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800' },
  ];

  return (
    <AdminLayout title="平台运营仪表盘">
      {/* 快捷操作条 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            软游部落 · 运营数据总览
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            所有指标均由 PostgreSQL 真实数据库聚合运算，拒绝虚假刷量与假订单数据。
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>刷新数据</span>
          </button>
          <Link
            to="/admin/resources"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>发布 / 录入新软件</span>
          </Link>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tabular-nums">
                {card.value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* 快捷通道与最近操作审计日志 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧：审核工作流快捷提示 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>资源合规审核流程指南</span>
          </h3>
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-slate-200 block mb-1">
                1. DRAFT (草稿)
              </span>
              录入基本信息、版本号与官方下载源，未提交前对前台不可见。
            </div>
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
              <span className="font-semibold block mb-1">
                2. PENDING_REVIEW (待审核)
              </span>
              由编辑人员提交，需审核官方链接有效性与授权范围。
            </div>
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200">
              <span className="font-semibold block mb-1">
                3. PUBLISHED (已发布)
              </span>
              审核通过后自动收录至首页、搜索索引与动态 Sitemap 中。
            </div>
          </div>
        </div>

        {/* 右侧：真实审计日志 */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              最近后台操作审计日志
            </h3>
            <span className="text-xs text-slate-400">保留关键安全追溯凭证</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-y border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">操作动作</th>
                  <th className="py-2.5 px-3">操作人员</th>
                  <th className="py-2.5 px-3">目标类型</th>
                  <th className="py-2.5 px-3">操作时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {data?.recentAuditLogs?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      暂无审计日志
                    </td>
                  </tr>
                ) : (
                  data?.recentAuditLogs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-medium text-blue-600 dark:text-blue-400">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{log.actorName}</span>
                        <span className="ml-1 text-[10px] text-slate-400 font-mono">({log.actorRole})</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {log.targetType}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 tabular-nums">
                        {new Date(log.createdAt).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
