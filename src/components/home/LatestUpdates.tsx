import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { SoftwareItem } from '../../types/resource';
import { SoftwareIcon } from '../common/SoftwareIcon';
import { getSimpleSoftwareName, getSimpleVersion } from '../../utils/softwareName';

interface LatestUpdatesProps {
  softwareList: SoftwareItem[];
  onSelectSoftware: (software: SoftwareItem) => void;
  onViewAllClick?: () => void;
  className?: string;
}

export const LatestUpdates: React.FC<LatestUpdatesProps> = ({
  softwareList,
  onSelectSoftware,
  onViewAllClick,
  className = '',
}) => {
  if (!softwareList || softwareList.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-[#141F33] rounded-lg border border-[#E5E9F0] dark:border-slate-800 p-4 sm:p-5 shadow-2xs ${className}`}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#EDF0F4] dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#1769D2]" />
          <h3 className="text-base sm:text-lg font-bold text-[#202938] dark:text-slate-100">
            全站最新版本发布动态
          </h3>
          <span className="text-xs text-[#667085] dark:text-slate-400 hidden sm:inline">
            | 原厂官方发布同步追踪，实时展示变更日志与更新日期
          </span>
        </div>

        {onViewAllClick && (
          <button
            onClick={onViewAllClick}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1769D2] dark:text-blue-400 hover:text-[#1258B5] transition-colors cursor-pointer"
          >
            <span>查看全部更新</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 动态网格：8 列紧凑高密度排版 · 纯净软件名 · 紧凑间距 */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-1.5 sm:gap-2">
        {softwareList.slice(0, 16).map((item) => {
          const simpleName = getSimpleSoftwareName(item.name, item.englishName);
          return (
            <Link
              key={item.id}
              to={`/software/${item.slug}`}
              title={item.name}
              className="p-1.5 sm:p-2 bg-slate-50/60 dark:bg-slate-900/40 rounded-lg border border-[#E5E9F0] dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col items-center justify-between group hover:shadow-xs text-center"
            >
              <div className="flex flex-col items-center w-full">
                <SoftwareIcon
                  iconUrl={item.iconUrl}
                  name={item.name}
                  slug={item.slug}
                  categorySlug={item.categorySlug}
                  size="md"
                  className="group-hover:scale-106 transition-transform"
                />
                <span className="w-full text-xs font-bold text-[#202938] dark:text-slate-100 group-hover:text-[#1769D2] transition-colors truncate mt-1 block">
                  {simpleName}
                </span>
                <div className="flex items-center justify-center gap-1 mt-0.5 text-[10px] text-slate-400 font-mono tabular-nums">
                  <span className="text-[#1769D2] dark:text-blue-400 font-semibold">{getSimpleVersion(item.latestVersion?.version)}</span>
                  <span>·</span>
                  <span>{item.latestVersion?.releaseDate || '近期'}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
