import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Search,
  Eye,
  Users,
  Download,
  AlertCircle,
  Globe,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Database,
  FileCheck,
} from 'lucide-react';
import { GrowthService } from '../../services/growthService';

export const AdminAnalyticsPage: React.FC = () => {
  const [traffic, setTraffic] = useState<any>(null);
  const [searchAnalytics, setSearchAnalytics] = useState<any>(null);
  const [governance, setGovernance] = useState<any>(null);
  const [searchConsoles, setSearchConsoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tRes, sRes, gRes, scRes] = await Promise.all([
        GrowthService.adminGetTrafficOverview(),
        GrowthService.adminGetSearchAnalytics(),
        GrowthService.adminGetGovernanceMetrics(),
        GrowthService.adminGetSearchConsoles(),
      ]);

      if (tRes.success) setTraffic(tRes.data);
      if (sRes.success) setSearchAnalytics(sRes.data);
      if (gRes.success) setGovernance(gRes.data);
      if (scRes.success) setSearchConsoles(scRes.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/v1/admin/governance/audit-all', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setGovernance(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            站点数据治理、搜索流量与业务增长大盘
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            严谨监控资源库真实性、官方渠道有效率、站内搜索意图、零命中词及站长平台授权状态。
          </p>
        </div>
        <button
          onClick={handleTriggerAudit}
          disabled={isAuditing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
          {isAuditing ? '正在全量审计...' : '重新审计数据完整性'}
        </button>
      </div>

      {/* P5 资源真实性与数据治理指标卡片 */}
      {governance && (
        <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-md border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold tracking-wide">P5 真实软件库与数据完整性治理看板</h2>
            </div>
            <span className="text-[11px] text-slate-400">
              总资源: {governance.totalResources} 款 (已发布 {governance.publishedCount} / 待审草稿 {governance.draftCount})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-[11px] text-slate-400">资料完整率</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">{governance.completenessRate}%</div>
              <span className="text-[10px] text-slate-400">要素齐全: {governance.verifiedCompleteCount} 款</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-[11px] text-slate-400">官方来源核验率</span>
              <div className="text-xl font-bold text-blue-400 mt-1">{governance.sourceVerificationRate}%</div>
              <span className="text-[10px] text-slate-400">经官方域名校验</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-[11px] text-slate-400">下载链接有效率</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">{governance.linkHealthRate}%</div>
              <span className="text-[10px] text-slate-400">官方直接渠道</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-[11px] text-slate-400">待审核草稿队列</span>
              <div className="text-xl font-bold text-amber-400 mt-1">{governance.pendingAuditCount} 款</div>
              <span className="text-[10px] text-slate-400">杜绝自动直接发布</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-[11px] text-slate-400">异常/失效监控</span>
              <div className="text-xl font-bold text-rose-400 mt-1">{governance.anomalyCount} 项</div>
              <span className="text-[10px] text-slate-400">含测试数据与4xx源</span>
            </div>
          </div>
        </div>
      )}

      {/* 流量与业务核心指标 */}
      {traffic && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">今日独立访客 (UV)</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {traffic.traffic?.todayUv || 0}
            </div>
            <span className="text-[11px] text-slate-400">基于加密客户端指纹</span>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">今日页面浏览 (PV)</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {traffic.traffic?.todayPv || 0}
            </div>
            <span className="text-[11px] text-slate-400">历史累计: {traffic.traffic?.totalPv || 0}</span>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">站内搜索请求数</span>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {traffic.searchMetrics?.totalSearches || 0}
            </div>
            <span className="text-[11px] text-amber-600 font-medium">
              无结果率: {traffic.searchMetrics?.zeroResultRate || '0%'}
            </span>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">商业转化活跃数</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {traffic.businessGrowth?.totalOrders || 0} 单
            </div>
            <span className="text-[11px] text-slate-400">
              下载点击: {traffic.businessGrowth?.totalDownloads || 0} 次
            </span>
          </div>
        </div>
      )}

      {/* 搜索意图与零命中词分析 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 热门搜索意图 */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-blue-600" />
            站内高频搜索词与意图分布
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                  <th className="pb-2 font-medium">搜索词</th>
                  <th className="pb-2 font-medium">请求次数</th>
                  <th className="pb-2 font-medium">平均命中数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {searchAnalytics?.topQueries && searchAnalytics.topQueries.length > 0 ? (
                  searchAnalytics.topQueries.map((q: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">{q.query}</td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400">{q.count} 次</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${q.avgResults > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-600'}`}>
                          {q.avgResults} 条
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">暂无搜索日志记录</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 零结果词与内容缺口（指导内容拓增） */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              未命中搜索词（内容待办与收录机会）
            </h2>
            <span className="text-[11px] text-slate-400">指导收录真资源</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                  <th className="pb-2 font-medium">未命中搜索词</th>
                  <th className="pb-2 font-medium">搜索次数</th>
                  <th className="pb-2 font-medium">官方来源核查建议</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {searchAnalytics?.zeroHitQueries && searchAnalytics.zeroHitQueries.length > 0 ? (
                  searchAnalytics.zeroHitQueries.map((zq: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 font-medium text-rose-600 dark:text-rose-400">{zq.query}</td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400">{zq.count} 次</td>
                      <td className="py-2.5 text-slate-500 text-[11px]">
                        核实是否存在合法官方源，严禁机械批量生成假资源
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">当前没有未命中的搜索词</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 站长平台真实验证状态 (P5 严谨真实性治理) */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-blue-600" />
          主流站长搜索平台收录与授权接入状态
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {searchConsoles.length > 0 ? (
            searchConsoles.map((sc: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>{sc.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      sc.status === 'CONNECTED'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {sc.status === 'CONNECTED' ? '已授权连接' : '未授权接入'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 space-y-1">
                    {sc.features?.map((f: string, i: number) => (
                      <div key={i} className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-slate-400" /> {f}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/50">
                  <span className="text-[10px] text-slate-400 block">
                    {sc.syncFailureReason || `最近同步: ${new Date(sc.lastSyncAt).toLocaleString()}`}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-4 text-slate-400">正在获取站长平台授权状态...</div>
          )}
        </div>
      </div>

      {/* P6 开放生态、开发者入驻与社区治理监控 */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          开发者入驻、社区交流与开放 API 生态治理大盘
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[11px] block">已认证开发者</span>
            <span className="text-lg font-bold text-slate-800 dark:text-slate-200 font-mono mt-1 block">
              {governance?.developerCount ?? 0}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[11px] block">待审软件认领</span>
            <span className="text-lg font-bold text-indigo-600 font-mono mt-1 block">
              {governance?.pendingClaimsCount ?? 0}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[11px] block">社区活跃讨论</span>
            <span className="text-lg font-bold text-blue-600 font-mono mt-1 block">
              {governance?.activeThreadsCount ?? 0}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[11px] block">待处理举报</span>
            <span className="text-lg font-bold text-rose-600 font-mono mt-1 block">
              {governance?.pendingReportsCount ?? 0}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[11px] block">开放 API 调用</span>
            <span className="text-lg font-bold text-purple-600 font-mono mt-1 block">
              {governance?.apiCallsCount?.toLocaleString() ?? 0}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 text-[11px] block">PWA 客户端部署</span>
            <span className="text-xs font-semibold text-emerald-600 block mt-2">
              ✓ SW / 离线就绪
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
