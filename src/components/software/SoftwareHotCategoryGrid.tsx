import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ChevronRight } from 'lucide-react';
import { SoftwareIcon } from '../common/SoftwareIcon';
import { ChannelCategoryItem } from '../../services/channelService';
import { getSimpleSoftwareName, sanitizeChannelIconUrl } from './softwareHelpers';

interface SoftwareHotCategoryGridProps {
  categories: ChannelCategoryItem[];
  onSelectCategory: (slug: string) => void;
}

export const SoftwareHotCategoryGrid: React.FC<SoftwareHotCategoryGridProps> = ({
  categories,
  onSelectCategory,
}) => {
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="hot-categories-heading" className="space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-400 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </span>
          <div>
            <h2 id="hot-categories-heading" className="text-lg font-bold text-slate-900 dark:text-white">
              热门领域导航
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              按使用场景快速直达高频代表软件与分类合集
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 hover:border-[#B7CEFA] dark:hover:border-blue-800 p-4 shadow-2xs transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <button
                  type="button"
                  onClick={() => onSelectCategory(cat.slug)}
                  className="text-sm font-bold text-slate-900 dark:text-white hover:text-[#1769D2] dark:hover:text-blue-400 truncate cursor-pointer text-left"
                >
                  {cat.name}
                </button>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium tabular-nums shrink-0">
                  {cat.count} 款
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-3">
                {cat.description || `精选${cat.name}官方正版与常用装机工具`}
              </p>

              <div className="space-y-1.5">
                {cat.representativeSoftwares.map((sw) => (
                  <Link
                    key={sw.id}
                    to={`/software/${sw.slug}`}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#F5F8FC] dark:hover:bg-slate-800/80 transition-colors min-w-0"
                  >
                    <SoftwareIcon
                      iconUrl={sanitizeChannelIconUrl(sw.iconUrl)}
                      name={sw.name}
                      slug={sw.slug}
                      categorySlug={sw.categorySlug}
                      size="sm"
                      className="w-7 h-7! rounded-md!"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                      {getSimpleSoftwareName(sw.name)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Link
                to={`/category/${cat.slug}`}
                className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                分类归档页
              </Link>
              <button
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className="inline-flex items-center gap-0.5 text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline cursor-pointer"
              >
                筛选本类
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
