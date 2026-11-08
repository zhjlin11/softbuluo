import React from 'react';
import {
  FileText,
  Settings,
  Wifi,
  Cpu,
  Palette,
  PlaySquare,
  Code2,
  Layers,
  Gamepad2,
  Grid,
  LucideIcon,
} from 'lucide-react';
import { Category } from '../../types/resource';

const iconMap: Record<string, LucideIcon> = {
  FileText,
  Settings,
  Wifi,
  Cpu,
  Palette,
  PlaySquare,
  Code2,
  Layers,
  Gamepad2,
  Grid,
};

interface QuickCategoriesProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

export const QuickCategories: React.FC<QuickCategoriesProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            快捷分类导航
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            覆盖 Windows 核心应用、系统装机与专业维护工具
          </p>
        </div>
        {selectedCategory !== 'all' && (
          <button
            onClick={() => onSelectCategory('all')}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            清除分类筛选
          </button>
        )}
      </div>

      {/* 5 列 × 2 行 电脑端，2 列 × 5 行 手机端 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {categories.map((cat) => {
          const IconComponent = iconMap[cat.iconName] || Grid;
          const isSelected = selectedCategory === cat.slug;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(isSelected ? 'all' : cat.slug)}
              className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 group ${
                isSelected
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500/50 dark:border-blue-500/40 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-slate-800 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                }`}
              >
                <IconComponent className="w-4.5 h-4.5 stroke-[1.8]" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                    {cat.itemCount}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {cat.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
