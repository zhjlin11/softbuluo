import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { SoftwareItem } from '../types/resource';
import {
  GamesChannelData,
  getGamesChannelPortal,
  getGamesResourcesList,
} from '../services/channelService';
import { GamesHeaderStrip, GamesPortalHero } from '../components/games/GamesPortalHero';
import { GamesSpotlightGallery } from '../components/games/GamesSpotlightGallery';
import { GamesTaxonomyAndTools } from '../components/games/GamesTaxonomyAndTools';
import { GamesEditorialAndUpdates } from '../components/games/GamesEditorialAndUpdates';
import { GamesCatalogSection } from '../components/games/GamesCatalogSection';

function applyGamesSeoMeta(data?: GamesChannelData | null) {
  const origin =
    import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  const canonicalUrl = `${origin}/games`;

  const title = '游戏中心 - 精品开源独立与正版 PC 游戏库 - 软游部落';
  const description = data
    ? `软游部落游戏中心当前公开发布 ${data.meta.totalGamesCount} 款合规开源免费 PC 游戏（共登记 ${data.meta.registeredSourcesCount} 条可用来源），提供高清实机画面、题材分类导航、官方下载页与正规商店入口，游戏配套工具单列展示不混入游戏数量。`
    : '软游部落游戏中心严选安全、开源或官方正版 PC 单机游戏，提供实机画册、真实榜单、专题合集与录屏配套工具指引。';

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

export const GamesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const toolsRef = useRef<HTMLDivElement | null>(null);
  const catalogRef = useRef<HTMLDivElement | null>(null);

  const [portalData, setPortalData] = useState<GamesChannelData | null>(null);
  const [portalLoading, setPortalLoading] = useState(true);
  const [portalError, setPortalError] = useState<string | null>(null);

  const [catalogItems, setCatalogItems] = useState<SoftwareItem[]>([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const activeGenre = searchParams.get('genre') || 'all';
  const activePlatform = searchParams.get('platform') || 'all';
  const activeLicense = searchParams.get('license') || 'all';
  const activeSort = searchParams.get('sort') || 'popular';
  const searchQuery = searchParams.get('q') || '';

  const loadPortal = useCallback(async () => {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const data = await getGamesChannelPortal();
      setPortalData(data);
      applyGamesSeoMeta(data);
    } catch (err: any) {
      setPortalError(err.message || '游戏中心频道数据加载失败');
    } finally {
      setPortalLoading(false);
    }
  }, []);

  useEffect(() => {
    applyGamesSeoMeta(null);
    loadPortal();
  }, [loadPortal]);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const res = await getGamesResourcesList({
        genre: activeGenre,
        platform: activePlatform,
        license: activeLicense,
        sort: activeSort,
        search: searchQuery || undefined,
        limit: 24,
        offset: 0,
      });
      setCatalogItems(res.items || []);
      setCatalogTotal(res.total || 0);
    } catch (err: any) {
      setCatalogError(err.message || '游戏列表查询失败');
      setCatalogItems([]);
    } finally {
      setCatalogLoading(false);
    }
  }, [activeGenre, activePlatform, activeLicense, activeSort, searchQuery]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleUpdateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      for (const [k, v] of Object.entries(updates)) {
        if (!v || v === 'all') next.delete(k);
        else next.set(k, v);
      }
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const handleResetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectGenreAndScroll = (genreSlug: string) => {
    handleUpdateParams({ genre: genreSlug, page: null });
    scrollToRef(catalogRef);
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] dark:bg-[#0D1524] transition-colors">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-7 sm:space-y-8">
        {portalLoading ? (
          <div className="space-y-4 min-h-[1150px]">
            <GamesHeaderStrip meta={null} />
            <div className="h-[88px] sm:h-[46px] rounded-xl bg-white dark:bg-slate-900 border border-[#E6ECF5] dark:border-slate-800 animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 h-[320px] sm:h-[360px] rounded-2xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
              <div className="lg:col-span-4 h-[320px] sm:h-[360px] rounded-2xl bg-white dark:bg-slate-900 border border-[#E6ECF5] dark:border-slate-800 animate-pulse" />
            </div>
          </div>
        ) : portalError || !portalData ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/60 p-12 text-center space-y-3 shadow-2xs">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">游戏中心频道加载异常</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {portalError || '游戏频道数据暂时无法读取，请稍后重试'}
            </p>
            <button
              type="button"
              onClick={loadPortal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重新加载游戏中心
            </button>
          </div>
        ) : (
          <>
            <GamesPortalHero
              meta={portalData.meta}
              heroSlides={portalData.heroSlides}
              quickFilters={portalData.quickFilters}
              spotlightGames={portalData.spotlightGames}
              activeGenre={activeGenre}
              onSelectGenre={handleSelectGenreAndScroll}
              onJumpSpotlight={() => scrollToRef(spotlightRef)}
              onJumpTools={() => scrollToRef(toolsRef)}
              onJumpCatalog={() => scrollToRef(catalogRef)}
            />

            <div ref={spotlightRef}>
              <GamesSpotlightGallery games={portalData.spotlightGames} />
            </div>

            <div ref={toolsRef}>
              <GamesTaxonomyAndTools
                genreBlocks={portalData.genreBlocks}
                upcomingGenreLabels={portalData.upcomingGenreLabels}
                companionTools={portalData.companionTools}
                distributionStandards={portalData.distributionStandards}
                redistributionNotice={portalData.meta.redistributionNotice}
                onFilterByGenre={handleSelectGenreAndScroll}
              />
            </div>

            <GamesEditorialAndUpdates
              leaderboards={portalData.leaderboards}
              hotTopics={portalData.hotTopics}
              guides={portalData.guides}
              latestUpdates={portalData.latestUpdates}
            />

            <div ref={catalogRef}>
              <GamesCatalogSection
                items={catalogItems}
                total={catalogTotal}
                loading={catalogLoading}
                error={catalogError}
                quickFilters={portalData.quickFilters}
                activeGenre={activeGenre}
                activePlatform={activePlatform}
                activeLicense={activeLicense}
                activeSort={activeSort}
                searchQuery={searchQuery}
                onUpdateParams={handleUpdateParams}
                onResetFilters={handleResetFilters}
                onRetry={loadCatalog}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
