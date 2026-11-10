import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Pause,
  Play,
  ArrowRight,
  Sparkles,
  Wrench,
  Layers,
  ListChecks,
} from 'lucide-react';
import { SoftwareIcon } from '../common/SoftwareIcon';
import { EssentialsChannelData } from '../../services/channelService';
import { getSimpleSoftwareName, getSimpleVersion, sanitizeChannelIconUrl } from '../software/softwareHelpers';

interface EssentialsPortalHeroProps {
  meta: EssentialsChannelData['meta'];
  stageNav: EssentialsChannelData['stageNav'];
  heroSlides: EssentialsChannelData['heroSlides'];
  quickTools: EssentialsChannelData['quickTools'];
  onJumpToSection: (sectionId: string) => void;
}

const SLIDE_THEME_GRADIENTS: Record<'blue' | 'indigo' | 'emerald', string> = {
  blue: 'from-[#0B1F44]/95 via-[#133A7C]/88 to-[#1769D2]/75',
  indigo: 'from-[#161D3A]/95 via-[#28336B]/88 to-[#1E40AF]/75',
  emerald: 'from-[#07262A]/95 via-[#0F4C4F]/88 to-[#0D6E6E]/75',
};

export const EssentialsPortalHero: React.FC<EssentialsPortalHeroProps> = ({
  meta,
  stageNav,
  heroSlides,
  quickTools,
  onJumpToSection,
}) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const diff = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handlePrev();
      else handleNext();
    }
  };

  return (
    <div id="essentials-hero" className="space-y-4">
      {/* 1. 装机必备频道头部与面包屑 */}
      <header className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 px-4 sm:px-6 py-4 shadow-2xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="min-w-0">
            <nav aria-label="面包屑导航" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <Link to="/" className="hover:text-[#1769D2] dark:hover:text-blue-400 transition-colors">
                首页
              </Link>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <span className="text-slate-900 dark:text-slate-200 font-medium">装机必备</span>
            </nav>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                新电脑装机与必备软件中心
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                正版来源、实用工具、场景化装机方案与详细安装指引 — 从系统初始化到开发运维一站配齐
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:shrink-0">
            <span
              title={`已发布 ${meta.totalPublishedSoftwareCount} 款软件与工具；共登记 ${meta.registeredSourcesCount} 条可用下载源，其中 ${meta.approvedHealthySourcesCount} 条经人工审核健康直连（SHA-256 核验以具体来源记录为准）`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/70 text-xs font-medium tabular-nums"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              已发布 {meta.totalPublishedSoftwareCount} 款 · {meta.topicsCount} 专题 · {meta.approvedHealthySourcesCount}/{meta.registeredSourcesCount} 条已审核健康源
            </span>
            <button
              type="button"
              onClick={() => onJumpToSection('essentials-plans')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <ListChecks className="w-3.5 h-3.5" />
              选择装机方案
            </button>
          </div>
        </div>

        {/* 装机阶段快捷锚点导航 */}
        <nav
          aria-label="装机阶段快捷导航"
          className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-0.5"
        >
          {stageNav.map((navItem) => (
            <button
              key={navItem.id}
              type="button"
              onClick={() => onJumpToSection(navItem.id)}
              className="px-3 py-1 rounded-lg bg-slate-100/90 dark:bg-slate-800/90 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-[#1769D2] dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {navItem.label}
            </button>
          ))}
        </nav>
      </header>

      {/* 2. 顶部装机主题大图 (65%) + 右侧装机常用工具 (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* 左侧主题 Banner 轮播 (8 cols ≈ 66.7%) */}
        <section
          aria-label="装机主题精选推荐"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="lg:col-span-8 relative rounded-xl overflow-hidden border border-[#DCE6F5] dark:border-slate-800 shadow-xs min-h-[320px] sm:min-h-[340px] bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
        >
          {currentSlide ? (
            <>
              <img
                src={currentSlide.coverImage || '/images/essentials/hero-essentials-win11.svg'}
                alt={`${currentSlide.title} 原创装机示意图`}
                width={960}
                height={540}
                className="absolute inset-0 w-full h-full object-cover select-none"
              />
              <div
                className={`absolute inset-0 bg-gradient-to-r ${
                  SLIDE_THEME_GRADIENTS[currentSlide.theme] || SLIDE_THEME_GRADIENTS.blue
                }`}
              />

              <div className="relative z-10 h-full min-h-[320px] sm:min-h-[340px] p-5 sm:p-7 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-white text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-sky-300" />
                    <span>{currentSlide.badge}</span>
                  </div>

                  {safeSlides.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsPaused((p) => !p)}
                        aria-label={isPaused ? '继续自动轮播' : '暂停自动轮播'}
                        className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={handlePrev}
                        aria-label="上一张装机专题"
                        className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        aria-label="下一张装机专题"
                        className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="my-auto py-3 max-w-xl">
                  <h2 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-white leading-snug tracking-tight">
                    {currentSlide.title}
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-blue-100/90 leading-relaxed line-clamp-2">
                    {currentSlide.subtitle}
                  </p>

                  {currentSlide.previewSoftwares.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {currentSlide.previewSoftwares.map((sw) => (
                        <span
                          key={sw.slug}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/12 border border-white/15 text-xs text-white/95"
                        >
                          <SoftwareIcon
                            iconUrl={sanitizeChannelIconUrl(sw.iconUrl)}
                            name={sw.name}
                            slug={sw.slug}
                            categorySlug={sw.categorySlug}
                            size="sm"
                            className="w-4 h-4! rounded-xs!"
                          />
                          <span className="truncate max-w-[110px]">{getSimpleSoftwareName(sw.name)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/15">
                  <div className="flex items-center gap-3">
                    <Link
                      to={currentSlide.targetUrl}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-[#0F3B82] hover:bg-blue-50 text-xs font-bold shadow-xs transition-colors"
                    >
                      <span>查看方案</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <span className="text-xs text-blue-100/80 hidden sm:inline">{currentSlide.statsText}</span>
                  </div>

                  {safeSlides.length > 1 && (
                    <div className="flex items-center gap-1.5" role="tablist" aria-label="装机推荐轮播指示器">
                      {safeSlides.map((slide, idx) => (
                        <button
                          key={slide.id}
                          type="button"
                          role="tab"
                          aria-selected={idx === slideIdx % safeSlides.length}
                          aria-label={`切换到第 ${idx + 1} 张主题`}
                          onClick={() => setSlideIdx(idx)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            idx === slideIdx % safeSlides.length
                              ? 'w-6 bg-white'
                              : 'w-2 bg-white/40 hover:bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-[320px] flex items-center justify-center text-slate-400 text-xs">
              暂无装机主题横幅
            </div>
          )}
        </section>

        {/* 右侧：装机常用工具 (4 cols ≈ 33.3%, 2列x4行) */}
        <aside
          aria-label="装机常用工具"
          className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-4 shadow-2xs flex flex-col justify-between min-h-[320px]"
        >
          <div>
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-400 flex items-center justify-center">
                  <Wrench className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">装机常用工具</h2>
              </div>
              <button
                type="button"
                onClick={() => onJumpToSection('essentials-toolbox')}
                className="text-xs text-[#1769D2] dark:text-blue-400 hover:underline font-medium cursor-pointer"
              >
                维修工具箱 →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {quickTools.slice(0, 8).map((tool) => (
                <Link
                  key={tool.id}
                  to={`/software/${tool.slug}`}
                  className="group flex items-center gap-2 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 hover:border-[#B7CEFA] dark:hover:border-blue-800 hover:bg-[#F5F8FC] dark:hover:bg-slate-800/70 transition-colors min-w-0"
                >
                  <SoftwareIcon
                    iconUrl={sanitizeChannelIconUrl(tool.iconUrl)}
                    name={tool.name}
                    slug={tool.slug}
                    categorySlug={tool.categorySlug}
                    size="sm"
                    className="w-8 h-8! rounded-lg!"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-[#1769D2] dark:group-hover:text-blue-400 truncate">
                        {getSimpleSoftwareName(tool.name, tool.englishName || undefined)}
                      </span>
                      {tool.hasVerifiedSource && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
                          title="包含已审核可用官方来源"
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                      {tool.categoryName}
                      {tool.latestVersion ? ` · ${getSimpleVersion(tool.latestVersion)}` : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#1769D2]" />
              严格查询库内已发布软件
            </span>
            <button
              type="button"
              onClick={() => onJumpToSection('essentials-checklist')}
              className="text-[#1769D2] dark:text-blue-400 hover:underline font-medium cursor-pointer"
            >
              定制清单
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
