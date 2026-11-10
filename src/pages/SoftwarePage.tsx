import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Award, RefreshCw, AlertTriangle } from 'lucide-react';
import { SoftwareItem } from '../types/resource';
import {
  getDesktopResourcesList,
  getSoftwareChannelPortal,
  SoftwareChannelData,
} from '../services/channelService';
import { SoftwarePortalHero } from '../components/software/SoftwarePortalHero';
import { SoftwareHotCategoryGrid } from '../components/software/SoftwareHotCategoryGrid';
import { SoftwareCompactCard } from '../components/software/SoftwareCompactCard';
import { SoftwareLeaderboards } from '../components/software/SoftwareLeaderboards';
import { SoftwareEditorialExtras } from '../components/software/SoftwareEditorialExtras';
import { SoftwareCategoryShowcase } from '../components/software/SoftwareCategoryShowcase';

function applyChannelSeoMeta(data?: SoftwareChannelData | null) {
  const origin =
    import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  const canonicalUrl = `${origin}/software`;

  const title = '电脑软件频道 - 开源与常用桌面软件发布渠道汇总 - 软游部落';
  const description = data
    ? `软游部落电脑软件频道汇总 ${data.meta.totalSoftwareCount} 款公开桌面软件，提供 ${data.meta.registeredSourcesCount ?? data.meta.verifiedSourcesCount} 条已登记下载来源（含 ${data.meta.approvedHealthySourcesCount ?? data.meta.verifiedSourcesCount} 条已审核直连）、热门关注榜、实用教程与对比评测。商业软件需配合正版授权使用，具体哈希校验状态以各软件来源记录为准。`
    : '软游部落电脑软件频道汇总开源与常用桌面软件发布渠道，提供来源审核状态、热门关注、专题、实用教程与参数对比。';

  document.title = title;

  const upsertMeta = (attr: 'name' | 'property', key: string, content: string) => {
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  upsertMeta('name', 'description', description);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', canonicalUrl);

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', canonicalUrl);
}

export const SoftwarePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const catalogSectionRef = useRef<HTMLElement | null>(null);

  const [portalData, setPortalData] = useState<SoftwareChannelData | null>(null);
  const [portalLoading, setPortalLoading] = useState(true);
  const [portalError, setPortalError] = useState<string | null>(null);

  const [forceFlatList, setForceFlatList] = useState(false);
  const [filteredItems, setFilteredItems] = useState<SoftwareItem[]>([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [filteredLoading, setFilteredLoading] = useState(false);
  const [filteredError, setFilteredError] = useState<string | null>(null);

  const activeCategory = searchParams.get('category') || 'all';
  const activePlatform = searchParams.get('platform') || 'all';
  const activeLicense = searchParams.get('license') || 'all';
  const activeSort = searchParams.get('sort') || 'popular';
  const searchQuery = searchParams.get('q') || '';
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const pageSize = 12;

  const hasQueryFilters =
    activeCategory !== 'all' ||
    activePlatform !== 'all' ||
    activeLicense !== 'all' ||
    Boolean(searchQuery) ||
    currentPage > 1 ||
    searchParams.has('sort');

  const isFilteredMode = forceFlatList || hasQueryFilters;

  const loadPortal = useCallback(async () => {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const data = await getSoftwareChannelPortal();
      setPortalData(data);
      applyChannelSeoMeta(data);
    } catch (err: any) {
      setPortalError(err.message || '加载电脑软件频道数据失败');
    } finally {
      setPortalLoading(false);
    }
  }, []);

  useEffect(() => {
    applyChannelSeoMeta(null);
    loadPortal();
  }, [loadPortal]);

  const loadFiltered = useCallback(async () => {
    if (!isFilteredMode) return;
    setFilteredLoading(true);
    setFilteredError(null);
    try {
      const res = await getDesktopResourcesList({
        categorySlug: activeCategory !== 'all' ? activeCategory : undefined,
        platform: activePlatform !== 'all' ? activePlatform : undefined,
        license: activeLicense !== 'all' ? activeLicense : undefined,
        sort: activeSort,
        search: searchQuery || undefined,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      });
      setFilteredItems(res.items || []);
      setFilteredTotal(res.total || 0);
    } catch (err: any) {
      setFilteredError(err.message || '加载筛选结果失败');
      setFilteredItems([]);
    } finally {
      setFilteredLoading(false);
    }
  }, [isFilteredMode, activeCategory, activePlatform, activeLicense, activeSort, searchQuery, currentPage]);

  useEffect(() => {
    loadFiltered();
  }, [loadFiltered]);

  const updateParams = (updates: Record<string, string | null>, scrollToCatalog = false) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === '') next.delete(key);
      else next.set(key, val);
    }
    setSearchParams(next);
    if (scrollToCatalog) {
      window.setTimeout(() => {
        catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  const handleSelectCategoryAndScroll = (slug: string) => {
    if (slug === 'all') {
      setForceFlatList(true);
      updateParams({ category: null, page: null }, true);
    } else {
      updateParams({ category: slug, page: null }, true);
    }
  };

  const handleResetFilters = () => {
    setForceFlatList(false);
    setSearchParams({});
  };

  const handleJumpToCatalog = () => {
    setForceFlatList(true);
    catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] dark:bg-[#0B1120] transition-colors">
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-8">
        {portalLoading ? (
          <div className="space-y-5">
            <div className="h-22 rounded-xl bg-white dark:bg-slate-900 border border-[#E6ECF5] dark:border-slate-800 animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 h-76 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="lg:col-span-5 h-76 rounded-2xl bg-white dark:bg-slate-900 border border-[#E6ECF5] dark:border-slate-800 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-44 rounded-xl bg-white dark:bg-slate-900 border border-[#E6ECF5] dark:border-slate-800 animate-pulse" />
              ))}
            </div>
          </div>
        ) : portalError || !portalData ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/60 p-12 text-center space-y-3 shadow-xs">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">电脑软件频道加载异常</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {portalError || '频道数据暂时无法读取，请稍后重试'}
            </p>
            <button
              type="button"
              onClick={loadPortal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重新加载频道
            </button>
          </div>
        ) : (
          <>
            {/* A. 紧凑头部 + 分类快捷导航 + 焦点大图与本周热推 */}
            <SoftwarePortalHero
              meta={portalData.meta}
              categories={portalData.categories}
              activeCategory={activeCategory}
              onSelectCategory={handleSelectCategoryAndScroll}
              heroSlides={portalData.heroSlides}
              weeklyPicks={portalData.weeklyPicks}
              onJumpToCatalog={handleJumpToCatalog}
            />

            {/* B. 热门分类导航卡片 */}
            <SoftwareHotCategoryGrid
              categories={portalData.categories}
              onSelectCategory={handleSelectCategoryAndScroll}
            />

            {/* C. 编辑精选 */}
            {portalData.editorPicks.length > 0 && (
              <section aria-labelledby="editor-picks-heading" className="space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </span>
                    <div>
                      <h2 id="editor-picks-heading" className="text-lg font-bold text-slate-900 dark:text-white">
                        编辑精选桌面软件
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        精选官方发布与开源口碑应用 · 与本周热推互补不重项 · 商业授权请遵从开发商条款
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleJumpToCatalog}
                    className="text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline cursor-pointer shrink-0"
                  >
                    浏览全部 {portalData.meta.totalSoftwareCount} 款 &gt;
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {portalData.editorPicks.map((sw) => (
                    <SoftwareCompactCard
                      key={sw.id}
                      item={sw}
                      onCategoryClick={(slug) => handleSelectCategoryAndScroll(slug)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* D. 双榜排行（热门关注 TOP10 + 近期下载点击 TOP10） */}
            <SoftwareLeaderboards
              mostViewed={portalData.leaderboards.mostViewed}
              mostDownloaded={portalData.leaderboards.mostDownloaded}
            />

            {/* E. 分类软件专区 + 完整可筛选分页资源库 */}
            <SoftwareCategoryShowcase
              sectionRef={catalogSectionRef}
              categories={portalData.categories}
              categoryBlocks={portalData.categoryBlocks}
              activeCategory={activeCategory}
              activePlatform={activePlatform}
              activeLicense={activeLicense}
              activeSort={activeSort}
              searchQuery={searchQuery}
              currentPage={currentPage}
              isFilteredMode={isFilteredMode}
              filteredItems={filteredItems}
              filteredTotal={filteredTotal}
              filteredLoading={filteredLoading}
              filteredError={filteredError}
              pageSize={pageSize}
              onUpdateParams={(updates, scroll) => updateParams(updates, scroll)}
              onToggleFlatList={() => {
                if (hasQueryFilters) {
                  setForceFlatList(false);
                  setSearchParams({});
                } else {
                  setForceFlatList((prev) => !prev);
                }
              }}
              onResetFilters={handleResetFilters}
              onRetryFiltered={loadFiltered}
            />

            {/* F. 专题推荐 + 装机教程与对比评测 + 最近更新双栏 */}
            <SoftwareEditorialExtras
              hotTopics={portalData.hotTopics}
              tutorials={portalData.tutorials}
              comparisons={portalData.comparisons}
              versionUpdates={portalData.latestUpdates.versionUpdates}
              newlyCataloged={portalData.latestUpdates.newlyCataloged}
            />
          </>
        )}
      </main>
    </div>
  );
};
