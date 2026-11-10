import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Gamepad2,
  ShieldCheck,
  Sparkles,
  Wrench,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { GamesChannelData, HeroSlideItem } from '../../services/channelService';
import { getSimpleSoftwareName, getSimpleVersion } from '../software/softwareHelpers';

interface GamesHeaderStripProps {
  meta?: GamesChannelData['meta'] | null;
}

export const GamesHeaderStrip: React.FC<GamesHeaderStripProps> = ({ meta }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E6ECF5] dark:border-slate-800 px-4 sm:px-6 py-4 shadow-2xs">
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
      <Link to="/" className="hover:text-[#1769D2] transition-colors">
        首页
      </Link>
      <ChevronRight className="w-3.5 h-3.5" />
      <span className="text-slate-900 dark:text-slate-100 font-medium">游戏中心</span>
    </nav>

    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/70 text-[11px] font-semibold">
            <Gamepad2 className="w-3.5 h-3.5" />
            游戏中心 UI 3.0
          </span>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full font-medium">
            开源独立 · 官方正版分流 · 无破解捆绑
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-2">
          精品独立与开源 PC 游戏中心
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
          收录合法开源免费单机游戏与正版发行渠道入口，提供高清实机画面、真实题材分类与可溯源来源明细，不混入配套工具或未发布草稿。
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2 shrink-0">
        <div className="px-3 py-2 rounded-xl bg-[#F5F8FC] dark:bg-slate-800/70 border border-[#E6ECF5] dark:border-slate-700/80">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">已发布游戏</div>
          <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
            {meta ? `${meta.totalGamesCount} 款` : '--'}
          </div>
        </div>
        <div className="px-3 py-2 rounded-xl bg-[#F5F8FC] dark:bg-slate-800/70 border border-[#E6ECF5] dark:border-slate-700/80">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">开源免费占比</div>
          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {meta
              ? meta.totalGamesCount > 0
                ? `${meta.openSourceGamesCount}/${meta.totalGamesCount}`
                : '0'
              : '--'}
          </div>
        </div>
        <div className="px-3 py-2 rounded-xl bg-[#F5F8FC] dark:bg-slate-800/70 border border-[#E6ECF5] dark:border-slate-700/80">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">已登记来源</div>
          <div className="text-base font-bold text-[#1769D2] dark:text-blue-400 tabular-nums">
            {meta ? `${meta.registeredSourcesCount} 条` : '--'}
          </div>
        </div>
        <div className="px-3 py-2 rounded-xl bg-[#F5F8FC] dark:bg-slate-800/70 border border-[#E6ECF5] dark:border-slate-700/80">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">配套工具(单列)</div>
          <div className="text-base font-bold text-slate-700 dark:text-slate-200 tabular-nums">
            {meta ? `${meta.companionToolsCount} 款` : '--'}
          </div>
        </div>
      </div>
    </div>
  </div>
);

interface GamesPortalHeroProps {
  meta: GamesChannelData['meta'];
  heroSlides: HeroSlideItem[];
  quickFilters: GamesChannelData['quickFilters'];
  spotlightGames: GamesChannelData['spotlightGames'];
  activeGenre: string;
  onSelectGenre: (genreSlug: string) => void;
  onJumpSpotlight: () => void;
  onJumpTools: () => void;
  onJumpCatalog: () => void;
}

