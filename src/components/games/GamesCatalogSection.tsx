import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Download,
  Filter,
  Gamepad2,
  Info,
  RotateCcw,
  Search,
} from 'lucide-react';
import { SoftwareItem } from '../../types/resource';
import { GamesChannelData } from '../../services/channelService';
import { getSimpleSoftwareName, getSimpleVersion, formatLicenseLabel } from '../software/softwareHelpers';

interface GamesCatalogSectionProps {
  items: SoftwareItem[];
  total: number;
  loading: boolean;
  error: string | null;
  quickFilters: GamesChannelData['quickFilters'];
  activeGenre: string;
  activePlatform: string;
  activeLicense: string;
  activeSort: string;
  searchQuery: string;
  onUpdateParams: (updates: Record<string, string | null>) => void;
  onResetFilters: () => void;
  onRetry: () => void;
}

const FALLBACK_GAME_COVERS: Record<string, string> = {
  mindustry: '/images/games/mindustry-cover.jpg',
  supertuxkart: '/images/games/supertuxkart-cover.jpg',
};

export const GamesCatalogSection: React.FC<GamesCatalogSectionProps> = ({
  items,
  total,
  loading,
  error,
  quickFilters,
  activeGenre,
  activePlatform,
  activeLicense,
  activeSort,
  searchQuery,
  onUpdateParams,
  onResetFilters,
  onRetry,
}) => {
  const [localSearch, setLocalSearch] = React.useState(searchQuery);

  React.useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateParams({ q: localSearch.trim() || null, page: null });
  };

  const hasActiveFilters =
    activeGenre !== 'all' ||
    activePlatform !== 'all' ||
    activeLicense !== 'all' ||
    Boolean(searchQuery);

  return (
    <section id="games-catalog" aria-label="全部已发布游戏筛选与资源库" className="space-y-4 scroll-mt-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#1769D2]" />
            完整游戏资源库与多维检索
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            支持按题材、运行平台、开源许可协议与关键字实时筛选已公开发布游戏，点击任意卡片进入版本与来源核验详情。
          </p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          当前匹配 {total} 款游戏
        </span>
      </div>

      {/* 多维筛选工具栏 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E6ECF5] dark:border-slate-800 p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <form onSubmit={handleSubmitSearch} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="搜索游戏名称或玩法（如 Mindustry / 竞速）..."
              aria-label="搜索游戏名称或玩法"
              className="w-full pl-9 pr-20 py-2 rounded-xl bg-[#F5F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
            >
              搜索
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="按运行平台筛选"
              value={activePlatform}
              onChange={(e) => onUpdateParams({ platform: e.target.value, page: null })}
              className="px-3 py-2 rounded-xl bg-[#F5F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">全部平台</option>
              <option value="Windows">Windows</option>
              <option value="macOS">macOS</option>
              <option value="Linux">Linux</option>
              <option value="Android">Android</option>
            </select>

            <select
              aria-label="按许可协议筛选"
              value={activeLicense}
              onChange={(e) => onUpdateParams({ license: e.target.value, page: null })}
              className="px-3 py-2 rounded-xl bg-[#F5F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">全部许可类型</option>
              <option value="opensource">开源免费 (GPL/MIT)</option>
              <option value="free">免费分发</option>
            </select>

            <select
              aria-label="游戏列表排序方式"
              value={activeSort}
              onChange={(e) => onUpdateParams({ sort: e.target.value, page: null })}
              className="px-3 py-2 rounded-xl bg-[#F5F8FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="popular">按详情浏览热度</option>
              <option value="downloads">按下载触发次数</option>
              <option value="latest">按最新收录时间</option>
              <option value="name">按名称 A-Z</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重置条件
              </button>
            )}
          </div>
        </div>

        {/* 题材快速胶囊 */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          {quickFilters.map((qf) => (
            <button
              key={qf.slug}
              type="button"
              onClick={() => onUpdateParams({ genre: qf.slug, page: null })}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeGenre === qf.slug
                  ? 'bg-[#1769D2] text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {qf.name} ({qf.count})
            </button>
          ))}
        </div>
      </div>

      {/* 结果网格 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2].map((k) => (
            <div
              key={k}
              className="h-72 rounded-2xl bg-white dark:bg-slate-900 border border-[#E6ECF5] dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50 space-y-2">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-[#1769D2] text-white text-xs font-medium cursor-pointer"
          >
            重新查询
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-[#E6ECF5] dark:border-slate-800 space-y-3">
          <Gamepad2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            当前筛选条件下暂无匹配的已发布游戏
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            可尝试放宽平台或关键字条件，软游部落绝不以未审核草稿或非游戏软件填补筛选结果。
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置筛选条件
          </button>
        </div>
      ) : (
        <div
          className={`grid gap-5 ${
            items.length === 1
              ? 'grid-cols-1 max-w-2xl'
              : items.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {items.map((item) => {
            const cover =
              item.coverUrl ||
              FALLBACK_GAME_COVERS[item.slug] ||
              '/images/games/hero-indie-collection.svg';
            const versionText = getSimpleVersion(item.latestVersion?.version);
            const lic = formatLicenseLabel(item.licenseType);
            return (
              <article
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E6ECF5] dark:border-slate-800 overflow-hidden shadow-2xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <Link to={`/game/${item.slug}`} className="block relative aspect-[16/9] bg-slate-950 overflow-hidden">
                    <img
                      src={cover}
                      alt={getSimpleSoftwareName(item.name)}
                      width={640}
                      height={360}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-950/75 text-white border border-white/15">
                      {item.genre || item.categoryName || '开源单机'}
                    </span>
                    {versionText && (
                      <span className="absolute top-2.5 right-2.5 text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-950/75 text-blue-200 border border-white/15">
                        {versionText}
                      </span>
                    )}
                  </Link>

                  <div className="p-4 space-y-2.5">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        <Link to={`/game/${item.slug}`} className="hover:text-[#1769D2] transition-colors">
                          {getSimpleSoftwareName(item.name)}
                        </Link>
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.developer || '开源团队'} · {lic.label}（{item.licenseType || 'GPL'}）·{' '}
                        {item.latestVersion?.fileSize || '官网获取'}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      {item.sourceVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          含已审核健康直连
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Info className="w-3.5 h-3.5 text-[#1769D2]" />
                          {item.sourceStatus || '已登记官方渠道（待复核）'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/40 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {item.supportedPlatforms || 'Windows 10/11'}
                  </span>
                  <Link
                    to={`/game/${item.slug}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-semibold shrink-0 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    详情与入口
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
