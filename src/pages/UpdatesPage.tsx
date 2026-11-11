import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  History,
  ChevronRight,
  Clock,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  fetchUpdatesChannelData,
  UpdatesChannelData,
  UpdatesQueryParams,
} from '../services/updatesService';
import { UpdatesHero } from '../components/updates/UpdatesHero';
import { UpdatesFilterBar } from '../components/updates/UpdatesFilterBar';
import { UpdatesTimeline } from '../components/updates/UpdatesTimeline';
import { UpdatesRecentlyAdded } from '../components/updates/UpdatesRecentlyAdded';
import { UpdatesSidebar } from '../components/updates/UpdatesSidebar';
import { UpdatesVersionHistoryModal } from '../components/updates/UpdatesVersionHistoryModal';

export const UpdatesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // 状态管理
  const [data, setData] = useState<UpdatesChannelData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 历史版本弹窗控制
  const [historySoftwareId, setHistorySoftwareId] = useState<string | null>(null);

  // 从 URL 参数解析当前筛选器
  const timeRange = (searchParams.get('timeRange') as any) || 'all';
  const resourceType = (searchParams.get('resourceType') as any) || 'ALL';
  const categoryId = searchParams.get('categoryId') || undefined;
  const keyword = searchParams.get('keyword') || '';
  const sort = (searchParams.get('sort') as any) || 'latest_release';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const filters: UpdatesQueryParams = {
    timeRange,
    resourceType,
    categoryId,
    keyword,
    sort,
    page,
    limit: 15,
  };

  // 设置页面 SEO 标题与 Meta 信息
  useEffect(() => {
    document.title = '软件与游戏最新版本更新中心 - 官方更新日志与发布动态 - 软游部落';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        '软游部落最新更新频道严格以官方真实发版日期（releaseDate）为基准，收录正版软件与系统工具的最新版本更新日志、版本演进差异与原厂安全下载渠道。'
      );
    }
  }, []);

  // 加载数据
  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);

    fetchUpdatesChannelData(filters)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error('加载最新更新频道数据失败:', err);
        setError('无法加载版本更新数据，请检查网络或稍后重试。');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [timeRange, resourceType, categoryId, keyword, sort, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 更新筛选参数并同步到 URL
  const handleFilterChange = (newFilters: Partial<UpdatesQueryParams>) => {
    const nextParams = new URLSearchParams(searchParams);

    if (newFilters.timeRange !== undefined) {
      if (newFilters.timeRange === 'all') nextParams.delete('timeRange');
      else nextParams.set('timeRange', newFilters.timeRange);
    }

    if (newFilters.resourceType !== undefined) {
      if (newFilters.resourceType === 'ALL') nextParams.delete('resourceType');
      else nextParams.set('resourceType', newFilters.resourceType);
    }

    if (newFilters.categoryId !== undefined) {
      if (!newFilters.categoryId) nextParams.delete('categoryId');
      else nextParams.set('categoryId', newFilters.categoryId);
    }

    if (newFilters.keyword !== undefined) {
      if (!newFilters.keyword.trim()) nextParams.delete('keyword');
      else nextParams.set('keyword', newFilters.keyword.trim());
    }

    if (newFilters.sort !== undefined) {
      if (newFilters.sort === 'latest_release') nextParams.delete('sort');
      else nextParams.set('sort', newFilters.sort);
    }

    if (newFilters.page !== undefined) {
      if (newFilters.page === 1) nextParams.delete('page');
      else nextParams.set('page', String(newFilters.page));
    }

    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage: number) => {
    handleFilterChange({ page: newPage });
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 py-6 px-4 sm:px-6">
      <div className="max-w-[1320px] mx-auto">
        {/* 面包屑导航 */}
        <nav aria-label="面包屑" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-5">
          <Link to="/" className="hover:text-[#1769D2] transition-colors">
            首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 dark:text-slate-100 font-semibold">最新更新</span>
        </nav>

        {/* 频道顶栏主标题与全站真实统计徽章 */}
        <div className="mb-6 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white shadow-md relative overflow-hidden border border-blue-800/40">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/20">
                <History className="w-3.5 h-3.5 text-blue-400" />
                <span>版本更新中心 · 真实发版 · 拒绝伪造</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                软件与游戏最新版本更新中心
              </h1>
              <p className="mt-2 text-xs md:text-sm text-slate-300 leading-relaxed max-w-2xl">
                追踪正版软件、系统工具和游戏的新版本，严格以官方发布日期为基准，查看更新说明（Changelog）、版本演进历史与原厂直达下载入口。
              </p>
            </div>

            {/* 统计指标卡 */}
            {data?.stats && (
              <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-white/5 p-3.5 rounded-xl border border-white/10 text-center">
                <div className="p-2">
                  <div className="text-[11px] text-blue-200">全库正版软件</div>
                  <div className="text-lg font-mono font-bold text-white mt-0.5">
                    {data.stats.totalPublished} 款
                  </div>
                </div>
                <div className="p-2">
                  <div className="text-[11px] text-blue-200">已核验版本演进</div>
                  <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
                    {data.stats.totalVersions} 条
                  </div>
                </div>
                <div className="p-2 col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-blue-200">已核验官方来源</div>
                  <div className="text-lg font-mono font-bold text-blue-300 mt-0.5">
                    {data.stats.verifiedSourcesCount} 条
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 顶部重点更新 Hero */}
        {data && <UpdatesHero featured={data.featuredUpdates} />}

        {/* 多维筛选与搜索栏 */}
        {data && (
          <UpdatesFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            categories={data.categories}
            onReset={handleResetFilters}
          />
        )}

        {/* 主体双列布局：时间线 (70%) + 侧边栏 (30%) */}
        {loading && !data ? (
          /* 骨架屏 */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-32 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800"
                />
              ))}
            </div>
            <div className="lg:col-span-4 space-y-4">
              <div className="h-64 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
              <div className="h-48 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
            </div>
          </div>
        ) : error ? (
          <div className="py-16 text-center bg-white dark:bg-[#131C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <p className="text-sm text-rose-500 font-semibold mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 rounded-xl bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重新加载</span>
            </button>
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 左侧主要时间线区域 */}
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    版本演进动态时间线
                  </h2>
                </div>
                <span className="text-xs text-slate-400">
                  当前结果：{data.timeline.total} 条
                </span>
              </div>

              <UpdatesTimeline
                items={data.timeline.items}
                total={data.timeline.total}
                page={data.timeline.page}
                totalPages={data.timeline.totalPages}
                onPageChange={handlePageChange}
                onOpenHistory={(id) => setHistorySoftwareId(id)}
                onResetFilters={handleResetFilters}
              />
            </div>

            {/* 右侧侧边栏 */}
            <div className="lg:col-span-4">
              <UpdatesSidebar stats={data.stats} meta={data.meta} />
            </div>
          </div>
        ) : null}

        {/* 最近加入软游部落 (新收录入库，与版本更新严格隔离) */}
        {data && <UpdatesRecentlyAdded items={data.recentlyAdded} />}

        {/* 历史版本弹窗 */}
        <UpdatesVersionHistoryModal
          softwareId={historySoftwareId}
          onClose={() => setHistorySoftwareId(null)}
        />
      </div>
    </div>
  );
};
