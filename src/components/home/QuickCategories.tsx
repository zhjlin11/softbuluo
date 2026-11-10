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
  ShieldCheck,
  Grid,
  ChevronRight,
  Flame,
  Wrench,
  Sparkles,
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
  ShieldCheck,
  Grid,
};

interface QuickCategoriesProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  className?: string;
}

export const QuickCategories: React.FC<QuickCategoriesProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  className = '',
}) => {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div
      className={`bg-white dark:bg-[#141F33] rounded-xl border border-[#E5E9F0] dark:border-slate-800 p-3.5 sm:p-4 shadow-2xs h-full flex flex-col justify-between ${className}`}
    >
      <div>
        {/* 侧栏标题 */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#EDF0F4] dark:border-slate-800">
          <span className="text-xs font-bold text-[#202938] dark:text-slate-200 uppercase tracking-wider">
            软件分类导航
          </span>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => onSelectCategory('all')}
              className="text-[11px] text-[#1769D2] dark:text-blue-400 hover:underline cursor-pointer"
            >
              显示全部分类
            </button>
          )}
        </div>

        {/* 分类垂直列表 (桌面端紧凑列表，高信息密度) */}
        <nav aria-label="软件分类列表" className="space-y-0.5">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
              selectedCategory === 'all'
                ? 'bg-[#1769D2] text-white font-semibold'
                : 'text-[#202938] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Grid className="w-3.5 h-3.5 shrink-0" />
              <span>全站所有精选</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 ${selectedCategory === 'all' ? 'text-white' : 'text-slate-400'}`} />
          </button>

          {categories.map((cat) => {
            const IconComponent = iconMap[cat.iconName] || Grid;
            const isSelected = selectedCategory === cat.slug;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[#1769D2] text-white font-semibold'
                    : 'text-[#202938] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className="truncate">{cat.name}</span>
                </div>
                <span
                  className={`text-[11px] tabular-nums shrink-0 ml-1 ${
                    isSelected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {cat.itemCount > 0 ? cat.itemCount : ''}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 门户特色装机专题快速通道 */}
      <div className="mt-4 pt-3 border-t border-[#EDF0F4] dark:border-slate-800 space-y-1">
        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 px-2 mb-1.5 uppercase tracking-wider">
          常用专题入口
        </div>
        <a
          href="#tools"
          className="flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-amber-500" />
            <span>系统与维修工具箱</span>
          </span>
          <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded font-medium">
            装机必备
          </span>
        </a>
        <a
          href="#games"
          className="flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>官方正版与开源游戏</span>
          </span>
          <span className="text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 rounded font-medium">
            游戏频道
          </span>
        </a>
      </div>
    </div>
  );
};
