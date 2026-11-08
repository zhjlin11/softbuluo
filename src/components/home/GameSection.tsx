import React from 'react';
import { Gamepad2, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { GameItem } from '../../types/resource';

interface GameSectionProps {
  games: GameItem[];
}

export const GameSection: React.FC<GameSectionProps> = ({ games }) => {
  if (!games || games.length === 0) {
    return null;
  }

  return (
    <section id="games" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              游戏中心
            </h2>
            <span className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>正版与开源游戏</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            发现优质独立游戏、自由开源作品与官方正版获取渠道
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {games.map((game) => (
          <div
            key={game.id}
            className="flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all group"
          >
            {/* 游戏封面横幅 (统一 16:9 或 3:2 视觉比例) */}
            <div
              className={`relative h-36 bg-gradient-to-br ${game.coverGradient} p-4 flex flex-col justify-between overflow-hidden`}
            >
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-semibold text-white/90 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded">
                  {game.badgeText}
                </span>
                <span className="text-[11px] font-mono text-white/80 tabular-nums">
                  {game.releaseYear}
                </span>
              </div>

              <div className="z-10">
                <h3 className="text-base font-bold text-white tracking-tight drop-shadow-xs line-clamp-1">
                  {game.title}
                </h3>
                <span className="text-xs text-white/80 line-clamp-1">
                  {game.genre}
                </span>
              </div>

              {/* 背景装饰光感 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
            </div>

            {/* 游戏信息 */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {game.summary}
                </p>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400 dark:text-slate-500 mb-4">
                  <span>{game.developer}</span>
                  <span aria-hidden="true">·</span>
                  <span>{game.platform.join(', ')}</span>
                </div>
              </div>

              {/* 官方渠道直达按钮 */}
              <a
                href={game.officialChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 rounded-lg transition-colors"
              >
                <span>前往正版渠道</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
