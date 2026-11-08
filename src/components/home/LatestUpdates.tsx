import React from 'react';
import { Clock, ArrowRight, ShieldCheck, Calendar } from 'lucide-react';
import { SoftwareItem } from '../../types/resource';

interface LatestUpdatesProps {
  softwareList: SoftwareItem[];
  onSelectSoftware: (software: SoftwareItem) => void;
  onViewAllClick?: () => void;
}

export const LatestUpdates: React.FC<LatestUpdatesProps> = ({
  softwareList,
  onSelectSoftware,
  onViewAllClick,
}) => {
  if (!softwareList || softwareList.length === 0) {
    return null;
  }

  return (
    <section id="updates" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              最新版本更新
            </h2>
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>官方发布核验</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            追踪收录软件的最新稳定版本与更新日志
          </p>
        </div>

        <button
          onClick={onViewAllClick}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors self-start sm:self-auto"
        >
          <span>查看全部更新动态</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2-3 列更新日志卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {softwareList.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectSoftware(item)}
            className="flex flex-col justify-between p-4.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div>
              {/* 头部：名称与版本 */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {item.name.slice(0, 1)}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.name}
                  </h3>
                </div>

                <span className="text-xs font-mono font-medium text-blue-600 dark:text-blue-400 tabular-nums shrink-0">
                  v{item.latestVersion.version}
                </span>
              </div>

              {/* 更新日志摘要 */}
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/70">
                {item.latestVersion.changelog || "优化系统稳定性并修复若干已知异常。"}
              </p>
            </div>

            {/* 底部信息：更新日期与详情 */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1 tabular-nums">
                <Calendar className="w-3.5 h-3.5" />
                <span>{item.latestVersion.releaseDate}</span>
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSoftware(item);
                }}
                className="text-slate-700 dark:text-slate-300 font-medium hover:text-blue-600 dark:hover:text-blue-400"
              >
                查看更新详情 →
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
