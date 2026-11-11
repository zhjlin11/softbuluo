import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  Flame,
  ArrowRight,
  Layers,
  Scale,
  LayoutGrid,
} from 'lucide-react';
import { SoftwareIcon } from '../common/SoftwareIcon';
import {
  ChannelCategoryItem,
  ChannelSoftwareItem,
  HeroSlideItem,
} from '../../services/channelService';
import { getSimpleSoftwareName, getSimpleVersion, sanitizeChannelIconUrl } from './softwareHelpers';

interface SoftwarePortalHeroProps {
  meta: {
    totalSoftwareCount: number;
    verifiedSourcesCount: number;
    registeredSourcesCount?: number;
    approvedHealthySourcesCount?: number;
    topicsCount: number;
  };
  categories: ChannelCategoryItem[];
  activeCategory: string;
  onSelectCategory: (slug: string) => void;
  heroSlides: HeroSlideItem[];
  weeklyPicks: ChannelSoftwareItem[];
  onJumpToCatalog: () => void;
}

const SLIDE_THEME_STYLES: Record<'blue' | 'indigo' | 'emerald', string> = {
  blue: 'from-[#0F3B82] via-[#1769D2] to-[#1D4ED8]',
  indigo: 'from-[#1E293B] via-[#312E81] to-[#1E40AF]',
  emerald: 'from-[#064E3B] via-[#0F766E] to-[#1D4ED8]',
};

