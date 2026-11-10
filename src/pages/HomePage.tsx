import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { HeroSearch } from '../components/home/HeroSearch';
import { QuickCategories } from '../components/home/QuickCategories';
import { FeaturedSoftware } from '../components/home/FeaturedSoftware';
import { PopularDownloads } from '../components/home/PopularDownloads';
import { LatestUpdates } from '../components/home/LatestUpdates';
import { ToolCategories } from '../components/home/ToolCategories';
import { MultiCategoryLeaderboard } from '../components/home/MultiCategoryLeaderboard';
import { EssentialSuites } from '../components/home/EssentialSuites';
import { VisualSoftwareGallery } from '../components/home/VisualSoftwareGallery';
import { GameSection } from '../components/home/GameSection';
import { TutorialSection } from '../components/home/TutorialSection';
import { PlatformBenefits } from '../components/home/PlatformBenefits';
import { SoftwareModal } from '../components/common/SoftwareModal';
import { TutorialModal } from '../components/common/TutorialModal';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { SoftwareIcon } from '../components/common/SoftwareIcon';
import { getSimpleSoftwareName } from '../utils/softwareName';
import {
  Category,
  SoftwareItem,
  GameItem,
  TutorialItem,
  SearchResult,
} from '../types/resource';
import {
  getHomeData,
  searchResources,
  setSimulateEmptyDatabase,
  getSimulateEmptyDatabase,
} from '../services/resourceService';
import { Search, X, Database, Loader2, ArrowRight, ShieldCheck, Filter } from 'lucide-react';

