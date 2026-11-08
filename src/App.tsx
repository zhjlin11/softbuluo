/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SiteHeader } from './components/layout/SiteHeader';
import { SiteFooter } from './components/layout/SiteFooter';
import { HeroSearch } from './components/home/HeroSearch';
import { QuickCategories } from './components/home/QuickCategories';
import { FeaturedSoftware } from './components/home/FeaturedSoftware';
import { PopularDownloads } from './components/home/PopularDownloads';
import { LatestUpdates } from './components/home/LatestUpdates';
import { ToolCategories } from './components/home/ToolCategories';
import { GameSection } from './components/home/GameSection';
import { TutorialSection } from './components/home/TutorialSection';
import { PlatformBenefits } from './components/home/PlatformBenefits';
import { SoftwareModal } from './components/common/SoftwareModal';
import { TutorialModal } from './components/common/TutorialModal';
import { EmptyState } from './components/common/EmptyState';
import {
  Category,
  SoftwareItem,
  GameItem,
  TutorialItem,
  SearchResult,
} from './types/resource';
import {
  getQuickCategories,
  getFeaturedSoftware,
  getPopularSoftware,
  getLatestUpdates,
  getSystemAndRepairTools,
  getGameResources,
  getTutorials,
  searchResources,
  setSimulateEmptyDatabase,
  getSimulateEmptyDatabase,
} from './services/resourceService';
import { siteConfig } from './config/site';
import { Search, X, Filter, ArrowLeft, Database, Check } from 'lucide-react';

