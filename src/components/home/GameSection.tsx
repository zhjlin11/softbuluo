import React, { useState } from 'react';
import {
  Gamepad2,
  ExternalLink,
  ShieldCheck,
  Tag,
  Monitor,
  CheckCircle2,
  Maximize2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { GameItem } from '../../types/resource';
import { GAME_SCREENSHOTS, getResourceScreenshots } from '../../config/screenshots';

interface GameSectionProps {
  games: GameItem[];
}

export const GameSection: React.FC<GameSectionProps> = ({ games }) => {
  if (!games || games.length === 0) {
    return null;
  }

  const count = games.length;

  // 记录每款游戏当前选中的截图索引 (支持动态切换大图)
  const [activeScreens, setActiveScreens] = useState<Record<string, number>>({});
  const [lightboxImg, setLightboxImg] = useState<{ url: string; title: string; caption: string } | null>(null);

  const getActiveIndex = (slug: string) => activeScreens[slug] || 0;

  const setGameScreenIndex = (slug: string, idx: number) => {
    setActiveScreens((prev) => ({ ...prev, [slug]: idx }));
  };

  return (
    <section id="games" className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mb-10 scroll-mt-20">
      <div className="bg-[#0C1524] rounded-2xl border border-slate-800 p-5 sm:p-7 text-white shadow-xl overflow-hidden relative">
        {/* 背景轻微环境光 */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* 头部频道标题栏 */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-800/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  正版与开源游戏中心
                </h2>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/90 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  100% 官方正版 · 零暗推
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                汇聚官方自由开源神作、单机独立精品与 Steam / 原厂正规分发渠道，提供高清实机截图鉴赏
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>精选收录 {count} 款高口碑神作</span>
          </div>
        </div>

        {/* 核心大图展示网格 (按数量自适应布局：双列高规格大图卡片) */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {games.map((game) => {
            const screens = getResourceScreenshots(game.slug);
            const activeIdx = getActiveIndex(game.slug);
            const currentScreen = screens[activeIdx] || screens[0] || {
              url: game.coverUrl || '/images/games/mindustry-cover.jpg',
              caption: game.title,
            };

            return (
              <div
                key={game.id}
                className="group flex flex-col bg-slate-900/90 rounded-xl border border-slate-800 hover:border-indigo-500/60 transition-all duration-300 shadow-md overflow-hidden"
              >
                {/* 1. 16:9 高清实机画面大图展示区 */}
                <div className="relative aspect-[16/9] w-full bg-slate-950 overflow-hidden">
                  <img
                    src={currentScreen.url}
                    alt={game.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                    onClick={() =>
                      setLightboxImg({
                        url: currentScreen.url,
                        title: game.title,
                        caption: currentScreen.caption,
                      })
                    }
                  />

                  {/* 悬停放大查看按钮 */}
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxImg({
                        url: currentScreen.url,
                        title: game.title,
                        caption: currentScreen.caption,
                      })
                    }
                    className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 hover:bg-black/90 text-white/90 hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-white/10"
                    title="点击查看 1080P 实机大图"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  {/* 顶部角标徽章 */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="text-[11px] font-bold text-white bg-indigo-600/90 backdrop-blur-md px-2.5 py-1 rounded-md shadow-sm">
                      {game.badgeText || '官方正版'}
                    </span>
                    <span className="text-[11px] font-medium text-emerald-300 bg-emerald-950/80 backdrop-blur-md px-2 py-0.5 rounded border border-emerald-800/60">
                      {game.licenseType === 'OPEN_SOURCE' ? '自由开源免费' : '官方正版发行'}
                    </span>
                  </div>

                  {/* 底部截图说明条与切换指示器 */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-3 pt-6 flex items-center justify-between text-xs text-white">
                    <span className="truncate pr-2 font-medium drop-shadow-sm text-slate-200">
                      {currentScreen.caption || `${game.title} 实机运行画面`}
                    </span>

                    {/* 截图切换缩略指示点 */}
                    {screens.length > 1 && (
                      <div className="flex items-center gap-1.5 shrink-0 bg-black/40 backdrop-blur-xs px-2 py-1 rounded-full border border-white/10">
                        {screens.map((_, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGameScreenIndex(game.slug, sIdx);
                            }}
                            className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                              sIdx === activeIdx
                                ? 'bg-indigo-400 w-4'
                                : 'bg-white/40 hover:bg-white/70'
                            }`}
                            title={`切换至实机截图 ${sIdx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. 缩略图横排选看栏 (支持多张大图即时预览切换) */}
                {screens.length > 1 && (
                  <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2.5 overflow-x-auto scrollbar-none">
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      实机图库:
                    </span>
                    {screens.map((sc, sIdx) => (
                      <button
                        key={sc.url}
                        type="button"
                        onClick={() => setGameScreenIndex(game.slug, sIdx)}
                        className={`relative shrink-0 w-16 aspect-video rounded overflow-hidden border transition-all cursor-pointer ${
                          sIdx === activeIdx
                            ? 'border-indigo-400 ring-2 ring-indigo-500/30'
                            : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                        title={sc.caption}
                      >
                        <img src={sc.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* 3. 游戏元信息与正规分发渠道获取入口 */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                        {game.title}
                      </h3>
                      <span className="text-xs font-mono text-slate-400">
                        {game.releaseYear} 年发行
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-300 mb-3">
                      <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/80 font-medium">
                        {game.genre}
                      </span>
                      <span className="text-slate-400">开发方: {game.developer}</span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed mb-4">
                      {game.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Monitor className="w-3.5 h-3.5 text-slate-400" />
                      <span>{game.platform.join(' / ')}</span>
                    </div>

                    <a
                      href={game.officialChannelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer self-start sm:self-auto"
                    >
                      <span>前往官方原厂获取</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. 游戏实机截图全屏 Lightbox 弹窗 */}
      {lightboxImg && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fade-in"
        >
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 select-none">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold">{lightboxImg.title}</span>
              <span className="text-xs text-white/60">实机高清截图</span>
            </div>
            <button
              type="button"
              onClick={() => setLightboxImg(null)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              关闭 (ESC)
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center my-4 overflow-hidden">
            <img
              src={lightboxImg.url}
              alt={lightboxImg.caption}
              className="max-h-[82vh] max-w-[94vw] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="pt-3 border-t border-white/10 text-center text-xs text-white/80">
            {lightboxImg.caption}
          </div>
        </div>
      )}
    </section>
  );
};
