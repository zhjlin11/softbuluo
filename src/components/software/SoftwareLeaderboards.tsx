import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, DownloadCloud, Eye } from 'lucide-react';
import { SoftwareIcon } from '../common/SoftwareIcon';
import { ChannelSoftwareItem } from '../../services/channelService';
import { getSimpleSoftwareName, getSimpleVersion, sanitizeChannelIconUrl } from './softwareHelpers';

interface SoftwareLeaderboardsProps {
  mostViewed: ChannelSoftwareItem[];
  mostDownloaded: ChannelSoftwareItem[];
  headingTitle?: string;
  headingSubtitle?: string;
  viewTopTitle?: string;
}

interface LeaderboardPanelProps {
  topTitle: string;
  lowTrafficTitle: string;
  subtitle: string;
  items: ChannelSoftwareItem[];
  mode: 'views' | 'downloads';
  icon: React.ReactNode;
  accentBg: string;
}

const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  topTitle,
  lowTrafficTitle,
  subtitle,
  items,
  mode,
  icon,
  accentBg,
}) => {
  const activeItems = items
    .filter((item) => (mode === 'views' ? item.viewCount : item.downloadCount) > 0)
    .slice(0, 10);
  const isLowTraffic = activeItems.length > 0 && activeItems.length < 5;
  const headingTitle =
    activeItems.length === 0
      ? lowTrafficTitle
      : isLowTraffic
        ? lowTrafficTitle
        : `${topTitle} TOP ${activeItems.length}`;
  const countBadgeText =
    activeItems.length === 0
      ? '暂无记录'
      : isLowTraffic
        ? `实有 ${activeItems.length} 条记录`
        : `TOP ${activeItems.length}`;

  return (
    <div className="min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accentBg}`}>
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {headingTitle}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
          </div>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 tabular-nums">
          {countBadgeText}
        </span>
      </div>

      {activeItems.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-400">
          {mode === 'views' ? '暂无真实浏览记录' : '暂无真实下载触发记录'}
        </div>
      ) : (
        <ol className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {activeItems.map((item, idx) => {
            const rank = idx + 1;
            const rankBadgeClass =
              rank === 1
                ? 'bg-amber-500 text-white shadow-2xs'
                : rank === 2
                  ? 'bg-slate-400 text-white'
                  : rank === 3
                    ? 'bg-orange-400 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';

            const metricValue = mode === 'views' ? item.viewCount : item.downloadCount;
            const metricLabel =
              mode === 'views' ? `${metricValue} 次浏览` : `${metricValue} 次触发`;

            return (
              <li key={item.id}>
                <Link
                  to={item.type === 'GAME' ? `/game/${item.slug}` : `/software/${item.slug}`}
                  className="group flex items-center gap-3 py-2.5 px-1.5 -mx-1.5 rounded-lg hover:bg-[#F5F8FC] dark:hover:bg-slate-800/70 transition-colors min-w-0"
                >
                  <span
                    className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center shrink-0 tabular-nums ${rankBadgeClass}`}
                  >
                    {rank}
                  </span>

                  <SoftwareIcon
                    iconUrl={sanitizeChannelIconUrl(item.iconUrl)}
                    name={item.name}
                    slug={item.slug}
                    categorySlug={item.categorySlug}
                    size="sm"
                    className="w-8 h-8! rounded-lg!"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 group-hover:text-[#1769D2] dark:group-hover:text-blue-400 truncate">
                        {getSimpleSoftwareName(item.name, item.englishName || undefined)}
                      </span>
                      {item.latestVersion && (
                        <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 truncate max-w-[85px]">
                          {getSimpleVersion(item.latestVersion)}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                      {item.categoryName}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums shrink-0 ${
                      metricValue > 0
                        ? 'text-slate-600 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {mode === 'views' && <Eye className="w-3.5 h-3.5 text-slate-400" />}
                    {metricLabel}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};

export const SoftwareLeaderboards: React.FC<SoftwareLeaderboardsProps> = ({
  mostViewed,
  mostDownloaded,
  headingTitle = '人气与下载榜单',
  headingSubtitle = '仅展示真实非零统计记录，不凑数不填充；明确区分页面浏览次数与下载触发次数',
  viewTopTitle = '热门关注',
}) => {
  return (
    <section aria-labelledby="leaderboards-heading" className="space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="leaderboards-heading" className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {headingTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {headingSubtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <LeaderboardPanel
          topTitle={viewTopTitle}
          lowTrafficTitle="近期关注度动态"
          subtitle="统计口径：站内详情页真实浏览次数（非下载数）"
          items={mostViewed}
          mode="views"
          icon={<TrendingUp className="w-4 h-4" />}
          accentBg="bg-blue-50 dark:bg-blue-950/70 text-[#1769D2] dark:text-blue-400"
        />
        <LeaderboardPanel
          topTitle="近期下载点击"
          lowTrafficTitle="近期下载点击动态"
          subtitle="统计口径：站内非测试下载触发事件数（非实际安装包传输完成数）"
          items={mostDownloaded}
          mode="downloads"
          icon={<DownloadCloud className="w-4 h-4" />}
          accentBg="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400"
        />
      </div>
    </section>
  );
};
