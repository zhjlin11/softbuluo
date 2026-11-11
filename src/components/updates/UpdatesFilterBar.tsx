import React from 'react';
import { Search, X, SlidersHorizontal, Calendar, Layers, ArrowUpDown } from 'lucide-react';
import { UpdatesQueryParams } from '../../services/updatesService';

interface UpdatesFilterBarProps {
  filters: UpdatesQueryParams;
  onFilterChange: (newFilters: Partial<UpdatesQueryParams>) => void;
  categories: Array<{ id: string; name: string; slug: string; count: number }>;
  onReset: () => void;
}

export const UpdatesFilterBar: React.FC<UpdatesFilterBarProps> = ({
  filters,
  onFilterChange,
  categories,
  onReset,
}) => {
  const timeRanges = [
    { label: '全部历史', value: 'all' },
    { label: '最近 7 天', value: '7d' },
    { label: '最近 30 天', value: '30d' },
    { label: '最近 90 天', value: '90d' },
  ];

  const resourceTypes = [
    { label: '全部类型', value: 'ALL' },
    { label: '电脑软件', value: 'SOFTWARE' },
    { label: '系统工具', value: 'TOOL' },
    { label: '游戏资源', value: 'GAME' },
  ];

  const sortOptions = [
    { label: '按官方发布日期 (新→旧)', value: 'latest_release' },
    { label: '按平台核验时间 (新→旧)', value: 'latest_verified' },
    { label: '按软件名称 (A→Z)', value: 'name' },
  ];

  const hasActiveFilters =
    (filters.timeRange && filters.timeRange !== 'all') ||
    (filters.resourceType && filters.resourceType !== 'ALL') ||
    Boolean(filters.categoryId) ||
    Boolean(filters.keyword);

  return (
    <div className="mb-6 p-4 md:p-5 rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
      {/* 顶栏：搜索框与排序 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* 关键词搜索 */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.keyword || ''}
            onChange={(e) => onFilterChange({ keyword: e.target.value, page: 1 })}
            placeholder="搜索软件名称、开发者、版本号或更新日志..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1769D2]/30 focus:border-[#1769D2] transition-all"
          />
          {filters.keyword && (
            <button
              onClick={() => onFilterChange({ keyword: '', page: 1 })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 排序方式选择 */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filters.sort || 'latest_release'}
            onChange={(e) => onFilterChange({ sort: e.target.value as any, page: 1 })}
            className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1769D2]/30"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
            >
              清空筛选
            </button>
          )}
        </div>
      </div>

      {/* 中栏：时间范围与资源类型筛选 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        {/* 时间范围 */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#1769D2]" />
            <span>发布周期:</span>
          </span>
          {timeRanges.map((tr) => {
            const active = (filters.timeRange || 'all') === tr.value;
            return (
              <button
                key={tr.value}
                onClick={() => onFilterChange({ timeRange: tr.value as any, page: 1 })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#1769D2] text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tr.label}
              </button>
            );
          })}
        </div>

        {/* 资源类型 */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#1769D2]" />
            <span>资源类型:</span>
          </span>
          {resourceTypes.map((rt) => {
            const active = (filters.resourceType || 'ALL') === rt.value;
            return (
              <button
                key={rt.value}
                onClick={() => onFilterChange({ resourceType: rt.value as any, page: 1 })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {rt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 底栏：分类选择 */}
      {categories.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1">所属分类:</span>
          <button
            onClick={() => onFilterChange({ categoryId: undefined, page: 1 })}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              !filters.categoryId
                ? 'bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            全部分类
          </button>
          {categories.map((c) => {
            const active = filters.categoryId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onFilterChange({ categoryId: active ? undefined : c.id, page: 1 })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] font-bold border border-blue-200 dark:border-blue-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{c.name}</span>
                <span className="text-[10px] text-slate-400">({c.count})</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
