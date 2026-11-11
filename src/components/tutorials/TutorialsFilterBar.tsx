import React from 'react';
import { Search, RotateCcw, Filter, SlidersHorizontal } from 'lucide-react';
import { TutorialCategoryMeta } from '../../services/tutorialService';

interface TutorialsFilterBarProps {
  categories: TutorialCategoryMeta[];
  activeCategory: string;
  onCategoryChange: (catId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  difficulty: string;
  onDifficultyChange: (diff: string) => void;
  platform: string;
  onPlatformChange: (plat: string) => void;
  sort: string;
  onSortChange: (sort: string) => void;
  onResetFilters: () => void;
  totalFiltered: number;
}

export const TutorialsFilterBar: React.FC<TutorialsFilterBarProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  difficulty,
  onDifficultyChange,
  platform,
  onPlatformChange,
  sort,
  onSortChange,
  onResetFilters,
  totalFiltered,
}) => {
  const hasActiveFilters =
    activeCategory !== 'all' ||
    searchQuery.trim() !== '' ||
    difficulty !== 'ALL' ||
    platform !== 'ALL' ||
    sort !== 'latest';

  return (
    <div className="mb-6 space-y-4">
      {/* 分类快捷切换 Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-[#1769D2] text-white shadow-xs font-semibold'
                  : 'bg-white dark:bg-[#131C2E] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 多维检索工具栏 */}
      <div className="bg-white dark:bg-[#131C2E] rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* 搜索框 */}
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索教程标题、摘要、标签或涉及软件..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1769D2] focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* 筛选选择器组合 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 难度 */}
          <select
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1769D2]"
          >
            <option value="ALL">全部难度</option>
            <option value="BEGINNER">入门友好</option>
            <option value="INTERMEDIATE">进阶实操</option>
            <option value="ADVANCED">专业技术</option>
          </select>

          {/* 适用平台 */}
          <select
            value={platform}
            onChange={(e) => onPlatformChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1769D2]"
          >
            <option value="ALL">全部操作系统</option>
            <option value="WIN11">Windows 11</option>
            <option value="WIN10">Windows 10 / 通用</option>
            <option value="CROSS">跨平台 (Win/Mac/Linux)</option>
          </select>

          {/* 排序 */}
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1769D2]"
          >
            <option value="latest">最新发布优先</option>
            <option value="views">阅读热度优先</option>
            <option value="updated">最近技术复核</option>
          </select>

          {/* 重置按钮 */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>清空筛选</span>
            </button>
          )}

          {/* 结果数量标识 */}
          <div className="text-[11px] text-slate-400 pl-2 border-l border-slate-200 dark:border-slate-700 hidden sm:block">
            已检索到 <strong className="text-slate-700 dark:text-slate-200">{totalFiltered}</strong> 篇教程
          </div>
        </div>
      </div>
    </div>
  );
};
