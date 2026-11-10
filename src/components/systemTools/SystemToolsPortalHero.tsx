import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Pause,
  Play,
  Layers,
  LayoutGrid,
  Compass,
} from 'lucide-react';
import { HeroSlideItem } from '../../services/channelService';
import { SystemToolChannelItem, SystemToolDomainBlock } from '../../services/channelService';
import { SoftwareIcon } from '../common/SoftwareIcon';
import { getSimpleSoftwareName, sanitizeChannelIconUrl } from '../software/softwareHelpers';

interface SystemToolsPortalHeroProps {
  meta: {
    totalToolsCount: number;
    utilityToolsCount: number;
    highRiskToolsCount: number;
    registeredSourcesCount: number;
    approvedHealthySourcesCount: number;
    topicsCount: number;
  };
  domains: SystemToolDomainBlock[];
  activeDomainSlug: string;
  onSelectDomain: (slug: string) => void;
  heroSlides: HeroSlideItem[];
  commonTools: SystemToolChannelItem[];
  onJumpToCatalog: () => void;
  onJumpToScenarios: () => void;
}

export const SystemToolsPortalHero: React.FC<SystemToolsPortalHeroProps> = ({
  meta,
  domains,
  activeDomainSlug,
  onSelectDomain,
  heroSlides,
  commonTools,
  onJumpToCatalog,
  onJumpToScenarios,
}) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const slidesCount = heroSlides.length;
  const allowCarousel = slidesCount >= 2;

  useEffect(() => {
    if (!allowCarousel || isPaused || prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % slidesCount);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [allowCarousel, isPaused, prefersReducedMotion, slidesCount]);

  const safeIdx = slidesCount > 0 ? slideIdx % slidesCount : 0;
  const currentSlide = heroSlides[safeIdx];

  const handlePrev = () => {
    if (!allowCarousel) return;
    setSlideIdx((prev) => (prev - 1 + slidesCount) % slidesCount);
  };

  const handleNext = () => {
    if (!allowCarousel) return;
    setSlideIdx((prev) => (prev + 1) % slidesCount);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!allowCarousel || touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) > 40) {
      if (delta > 0) handlePrev();
      else handleNext();
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. 紧凑频道标题区与面包屑 */}
      <header className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 px-4 sm:px-6 py-4 shadow-2xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="min-w-0">
            <nav
              aria-label="面包屑导航"
              className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1"
            >
              <Link to="/" className="hover:text-[#1769D2] dark:hover:text-blue-400 transition-colors">
                首页
              </Link>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <span className="text-slate-900 dark:text-slate-200 font-medium">系统工具</span>
            </nav>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                专业电脑维护与系统工具中心
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                电脑维护、硬件诊断、磁盘管理与网络排障发现中心 · 拒绝篡改镜像与激活脚本
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:shrink-0">
            <span
              title={`已登记 ${meta.registeredSourcesCount} 条可用来源，其中 ${meta.approvedHealthySourcesCount} 条已人工审核且巡检健康直连；另有 ${meta.highRiskToolsCount} 款高风险磁盘/引导工具附备份提醒`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/70 text-xs font-medium tabular-nums"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              {meta.totalToolsCount} 款工具（{meta.utilityToolsCount} 款维保实操）· {meta.approvedHealthySourcesCount}/{meta.registeredSourcesCount} 条审核直连
            </span>
            <button
              type="button"
              onClick={onJumpToScenarios}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[#1769D2]" />
              按故障排障
            </button>
            <Link
              to="/essentials"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-[#1769D2]" />
              装机必备
            </Link>
            <button
              type="button"
              onClick={onJumpToCatalog}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              全量工具检索
            </button>
          </div>
        </div>
      </header>

      {/* 2. 高频工具分类快捷入口 */}
      <div
        aria-label="高频工具分类快捷导航"
        className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 px-3 py-2.5 shadow-2xs overflow-x-auto"
      >
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            type="button"
            onClick={() => onSelectDomain('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeDomainSlug === 'all'
                ? 'bg-[#1769D2] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            全部维保领域 ({meta.totalToolsCount})
          </button>
          {domains.map((domain) => {
            const isActive = activeDomainSlug === domain.slug;
            return (
              <button
                key={domain.slug}
                type="button"
                onClick={() => onSelectDomain(domain.slug)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#1769D2] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{domain.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {domain.totalCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 首屏焦点 Banner (~65%) + 右侧维修常用工具矩阵 (~35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* 左侧专题大图推荐 (支持键盘/触控/暂停/减动效) */}
        <section
          aria-label="系统维护焦点专题"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="lg:col-span-8 min-w-0 relative rounded-2xl overflow-hidden border border-[#224A82]/30 shadow-sm min-h-[300px] sm:min-h-[340px] flex flex-col justify-between p-5 sm:p-7 text-white bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1769D2]"
        >
          {currentSlide && (
            <>
              {/* 原创矢量科技横幅底图 (本地 0ms SVG 资产) */}
              {currentSlide.coverImage && (
                <img
                  src={currentSlide.coverImage}
                  alt=""
                  aria-hidden="true"
                  fetchPriority="high"
                  className="absolute inset-0 w-full h-full object-cover object-right opacity-95 pointer-events-none select-none"
                />
              )}
              {/* 深色渐变遮罩保障正文对比度 */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-[#0A182D]/95 via-[#0E2447]/88 to-[#102A52]/40 pointer-events-none"
              />

              {/* 顶部标签与轮播控制器 */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-medium border border-white/20">
                  <Wrench className="w-3.5 h-3.5 text-sky-300" />
                  {currentSlide.badge}
                </span>

                {allowCarousel && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsPaused((p) => !p)}
                      aria-label={isPaused ? '恢复专题轮播' : '暂停专题轮播'}
                      className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={handlePrev}
                      aria-label="上一张专题推荐"
                      className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      aria-label="下一张专题推荐"
                      className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* 中部核心标题与代表工具直达 */}
              <div className="relative z-10 my-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-7 min-w-0">
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
                      查看专题方案
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <span className="text-xs text-blue-100/95 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/15">
                      {currentSlide.statsText}
                    </span>
                  </div>
                </div>

                {currentSlide.previewSoftwares.length > 0 && (
                  <div className="hidden md:flex md:col-span-5 flex-col gap-1.5 bg-slate-950/55 backdrop-blur-sm rounded-xl p-3 border border-white/15">
                    <span className="text-[11px] font-medium text-sky-200/90">专题包含核心工具</span>
                    <div className="space-y-1.5">
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
                            className="w-7! h-7! rounded-md! shrink-0"
                          />
                          <span className="text-xs font-medium text-white truncate flex-1">
                            {getSimpleSoftwareName(sw.name)}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-white/70 shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 底部指示器 */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {allowCarousel ? (
                    heroSlides.map((sl, idx) => (
                      <button
                        key={sl.id}
                        type="button"
                        onClick={() => setSlideIdx(idx)}
                        aria-label={`切换至第 ${idx + 1} 个专题`}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          idx === safeIdx ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/65'
                        }`}
                      />
                    ))
                  ) : (
                    <span className="text-[11px] text-blue-100/80">精选运维专场指南</span>
                  )}
                </div>
                <span className="text-[11px] text-blue-100/80 tabular-nums">
                  {safeIdx + 1} / {slidesCount}
                </span>
              </div>
            </>
          )}
        </section>

        {/* 右侧：维修常用工具推荐 (桌面端 2列 × 4行，仅真实已发布维保工具) */}
        <aside
          aria-label="维修常用工具推荐"
          className="lg:col-span-4 min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-[#E6ECF5] dark:border-slate-800 p-4 sm:p-5 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                维修常用工具
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                装机检测 · 磁盘救援 · 抓包卸载直达
              </p>
            </div>
            <button
              type="button"
              onClick={onJumpToCatalog}
              className="text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline cursor-pointer shrink-0"
            >
              全部工具 &gt;
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 flex-1">
            {commonTools.slice(0, 8).map((tool) => {
              const shortName = getSimpleSoftwareName(tool.name, tool.englishName || undefined) || tool.name;
              return (
                <Link
                  key={tool.id}
                  to={`/software/${tool.slug}`}
                  title={`${tool.name} · ${tool.domainName}${tool.riskLevel === 'HIGH' ? '（含高风险提示）' : ''}`}
                  className="group min-w-0 flex items-center gap-2.5 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-[#B7CEFA] dark:hover:border-blue-800 hover:bg-[#F5F8FC] dark:hover:bg-slate-800/70 transition-all"
                >
                  <SoftwareIcon
                    iconUrl={sanitizeChannelIconUrl(tool.iconUrl)}
                    name={tool.name}
                    slug={tool.slug}
                    categorySlug={tool.categorySlug}
                    size="sm"
                    className="w-9! h-9! rounded-lg! shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-[#1769D2] dark:group-hover:text-blue-400 truncate">
                        {shortName}
                      </span>
                      {tool.riskLevel === 'HIGH' && (
                        <AlertTriangle
                          className="w-3 h-3 text-amber-500 shrink-0"
                          aria-label="高风险操作需备份"
                        />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {tool.domainName}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
};
