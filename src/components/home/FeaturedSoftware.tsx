import React from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Download, ExternalLink } from 'lucide-react';
import { SoftwareItem } from '../../types/resource';

interface FeaturedSoftwareProps {
  softwareList: SoftwareItem[];
  onSelectSoftware: (software: SoftwareItem) => void;
  onViewAllClick?: () => void;
}

export const FeaturedSoftware: React.FC<FeaturedSoftwareProps> = ({
  softwareList,
  onSelectSoftware,
  onViewAllClick,
}) => {
  if (!softwareList || softwareList.length === 0) {
    return null;
  }

  return (
    <section id="featured" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
      {/* 专区标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            精选软件
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            经过人工整理的软件资源与官方获取渠道
          </p>
        </div>

        <button
          onClick={onViewAllClick}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors self-start sm:self-auto"
        >
          <span>查看全部推荐</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4 列自适应网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {softwareList.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectSoftware(item)}
            className="group flex flex-col justify-between p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <div>
              {/* 卡片头部：图标与基础信息 */}
              <div className="flex items-start gap-3.5 mb-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-center font-bold text-base text-blue-600 dark:text-blue-400 shrink-0 select-none group-hover:scale-105 transition-transform">
                  {item.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {item.developer}
                  </div>
                </div>
              </div>

              {/* 软件摘要 */}
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                {item.summary}
              </p>
            </div>

            {/* 卡片底部元数据（严格无胶囊 Zero-Pill） */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                <div className="flex items-center gap-1.5 truncate">
                  <span>{item.categoryName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">v{item.latestVersion.version}</span>
                </div>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium shrink-0 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>官方来源</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  {item.licenseLabel}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSoftware(item);
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 rounded-md transition-colors"
                >
                  详情与下载
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