export const GamesPortalHero: React.FC<GamesPortalHeroProps> = ({
  meta,
  heroSlides,
  quickFilters,
  spotlightGames,
  activeGenre,
  onSelectGenre,
  onJumpSpotlight,
  onJumpTools,
  onJumpCatalog,
}) => {
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % heroSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    if (slideIdx >= heroSlides.length) setSlideIdx(0);
  }, [heroSlides.length, slideIdx]);

  const currentSlide = heroSlides[slideIdx] || heroSlides[0];

  return (
    <section aria-label="游戏中心头部与焦点推荐" className="space-y-4">
      <GamesHeaderStrip meta={meta} />

      {/* 2. 真实题材快捷过滤条 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 inline-flex items-center gap-1 mr-1">
            <Compass className="w-3.5 h-3.5 text-[#1769D2]" />
            游戏题材：
          </span>
          {quickFilters.map((qf) => {
            const isActive = activeGenre === qf.slug;
            return (
              <button
                key={qf.slug}
                type="button"
                onClick={() => onSelectGenre(qf.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#1769D2] text-white shadow-2xs'
                    : 'bg-[#F5F8FC] dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700'
                }`}
              >
                {qf.name}
                <span className={`ml-1.5 tabular-nums ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                  ({qf.count})
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onJumpSpotlight}
            className="text-slate-600 dark:text-slate-300 hover:text-[#1769D2] font-medium px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            实机截图鉴赏
          </button>
          <button
            type="button"
            onClick={onJumpTools}
            className="text-slate-600 dark:text-slate-300 hover:text-[#1769D2] font-medium px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            录屏辅助工具
          </button>
          <button
            type="button"
            onClick={onJumpCatalog}
            className="inline-flex items-center gap-1 text-[#1769D2] dark:text-blue-400 font-semibold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/70 transition-colors cursor-pointer"
          >
            筛选游戏库
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 3. 游戏主题视觉焦点 Banner + 右侧快速引导面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 relative rounded-2xl overflow-hidden bg-[#0A1324] border border-slate-800 shadow-md h-[320px] sm:h-[360px] flex flex-col justify-end">
          {currentSlide && (
            <>
              <img
                src={currentSlide.coverImage || '/images/games/hero-indie-collection.svg'}
                alt={currentSlide.title}
                width={1280}
                height={720}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#081020] via-[#081020]/70 to-[#081020]/25" />

              {heroSlides.length > 1 && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="上一张游戏焦点图"
                    onClick={() =>
                      setSlideIdx((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
                    }
                    className="w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900/90 text-white border border-white/15 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="下一张游戏焦点图"
                    onClick={() => setSlideIdx((prev) => (prev + 1) % heroSlides.length)}
                    className="w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900/90 text-white border border-white/15 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="relative z-10 p-5 sm:p-7 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-600/90 text-white text-[11px] font-semibold">
                    <Sparkles className="w-3 h-3" />
                    {currentSlide.badge}
                  </span>
                  <span className="text-[11px] text-slate-200 bg-white/10 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/15">
                    {currentSlide.statsText}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {currentSlide.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-200/95 max-w-2xl leading-relaxed line-clamp-2">
                  {currentSlide.subtitle}
                </p>

                <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    to={currentSlide.targetUrl}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1769D2] hover:bg-blue-600 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    进入官方详情与渠道入口
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {heroSlides.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      {heroSlides.map((s, idx) => (
                        <button
                          key={s.id}
                          type="button"
                          aria-label={`切换到焦点图 ${idx + 1}: ${s.title}`}
                          onClick={() => setSlideIdx(idx)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            idx === slideIdx
                              ? 'w-6 bg-blue-400'
                              : 'w-2 bg-white/40 hover:bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 右侧：快速直达与真实性/合规提示卡 */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-[#E6ECF5] dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-2xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1769D2]" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  已上线游戏快速通道
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                {spotlightGames.length} 款可直达
              </span>
            </div>

            <div className="space-y-2.5">
              {spotlightGames.map((game) => {
                const versionBadge = getSimpleVersion(game.latestVersion || undefined);
                return (
                  <Link
                    key={game.id}
                    to={`/game/${game.slug}`}
                    className="group flex items-center gap-3 p-2.5 rounded-xl bg-[#F5F8FC] dark:bg-slate-800/70 hover:bg-blue-50/80 dark:hover:bg-slate-800 border border-[#E6ECF5] dark:border-slate-700/70 transition-colors"
                  >
                    <img
                      src={game.coverUrl}
                      alt={getSimpleSoftwareName(game.name)}
                      width={64}
                      height={40}
                      className="w-16 h-10 rounded-lg object-cover shrink-0 border border-slate-200/80 dark:border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#1769D2] truncate">
                          {getSimpleSoftwareName(game.name)}
                        </span>
                        {versionBadge && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                            {versionBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {game.genreName} · {game.fileSize || '官方发行'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1769D2] shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>核验实情：</strong>
                {meta.verifiedSha256Count > 0
                  ? `含 ${meta.verifiedSha256Count} 条已核验 SHA-256 来源；具体文件校验状态请以各游戏详情页为准。`
                  : '当前已发布游戏来源以官网页 / GitHub Releases / 正版商店引导为主，尚未附带实机 SHA-256 校验印章，严禁虚标安全认证。'}
              </span>
            </div>
            <button
              type="button"
              onClick={onJumpTools}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-[#1769D2]" />
              查看游戏录屏与回放辅助工具（非游戏本体）
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
