import React from 'react';
import { TrendingUp, Download, ShieldCheck } from 'lucide-react';
import { SoftwareItem } from '../../types/resource';

interface PopularDownloadsProps {
  softwareList: SoftwareItem[];
  onSelectSoftware: (software: SoftwareItem) => void;
}

export const PopularDownloads: React.FC<PopularDownloadsProps> = ({
  softwareList,
  onSelectSoftware,
}) => {
  if (!softwareList || softwareList.length === 0) {
    return null;
  }

  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              热门下载排行
            </h2>
            <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>真实获取频次</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            基于平台用户近期的官方渠道分发与下载计数综合排序
          </p>
        </div>
      </div>

      {/* 2-3 列紧凑列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {softwareList.map((item, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;

          return (
            <div
              key={item.id}
              onClick={() => onSelectSoftware(item)}
              className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                {/* 排名标识 */}
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 tabular-nums ${
                    isTop3
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {rank}
                </div>

                {/* 软件图标 */}
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                  {item.name.slice(0, 1)}
                </div>

                {/* 软件标题与分类 */}
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    <span>{item.categoryName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">v{item.latestVersion.version}</span>
                  </div>
                </div>
              </div>

              {/* 右侧下载量与详情按钮 */}
              <div className="text-right shrink-0">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  {item.downloadCount.toLocaleString()} 次
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSoftware(item);
                  }}
                  className="mt-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  获取软件
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