interface HomePageProps {
  onSearchClick: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSearchClick }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // 数据状态
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredSoftware, setFeaturedSoftware] = useState<SoftwareItem[]>([]);
  const [popularSoftware, setPopularSoftware] = useState<SoftwareItem[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<SoftwareItem[]>([]);
  const [repairTools, setRepairTools] = useState<SoftwareItem[]>([]);
  const [games, setGames] = useState<GameItem[]>([]);
  const [tutorials, setTutorials] = useState<TutorialItem[]>([]);

  // 加载与异常状态
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 搜索与分类状态 (与 URL 同步，支持分享与后退恢复)
  const initialQ = searchParams.get('q') || '';
  const initialCat = searchParams.get('category') || 'all';

  const [searchQuery, setSearchQuery] = useState<string>(initialQ);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // 弹窗状态 (用于快速预览)
  const [selectedSoftware, setSelectedSoftware] = useState<SoftwareItem | null>(null);
  const [selectedTutorial, setSelectedTutorial] = useState<TutorialItem | null>(null);

  // 空库测试模拟 (仅在开发环境展示)
  const [isEmptyDbSimulated, setIsEmptyDbSimulated] = useState<boolean>(getSimulateEmptyDatabase());
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 载入真实首页聚合数据
  const fetchInitialData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getHomeData();
      setCategories(data.categories || []);
      setFeaturedSoftware(data.featured || []);
      setPopularSoftware(data.popular || []);
      setLatestUpdates(data.latest || []);
      setRepairTools(data.repairTools || []);
      setGames(data.games || []);
      setTutorials(data.tutorials || []);
    } catch (err: any) {
      console.error('加载真实首页数据失败:', err);
      setLoadError(err.message || '后端服务连接异常');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [isEmptyDbSimulated]);

  // 聚合当前已加载的不重复可用软件清单，用于装机必备套件与多品类排行榜
  const allAvailableSoftware = React.useMemo(() => {
    const map = new Map<string, SoftwareItem>();
    [...popularSoftware, ...featuredSoftware, ...repairTools, ...latestUpdates].forEach((item) => {
      if (item && item.id && !map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }, [popularSoftware, featuredSoftware, repairTools, latestUpdates]);

  // 执行搜索并同步参数至 URL
  const handlePerformSearch = async (query: string, categorySlug: string = selectedCategory) => {
    setSearchQuery(query);
    setSelectedCategory(categorySlug);

    // 更新 URL 查询参数
    const nextParams = new URLSearchParams();
    if (query.trim()) nextParams.set('q', query.trim());
    if (categorySlug !== 'all') nextParams.set('category', categorySlug);
    setSearchParams(nextParams, { replace: true });

    if (!query.trim() && categorySlug === 'all') {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await searchResources(query, {
        categorySlug: categorySlug !== 'all' ? categorySlug : undefined,
      });
      setSearchResults(res);
    } catch (err) {
      console.error('搜索异常', err);
    } finally {
      const el = document.getElementById('search-results-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // URL 参数变动时自动触发搜索
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const cat = searchParams.get('category') || 'all';
    if (q || cat !== 'all') {
      setSearchQuery(q);
      setSelectedCategory(cat);
      handlePerformSearch(q, cat);
    }
  }, [searchParams]);

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    if (slug === 'all' && !searchQuery) {
      setSearchResults(null);
      setIsSearching(false);
      const nextParams = new URLSearchParams();
      if (searchQuery) nextParams.set('q', searchQuery);
      setSearchParams(nextParams, { replace: true });
    } else {
      handlePerformSearch(searchQuery, slug);
    }
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSearchResults(null);
    setIsSearching(false);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const toggleEmptyDbSimulation = () => {
    const next = !isEmptyDbSimulated;
    setSimulateEmptyDatabase(next);
    setIsEmptyDbSimulated(next);
    if (next) {
      setSearchResults(null);
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-[#F5F7FA] dark:bg-[#0D1524] min-h-screen text-[#202938] dark:text-slate-100 transition-colors">
      {/* 1. 紧凑顶部搜索区 */}
      <HeroSearch
        searchRef={searchInputRef}
        onSearchSubmit={(q) => handlePerformSearch(q)}
        onSelectSoftware={(item) => setSelectedSoftware(item)}
      />

      {/* 2. 异常提示区 */}
      {loadError && (
        <div className="max-w-[1320px] mx-auto px-4 mt-6">
          <ErrorState
            message={`无法加载最新资源数据: ${loadError}。请检查后端服务是否启动，或者稍后重试。`}
            onRetry={fetchInitialData}
          />
        </div>
      )}

      {/* 3. 全局加载骨架 */}
      {isLoading && (
        <div className="max-w-[1320px] mx-auto px-4 py-16 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#1769D2] mb-3" />
          <p className="text-sm">正在加载软游部落精选资源目录...</p>
        </div>
      )}

      {/* 4. 主动搜索与筛选结果横向列表专区 */}
      {!isLoading && isSearching && searchResults && (
        <section
          id="search-results-section"
          className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 my-6 scroll-mt-20"
        >
          <div className="p-5 bg-white dark:bg-[#141F33] rounded-lg border border-[#E5E9F0] dark:border-slate-800 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EDF0F4] dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#202938] dark:text-slate-100">
                    检索结果列表
                  </h2>
                  <div className="text-xs text-[#667085] dark:text-slate-400">
                    {searchQuery ? `关键词：“${searchQuery}” · ` : ''}
                    共找到 <span className="font-semibold text-[#1769D2] dark:text-blue-400 tabular-nums">{searchResults.total}</span> 款相关收录软件
                  </div>
                </div>
              </div>

              <button
                onClick={handleResetSearch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors self-start sm:self-auto cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>清空检索条件</span>
              </button>
            </div>

            {/* 搜索结果列表 (专业横向列表布局，非千篇一律的卡片墙) */}
            {searchResults.items.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  title={`未检索到与 "${searchQuery || '指定条件'}" 匹配的软件`}
                  description="建议缩短搜索关键词、检查有无错别字，或者在左侧选择其他分类重新尝试。"
                  actionText="恢复查看全站精选"
                  onAction={handleResetSearch}
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 pt-2">
                {searchResults.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-2 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <SoftwareIcon
                        iconUrl={item.iconUrl}
                        name={item.name}
                        slug={item.slug}
                        categorySlug={item.categorySlug}
                        size="xl"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Link
                            to={`/software/${item.slug}`}
                            className="text-sm sm:text-base font-bold text-[#202938] dark:text-slate-100 group-hover:text-[#1769D2] transition-colors"
                          >
                            {getSimpleSoftwareName(item.name, item.englishName)}
                          </Link>
                          <span className="text-xs text-slate-400 font-mono tabular-nums">
                            v{item.latestVersion?.version}
                          </span>
                          <span className="text-[11px] font-medium text-[#16834A] dark:text-emerald-400 flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" />
                            <span>官方核验</span>
                          </span>
                        </div>
                        <p className="text-xs text-[#667085] dark:text-slate-400 line-clamp-1 leading-relaxed">
                          {item.summary}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span>{item.categoryName}</span>
                          <span>·</span>
                          <span>开发方: {item.developer}</span>
                          <span>·</span>
                          <span className="text-[#1769D2] dark:text-blue-400">{item.licenseLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <span className="text-xs font-mono text-slate-400 tabular-nums hidden sm:inline mr-2">
                        {item.downloadCount.toLocaleString()} 次获取
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedSoftware(item)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                      >
                        预览
                      </button>
                      <Link
                        to={`/software/${item.slug}`}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1769D2] hover:bg-[#1258B5] rounded-md transition-colors shadow-2xs"
                      >
                        详情与获取
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 5. 核心门户三栏内容区 (Desktop Asymmetric 3-Column Portal) */}
      {!isLoading && (
        <section id="featured" className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 my-6 scroll-mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* 左栏 (220-240px, lg:col-span-3)：专业软件下载分类目录 */}
            <div className="lg:col-span-3 flex flex-col">
              <QuickCategories
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleCategorySelect}
                className="h-full flex flex-col justify-between"
              />
            </div>

            {/* 中栏 (650-720px, lg:col-span-6)：编辑精选与主力软件 */}
            <div className="lg:col-span-6 flex flex-col">
              <FeaturedSoftware
                softwareList={featuredSoftware}
                onSelectSoftware={(item) => setSelectedSoftware(item)}
                onViewAllClick={() => handleCategorySelect('all')}
                className="h-full flex flex-col justify-between"
              />
            </div>

            {/* 右栏 (260-300px, lg:col-span-3)：热门获取排行榜 */}
            <div className="lg:col-span-3 flex flex-col">
              <PopularDownloads
                softwareList={popularSoftware}
                onSelectSoftware={(item) => setSelectedSoftware(item)}
                className="h-full flex flex-col justify-between"
              />
            </div>
          </div>
        </section>
      )}

      {/* 6. 装机必备与环境套件矩阵 (装机开箱、维护急救、开发者套件、办公创作) */}
      {!isLoading && allAvailableSoftware.length > 0 && (
        <EssentialSuites
          softwareList={allAvailableSoftware}
          onSelectSoftware={(item) => setSelectedSoftware(item)}
        />
      )}

      {/* 6.5 热门软件实机画廊与视觉专题 (高清 4K 原厂视口，增强页面视觉质感与图文深度) */}
      {!isLoading && (
        <VisualSoftwareGallery />
      )}

      {/* 7. 多品类四栏平行排行榜 (借鉴华军高利用率排行格局，无广告纯净版) */}
      {!isLoading && allAvailableSoftware.length > 0 && (
        <MultiCategoryLeaderboard
          softwareList={allAvailableSoftware}
        />
      )}

      {/* 8. 全站最新版本发布动态 (独立多列横向模块，承接顶部精选并自然过渡至工具箱) */}
      {!isLoading && latestUpdates.length > 0 && (
        <section id="updates" className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mb-8 scroll-mt-20">
          <LatestUpdates
            softwareList={latestUpdates}
            onSelectSoftware={(item) => setSelectedSoftware(item)}
            onViewAllClick={() => handleCategorySelect('all')}
          />
        </section>
      )}

      {/* 6. 系统与维修工具箱专题 */}
      {!isLoading && repairTools.length > 0 && (
        <ToolCategories
          toolList={repairTools}
          onSelectSoftware={(item) => setSelectedSoftware(item)}
        />
      )}

      {/* 7. 正版与开源游戏中心 */}
      {!isLoading && games.length > 0 && <GameSection games={games} />}

      {/* 8. 教程与避坑指南专区 */}
      {!isLoading && tutorials.length > 0 && (
        <TutorialSection
          tutorials={tutorials}
          onSelectTutorial={(tut) => setSelectedTutorial(tut)}
        />
      )}

      {/* 9. 平台来源合规与安全说明单栏 */}
      <PlatformBenefits />

      {/* 软件详情快速预览模态框 */}
      <SoftwareModal
        software={selectedSoftware}
        onClose={() => setSelectedSoftware(null)}
      />

      {/* 教程阅读模态框 */}
      <TutorialModal
        tutorial={selectedTutorial}
        onClose={() => setSelectedTutorial(null)}
      />

      {/* 测试与工程验收辅助浮动栏 (仅在开发环境中可见，生产环境严格隐藏) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 z-30">
          <button
            onClick={toggleEmptyDbSimulation}
            title={isEmptyDbSimulated ? "切换为真实数据库数据" : "模拟数据库为空状态（测试空状态展现）"}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full shadow-lg border transition-all cursor-pointer ${
              isEmptyDbSimulated
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 backdrop-blur-md'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isEmptyDbSimulated ? '开发调试: 空库模式中' : '开发调试: 空库测试'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
