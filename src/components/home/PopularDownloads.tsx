import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ShieldCheck } from 'lucide-react';
import { SoftwareItem } from '../../types/resource';
import { SoftwareIcon } from '../common/SoftwareIcon';
import { getSimpleSoftwareName, getSimpleVersion } from '../../utils/softwareName';

interface PopularDownloadsProps {
  softwareList: SoftwareItem[];
  onSelectSoftware: (software: SoftwareItem) => void;
  className?: string;
}

export const PopularDownloads: React.FC<PopularDownloadsProps> = ({
  softwareList,
  onSelectSoftware,
  className = '',
}) => {
  if (!softwareList || softwareList.length === 0) {
    return null;
  }

  // 精选 8 款热门资源，紧密匹配中间 8 款精选与左侧分类高度
  const topList = softwareList.slice(0, 8);

  return (
    <div
      className={`bg-white dark:bg-[#141F33] rounded-xl border border-[#E5E9F0] dark:border-slate-800 p-3.5 sm:p-4 shadow-2xs h-full flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#EDF0F4] dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#D92D20]" />
            <h3 className="text-sm font-bold text-[#202938] dark:text-slate-100">
              热门获取排行榜
            </h3>
          </div>
          <span className="text-[11px] text-[#667085] dark:text-slate-400">
            全网热度
          </span>
        </div>

        <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60">
          {topList.map((item, index) => {
            const rank = index + 1;

            return (
              <div
                key={item.id}
                className="pt-1.5 pb-1.5 first:pt-0 flex items-center justify-between gap-2 group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rounded px-1.5 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* 排名数字前三位鲜明区分 */}
                  <span
                    className={`w-4.5 h-4.5 rounded flex items-center justify-center text-[11px] font-bold font-mono shrink-0 select-none ${
                      rank === 1
                        ? 'bg-[#D92D20] text-white shadow-2xs'
                        : rank === 2
                        ? 'bg-amber-500 text-white'
                        : rank === 3
                        ? 'bg-[#1769D2] text-white'
                        : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    {rank}
                  </span>

                  <SoftwareIcon
                    iconUrl={item.iconUrl}
                    name={item.name}
                    slug={item.slug}
                    categorySlug={item.categorySlug}
                    size="md"
                  />

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/software/${item.slug}`}
                      title={item.name}
                      className="text-xs font-semibold text-[#202938] dark:text-slate-100 group-hover:text-[#1769D2] transition-colors truncate block leading-tight"
                    >
                      {getSimpleSoftwareName(item.name, item.englishName)}
                    </Link>
                    <div className="text-[10px] text-[#667085] dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <span className="font-mono">{getSimpleVersion(item.latestVersion?.version)}</span>
                      <span>·</span>
                      <span className="text-slate-400 truncate">{item.categoryName}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {item.downloadCount.toLocaleString()} 次
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部保障与动态更新标识 */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>全网真实热度核验</span>
        </span>
        <span className="font-mono text-[10px]">动态加权排序</span>
      </div>
    </div>
  );
};