export default function App() {
  // 主题状态（默认亮色高对比 SaaS，支持深色）
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // 核心数据状态
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredSoftware, setFeaturedSoftware] = useState<SoftwareItem[]>([]);
  const [popularSoftware, setPopularSoftware] = useState<SoftwareItem[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<SoftwareItem[]>([]);
  const [repairTools, setRepairTools] = useState<SoftwareItem[]>([]);
  const [games, setGames] = useState<GameItem[]>([]);
  const [tutorials, setTutorials] = useState<TutorialItem[]>([]);
  const [activeNav, setActiveNav] = useState<string>('#hero');

  // 搜索与分类过滤状态
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // 弹窗状态
  const [selectedSoftware, setSelectedSoftware] = useState<SoftwareItem | null>(null);
  const [selectedTutorial, setSelectedTutorial] = useState<TutorialItem | null>(null);

  // 空库模拟模式（用于验证空状态）
  const [isEmptyDbSimulated, setIsEmptyDbSimulated] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // 同步暗色模式到 html class
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // 全局快捷键 Ctrl+K 聚焦搜索框
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        focusSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 载入首页各模块数据
  const loadInitialData = async () => {
    try {
      const [cats, feat, pop, updates, tools, gm, tut] = await Promise.all([
        getQuickCategories(),
        getFeaturedSoftware(),
        getPopularSoftware(8),
        getLatestUpdates(6),
        getSystemAndRepairTools('all'),
        getGameResources(),
        getTutorials(),
      ]);

      setCategories(cats);
      setFeaturedSoftware(feat);
      setPopularSoftware(pop);
      setLatestUpdates(updates);
      setRepairTools(tools);
      setGames(gm);
      setTutorials(tut);
    } catch (err) {
      console.error('加载资源数据失败', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [isEmptyDbSimulated]);

  // 执行搜索
  const handlePerformSearch = async (query: string, categorySlug: string = selectedCategory) => {
    setSearchQuery(query);
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
      console.error('搜索执行异常', err);
    } finally {
      // 滚动至搜索结果区
      const el = document.getElementById('search-results-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // 分类点击处理
  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    if (slug === 'all' && !searchQuery) {
      setSearchResults(null);
      setIsSearching(false);
    } else {
      handlePerformSearch(searchQuery, slug);
    }
  };

  // 清除搜索和筛选
  const handleResetSearch = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSearchResults(null);
    setIsSearching(false);
  };

  const focusSearch = () => {
    searchInputRef.current?.focus();
    searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleNavClick = (href: string) => {
    setActiveNav(href);
    if (href === '#hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
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
    <div className="min-h-screen flex flex-col bg-[#F6F8FC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* 顶部吸顶导航栏 */}
      <SiteHeader
        activeNav={activeNav}
        onNavClick={handleNavClick}
        onSearchClick={focusSearch}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      <main className="flex-1">
        {/* 首页 Hero 搜索区 */}
        <HeroSearch
          searchRef={searchInputRef}
          onSearchSubmit={(q) => handlePerformSearch(q)}
          onSelectSoftware={(item) => setSelectedSoftware(item)}
        />

        {/* 快捷分类网格 */}
        <QuickCategories
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />

        {/* 若处于主动搜索或分类过滤状态，展示动态检索结果专区 */}
        {isSearching && searchResults && (
          <section
            id="search-results-section"
            className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mb-16 scroll-mt-24"
          >
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                      搜索与筛选结果
                    </h2>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {searchQuery ? `关键词：“${searchQuery}” · ` : ''}
                      共找到 <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">{searchResults.total}</span> 款相关资源
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleResetSearch}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors self-start sm:self-auto"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>重置所有筛选</span>
                </button>
              </div>

              {/* 搜索结果列表 */}
              {searchResults.items.length === 0 ? (
                <div className="py-8">
                  <EmptyState
                    title={`未检索到与 "${searchQuery || '指定条件'}" 匹配的软件`}
                    description="建议缩短搜索关键词、检查有无错别字，或者在上方选择其他分类重新尝试。"
                    actionText="恢复查看全站精选"
                    onAction={handleResetSearch}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                  {searchResults.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedSoftware(item)}
                      className="p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                              {item.name.slice(0, 1)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">
                                {item.name}
                              </h3>
                              <span className="text-[11px] text-slate-400">
                                {item.categoryName} · v{item.latestVersion.version}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium shrink-0">
                            {item.licenseLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                          {item.summary}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 tabular-nums">
                          {item.downloadCount.toLocaleString()} 次获取
                        </span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          查看官方来源 →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 编辑精选软件 */}
        {featuredSoftware.length > 0 ? (
          <FeaturedSoftware
            softwareList={featuredSoftware}
            onSelectSoftware={(item) => setSelectedSoftware(item)}
            onViewAllClick={() => handleCategorySelect('all')}
          />
        ) : (
          isEmptyDbSimulated && (
            <div className="max-w-[1280px] mx-auto px-4 mb-16">
              <EmptyState title="暂无精选软件，数据正在整理录入中" />
            </div>
          )
        )}

        {/* 热门下载排行榜 */}
        {popularSoftware.length > 0 && (
          <PopularDownloads
            softwareList={popularSoftware}
            onSelectSoftware={(item) => setSelectedSoftware(item)}
          />
        )}

        {/* 最新版本更新 */}
        {latestUpdates.length > 0 && (
          <LatestUpdates
            softwareList={latestUpdates}
            onSelectSoftware={(item) => setSelectedSoftware(item)}
            onViewAllClick={() => handleCategorySelect('all')}
          />
        )}

        {/* 系统与维修工具专区 */}
        {repairTools.length > 0 && (
          <ToolCategories
            toolList={repairTools}
            onSelectSoftware={(item) => setSelectedSoftware(item)}
          />
        )}

        {/* 游戏中心专区 */}
        {games.length > 0 && <GameSection games={games} />}

        {/* 安装教程与问题解决 */}
        {tutorials.length > 0 && (
          <TutorialSection
            tutorials={tutorials}
            onSelectTutorial={(tut) => setSelectedTutorial(tut)}
          />
        )}

        {/* 平台四大服务保障 */}
        <PlatformBenefits />
      </main>

      {/* 底部合规页脚 */}
      <SiteFooter onCategoryClick={(slug) => handleCategorySelect(slug)} />

      {/* 软件详情模态框 */}
      <SoftwareModal
        software={selectedSoftware}
        onClose={() => setSelectedSoftware(null)}
      />

      {/* 教程详情模态框 */}
      <TutorialModal
        tutorial={selectedTutorial}
        onClose={() => setSelectedTutorial(null)}
      />

      {/* 测试与工程验收辅助浮动栏 (用于验证空数据库行为与快速测试) */}
      <div className="fixed bottom-4 right-4 z-30">
        <button
          onClick={toggleEmptyDbSimulation}
          title={isEmptyDbSimulated ? "切换为真实预置数据" : "模拟数据库为空状态（测试空状态展现）"}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full shadow-lg border transition-all ${
            isEmptyDbSimulated
              ? 'bg-amber-500 text-white border-amber-600'
              : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 backdrop-blur-md'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{isEmptyDbSimulated ? '空数据模式中 (点击还原)' : '空库测试模式'}</span>
        </button>
      </div>
    </div>
  );
}