export const SoftwarePortalHero: React.FC<SoftwarePortalHeroProps> = ({
  meta,
  categories,
  activeCategory,
  onSelectCategory,
  heroSlides,
  weeklyPicks,
  onJumpToCatalog,
}) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const safeSlides = heroSlides.length > 0 ? heroSlides : [];
  const currentSlide = safeSlides[slideIdx % Math.max(1, safeSlides.length)] || null;

  useEffect(() => {
    if (safeSlides.length <= 1 || isPaused) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const timer = window.setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % safeSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [safeSlides.length, isPaused]);

  const handlePrev = () => {
    if (safeSlides.length === 0) return;
    setSlideIdx((prev) => (prev - 1 + safeSlides.length) % safeSlides.length);
  };

  const handleNext = () => {
    if (safeSlides.length === 0) return;
    setSlideIdx((prev) => (prev + 1) % safeSlides.length);
  };

  return (
    <div className="space-y-4">
      {/* 1. 紧凑频道头部 + 面包屑（严格控制高度在 75–108px，不放置重复全局搜索框） */}
      <header className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 px-4 sm:px-6 py-3.5 shadow-2xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="min-w-0">
            <nav aria-label="面包屑导航" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Link to="/" className="hover:text-[#1769D2] dark:hover:text-blue-400 transition-colors">
                首页
              </Link>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <span className="text-slate-900 dark:text-slate-200 font-medium">电脑软件</span>
            </nav>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                电脑软件频道
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                官方发布与开源桌面应用导航 · 明确区分直达链接与厂商商业授权说明
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:shrink-0">
            <span
              title={`已登记可用来源 ${meta.registeredSourcesCount ?? meta.verifiedSourcesCount} 条，其中人工审核且最近巡检健康直连 ${meta.approvedHealthySourcesCount ?? meta.verifiedSourcesCount} 条`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/70 text-xs font-medium tabular-nums"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              收录 {meta.totalSoftwareCount} 款 · {meta.registeredSourcesCount ?? meta.verifiedSourcesCount} 条已登记源（{meta.approvedHealthySourcesCount ?? meta.verifiedSourcesCount} 条已审核直连）
            </span>
            <Link
              to="/topics"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-[#1769D2]" />
              软件专题
            </Link>
            <Link
              to="/essentials"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#1769D2]" />
              装机必备
            </Link>
            <button
              type="button"
              onClick={onJumpToCatalog}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              全部分类库
            </button>
          </div>
        </div>
      </header>

      {/* 2. 顶部分类关键词快捷导航条（真实分类与真实发布数量） */}
      <nav
        aria-label="桌面软件分类快捷导航"
        className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 px-3 sm:px-4 py-2.5 shadow-2xs"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              activeCategory === 'all'
                ? 'bg-[#1769D2] text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-[#1769D2] dark:hover:bg-slate-700'
            }`}
          >
            全部桌面软件 ({meta.totalSoftwareCount})
          </button>

          {categories.map((cat) => {
            const isSelected = activeCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#1769D2] text-white shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70 hover:border-[#B7CEFA] hover:bg-blue-50/70 hover:text-[#1769D2] dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[11px] tabular-nums ${
                    isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. 核心焦点图 (约60% 左) + 本周热推图标矩阵 (约40% 右) */}
      <section aria-label="焦点主推与本周热推" className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* 左侧焦点主推 Banner (~60%) */}
        <div
          className="lg:col-span-7 min-w-0 relative rounded-2xl overflow-hidden shadow-sm border border-[#B7CEFA]/40 dark:border-slate-800"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
        >
          {currentSlide ? (
            <div
              className={`relative h-full min-h-[290px] sm:min-h-[310px] bg-gradient-to-br ${SLIDE_THEME_STYLES[currentSlide.theme]} text-white p-5 sm:p-7 flex flex-col justify-between`}
            >
              {/* 可选运营自定义安全背景图（失败自动回退纯粹几何光效） */}
              {currentSlide.coverImage && !failedImages[currentSlide.id] && (
                <img
                  src={currentSlide.coverImage}
                  alt={currentSlide.title}
                  onError={() => setFailedImages((prev) => ({ ...prev, [currentSlide.id]: true }))}
                  className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay pointer-events-none"
                />
              )}

              {/* 精致几何网格纹理，避免空背景或低质外链图 */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 85% 20%, rgba(255,255,255,0.45) 0%, transparent 45%), linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
                  backgroundSize: '100% 100%, 28px 28px, 28px 28px',
                }}
              />

              <div className="relative z-10 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/25 text-xs font-medium text-blue-50">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  {currentSlide.badge}
                </span>

                {safeSlides.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrev}
                      aria-label="上一张焦点推荐"
                      className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      aria-label="下一张焦点推荐"
                      className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="relative z-10 my-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-8 min-w-0">
                  <h2
                    title={currentSlide.title}
                    className="text-xl sm:text-2xl font-bold leading-snug tracking-tight text-white line-clamp-2"
                  >
                    {currentSlide.title}
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-blue-100/90 leading-relaxed line-clamp-2">
                    {currentSlide.subtitle}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <Link
                      to={currentSlide.targetUrl}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#1769D2] hover:bg-blue-50 font-semibold text-xs sm:text-sm shadow-sm transition-colors"
                    >
                      立即进入查看
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <span className="text-xs text-blue-100/90 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/15">
                      {currentSlide.statsText}
                    </span>
                  </div>
                </div>

                {/* 右侧代表软件图标展示组 */}
                {currentSlide.previewSoftwares.length > 0 && (
                  <div className="hidden sm:flex sm:col-span-4 flex-col gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15">
                    <span className="text-[11px] font-medium text-blue-100/80">包含代表资源</span>
                    <div className="space-y-2">
                      {currentSlide.previewSoftwares.slice(0, 3).map((sw) => (
                        <Link
                          key={sw.slug}
                          to={`/software/${sw.slug}`}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors min-w-0"
                        >
                          <SoftwareIcon
                            iconUrl={sanitizeChannelIconUrl(sw.iconUrl)}
                            name={sw.name}
                            slug={sw.slug}
                            categorySlug={sw.categorySlug}
                            size="sm"
                            className="shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-white truncate">
                              {getSimpleSoftwareName(sw.name)}
                            </div>
                            {sw.latestVersion && (
                              <div className="text-[10px] text-blue-100/80 truncate">
                                {getSimpleVersion(sw.latestVersion)}
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 轮播分页指示点 */}
              <div className="relative z-10 flex items-center justify-between gap-3 pt-2 border-t border-white/15">
                <div className="flex items-center gap-1.5">
                  {safeSlides.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSlideIdx(idx)}
                      aria-label={`切换到第 ${idx + 1} 张推荐：${s.title}`}
                      aria-current={idx === slideIdx % safeSlides.length}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === slideIdx % safeSlides.length
                          ? 'w-6 bg-white'
                          : 'w-2 bg-white/40 hover:bg-white/65'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-blue-100/80 tabular-nums">
                  {slideIdx % safeSlides.length + 1} / {safeSlides.length}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-[290px] bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse" />
          )}
        </div>

        {/* 右侧本周热推图标矩阵 (~40%，8-10 款高频软件) */}
        <aside
          aria-label="本周热推软件矩阵"
          className="lg:col-span-5 min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-[#E6ECF5] dark:border-slate-800 p-4 sm:p-5 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                  本周热推
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  装机常见工具精选 · 与编辑精选不重项
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onJumpToCatalog}
              className="text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline cursor-pointer shrink-0"
            >
              更多软件 &gt;
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
            {weeklyPicks.slice(0, 8).map((sw) => {
              const shortName = getSimpleSoftwareName(sw.name, sw.englishName || undefined) || sw.name;
              return (
                <Link
                  key={sw.id}
                  to={`/software/${sw.slug}`}
                  title={`${sw.name} (${sw.categoryName})`}
                  className="group min-w-0 flex sm:flex-col items-center sm:justify-center gap-2 sm:gap-1.5 p-2 sm:px-1.5 sm:py-2 rounded-xl border border-transparent hover:border-[#B7CEFA] dark:hover:border-blue-800 hover:bg-[#F5F8FC] dark:hover:bg-slate-800/80 transition-all text-left sm:text-center"
                >
                  <SoftwareIcon
                    iconUrl={sanitizeChannelIconUrl(sw.iconUrl)}
                    name={sw.name}
                    slug={sw.slug}
                    categorySlug={sw.categorySlug}
                    size="md"
                    className="group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 w-full">
                    <div className="text-[11px] font-medium text-slate-800 dark:text-slate-200 group-hover:text-[#1769D2] dark:group-hover:text-blue-400 truncate">
                      {shortName}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {sw.badgeText || sw.categoryName}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>
      </section>
    </div>
  );
};
