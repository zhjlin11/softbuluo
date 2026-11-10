import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Compass,
  ShieldAlert,
  Wrench,
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { GamesChannelData } from '../../services/channelService';
import { SoftwareIcon } from '../common/SoftwareIcon';
import { getSimpleSoftwareName, sanitizeChannelIconUrl } from '../software/softwareHelpers';

interface GamesTaxonomyAndToolsProps {
  genreBlocks: GamesChannelData['genreBlocks'];
  upcomingGenreLabels: string[];
  companionTools: GamesChannelData['companionTools'];
  distributionStandards: GamesChannelData['distributionStandards'];
  redistributionNotice: string;
  onFilterByGenre: (genreSlug: string) => void;
}

export const GamesTaxonomyAndTools: React.FC<GamesTaxonomyAndToolsProps> = ({
  genreBlocks,
  upcomingGenreLabels,
  companionTools,
  distributionStandards,
  redistributionNotice,
  onFilterByGenre,
}) => {
  return (
    <section aria-label="游戏题材导航与配套实用软件" className="grid grid-cols-1 lg:grid-cols-12 gap-5 scroll-mt-20">
      {/* 左侧 8 栏：真实有已发布游戏的题材区块 + 分发合规准入规则 */}
      <div className="lg:col-span-8 space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E6ECF5] dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#1769D2]" />
                已上线游戏题材分类导航
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                仅展示当前已有已发布作品的题材板块，空品类自动折叠不凑数。
              </p>
            </div>
            {upcomingGenreLabels.length > 0 && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                审核扩充队列：{upcomingGenreLabels.join(' / ')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {genreBlocks.map((gb) => (
              <div
                key={gb.slug}
                className="p-4 rounded-xl bg-[#F5F8FC] dark:bg-slate-800/60 border border-[#E6ECF5] dark:border-slate-700/80 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {gb.name}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-300 font-semibold tabular-nums">
                      {gb.totalCount} 款
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {gb.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {gb.games.map((g) => (
                      <Link
                        key={g.id}
                        to={`/game/${g.slug}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-[#1769D2] hover:text-[#1769D2] transition-colors"
                      >
                        {getSimpleSoftwareName(g.name)}
                      </Link>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onFilterByGenre(gb.slug)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1769D2] dark:text-blue-400 hover:underline self-start cursor-pointer"
                >
                  在下方库中筛选「{gb.name}」
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* 版权与安全分发规范说明 */}
          <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
            {distributionStandards.map((st) => {
              const badgeClass =
                st.tone === 'emerald'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60'
                  : st.tone === 'amber'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60'
                    : 'bg-blue-50 text-[#1769D2] border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60';
              return (
                <div
                  key={st.title}
                  className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1.5"
                >
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                    {st.badge}
                  </span>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {st.title}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {st.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 右侧 4 栏：游戏配套辅助软件（明确标示“非游戏本体”） */}
      <aside className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-[#E6ECF5] dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between gap-4">
        <div className="space-y-3.5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#1769D2]" />
                游戏配套辅助软件
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                非游戏本体
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              辅助工具单独展示于软件详情页，不计入游戏中心总游戏数与游戏榜单。
            </p>
          </div>

          {companionTools.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">暂无已关联辅助工具</p>
          ) : (
            <div className="space-y-2.5">
              {companionTools.map((tool) => (
                <Link
                  key={tool.id}
                  to={`/software/${tool.slug}`}
                  className="group flex items-start gap-3 p-3 rounded-xl bg-[#F5F8FC] dark:bg-slate-800/70 hover:bg-blue-50/70 dark:hover:bg-slate-800 border border-[#E6ECF5] dark:border-slate-700/80 transition-colors"
                >
                  <SoftwareIcon
                    iconUrl={sanitizeChannelIconUrl(tool.iconUrl)}
                    name={getSimpleSoftwareName(tool.name)}
                    size="sm"
                    className="shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#1769D2] truncate">
                        {getSimpleSoftwareName(tool.name)}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#1769D2] shrink-0" />
                    </div>
                    <div className="text-[11px] font-medium text-[#1769D2] dark:text-blue-400 mt-0.5">
                      {tool.roleLabel}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {tool.summary}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>{redistributionNotice}</span>
        </div>
      </aside>
    </section>
  );
};
