import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Eye,
  ShieldAlert,
  ArrowRight,
  Laptop,
  Box,
} from 'lucide-react';
import { EnrichedTutorialDto } from '../../services/tutorialService';
import { SoftwareIcon } from '../common/SoftwareIcon';

interface TutorialCardProps {
  item: EnrichedTutorialDto;
}

export const TutorialCard: React.FC<TutorialCardProps> = ({ item }) => {
  return (
    <article className="bg-white dark:bg-[#131C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* 顶部标签行 */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-[#1769D2] dark:text-blue-300 font-semibold text-[11px]">
              {item.categoryName}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[10px]">
              {item.difficultyLabel}
            </span>
            {item.isHighRisk && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-medium text-[10px] border border-amber-200 dark:border-amber-800">
                <ShieldAlert className="w-2.5 h-2.5" />
                <span>须备份</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-[11px] text-slate-400">
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3 text-slate-400" /> {item.readingMinutes}分钟
            </span>
            <span className="flex items-center gap-0.5">
              <Eye className="w-3 h-3 text-slate-400" /> {item.viewCount}
            </span>
          </div>
        </div>

        {/* 标题 */}
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-[#1769D2] transition-colors leading-snug">
          <Link to={`/tutorials/${item.slug}`}>
            {item.title}
          </Link>
        </h3>

        {/* 摘要 */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mt-2.5 leading-relaxed">
          {item.summary}
        </p>

        {/* 关联软件轻量胶囊 */}
        {item.software && (
          <div className="mt-3.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-300">
            <SoftwareIcon
              iconUrl={item.software.iconUrl}
              name={item.software.name}
              slug={item.software.slug}
              size="sm"
              className="shrink-0"
            />
            <span className="truncate max-w-[140px] font-medium">{item.software.name}</span>
            {item.software.currentVersion && (
              <span className="text-slate-400 text-[10px]">v{item.software.currentVersion}</span>
            )}
          </div>
        )}
      </div>

      {/* 底部元数据与阅读按钮 */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <div className="text-[11px] text-slate-400 flex items-center gap-1">
          <Laptop className="w-3 h-3 text-slate-400" />
          <span className="truncate max-w-[130px]">{item.platform}</span>
        </div>

        <Link
          to={`/tutorials/${item.slug}`}
          className="inline-flex items-center gap-1 text-[#1769D2] hover:text-blue-700 font-semibold group-hover:translate-x-0.5 transition-transform"
        >
          <span>阅读实操</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
};
