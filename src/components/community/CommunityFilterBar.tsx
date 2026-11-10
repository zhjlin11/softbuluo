import React from 'react';
import { HelpCircle, CheckCircle2, Flame, Sparkles, Filter, X } from 'lucide-react';

export interface CategoryOption {
  id: string;
  label: string;
  badge?: string;
}

export const COMMUNITY_CATEGORIES: CategoryOption[] = [
  { id: '', label: '全部板块' },
  { id: 'QUESTION', label: '技术问答' },
  { id: 'INSTALL_ISSUE', label: '安装排障' },
  { id: 'EXPERIENCE', label: '使用心得' },
  { id: 'WINDOWS', label: 'Windows 系统' },
  { id: 'REPAIR', label: '电脑维修与装机' },
  { id: 'NETWORK', label: '网络与安全' },
  { id: 'GAMES', label: '游戏讨论' },
  { id: 'FEEDBACK', label: '功能建议' },
];

export interface CommunityFilterBarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  statusFilter: 'all' | 'unresolved' | 'resolved' | 'hottest';
  onSelectStatusFilter: (status: 'all' | 'unresolved' | 'resolved' | 'hottest') => void;
  searchQuery: string;
  onClearSearch: () => void;
  categoryCounts?: Record<string, number>;
  unresolvedCount?: number;
}

export const CommunityFilterBar: React.FC<CommunityFilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  statusFilter,
  onSelectStatusFilter,
  searchQuery,
  onClearSearch,
  categoryCounts = {},
  unresolvedCount = 0,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs mb-6 space-y-4">
      {/* 顶部：分类标签导航 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 shrink-0 mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          <span>板块:</span>
        </span>
        {COMMUNITY_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = cat.id ? categoryCounts[cat.id] || 0 : undefined;
          return (
            <button
              key={cat.id || 'all'}
              onClick={() => onSelectCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{cat.label}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 底部：状态与排序过滤标签条 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onSelectStatusFilter('all')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>最新全部</span>
          </button>

          <button
            onClick={() => onSelectStatusFilter('unresolved')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              statusFilter === 'unresolved'
                ? 'bg-amber-500 text-white font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-500 group-hover:text-amber-400" />
            <span>待解决求助</span>
            {unresolvedCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  statusFilter === 'unresolved' ? 'bg-amber-600 text-white' : 'bg-amber-100 dark:bg-amber-950/50 text-amber-600'
                }`}
              >
                {unresolvedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectStatusFilter('resolved')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              statusFilter === 'resolved'
                ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>已解决方案</span>
          </button>

          <button
            onClick={() => onSelectStatusFilter('hottest')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              statusFilter === 'hottest'
                ? 'bg-rose-500 text-white font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>热门讨论</span>
          </button>
        </div>

        {/* 若有搜索词，展示快捷清除指示 */}
        {searchQuery && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-700 dark:text-blue-300">
            <span>正在搜索: “{searchQuery}”</span>
            <button
              onClick={onClearSearch}
              className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-900 rounded cursor-pointer"
              title="清除搜索"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
