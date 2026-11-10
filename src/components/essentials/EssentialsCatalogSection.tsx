import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  RotateCcw,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  SlidersHorizontal,
} from 'lucide-react';
import { SoftwareItem } from '../../types/resource';
import { EssentialsCategoryShelfItem } from '../../services/channelService';
import { SoftwareIcon } from '../common/SoftwareIcon';
import {
  formatLicenseLabel,
  formatShortPlatform,
  getSimpleSoftwareName,
  getSimpleVersion,
  sanitizeChannelIconUrl,
} from '../software/softwareHelpers';

interface EssentialsCatalogSectionProps {
  categories: EssentialsCategoryShelfItem[];
  items: SoftwareItem[];
  total: number;
  loading: boolean;
  error: string | null;
  activeCategory: string;
  activePlatform: string;
  activeLicense: string;
  activeSort: string;
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  onUpdateParams: (updates: Record<string, string | null>) => void;
  onResetFilters: () => void;
  onRetry: () => void;
}

export const EssentialsCatalogSection: React.FC<EssentialsCatalogSectionProps> = ({
  categories,
  items,
  total,
  loading,
  error,
  activeCategory,
  activePlatform,
  activeLicense,
  activeSort,
  searchQuery,
  currentPage,
  pageSize,
  onUpdateParams,
  onResetFilters,
  onRetry,
}) => {
  const [draftKeyword, setDraftKeyword] = useState(searchQuery);
  useEffect(() => {
    setDraftKeyword(searchQuery);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasAnyFilter =
    activeCategory !== 'all' ||
    activePlatform !== 'all' ||
    activeLicense !== 'all' ||
    activeSort !== 'popular' ||
    Boolean(searchQuery);

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateParams({ q: draftKeyword.trim() || null, page: null });
  };

  return (
    <section id="essentials-catalog" aria-labelledby="essentials-catalog-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="essentials-catalog-heading" className="text-xl font-bold text-slate-900 dark:text-white">
            装机软件资源库
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            实时检索全部已公开发布且非测试的装机软件与工具（当前匹配 {total} 款），严格标明授权方式与来源状态
          </p>
        </div>

        {hasAnyFilter && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置所有筛选
          </button>
        )}
      </div>

      {/* 筛选控制面板 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateParams({ category: null, page: null })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-[#1769D2] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              全部分类
            </button>
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onUpdateParams({ category: cat.slug, page: null })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1769D2] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmitSearch} className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={draftKeyword}
                onChange={(e) => setDraftKeyword(e.target.value)}
                placeholder="搜索装机软件名称或用途..."
                aria-label="在装机资源库中搜索"
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
              />
            </div>
            <button
              type="submit"
              className="h-9 px-3.5 rounded-lg bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              搜索
            </button>
          </form>
        </div>

        {/* 平台、许可与排序行 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="运行平台筛选"
              value={activePlatform}
              onChange={(e) => onUpdateParams({ platform: e.target.value === 'all' ? null : e.target.value, page: null })}
              className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200"
            >
              <option value="all">全部平台</option>
              <option value="Windows">Windows</option>
              <option value="macOS">macOS</option>
              <option value="Linux">Linux</option>
            </select>

            <select
              aria-label="许可方式筛选"
              value={activeLicense}
              onChange={(e) => onUpdateParams({ license: e.target.value === 'all' ? null : e.target.value, page: null })}
              className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200"
            >
              <option value="all">全部许可类型</option>
              <option value="free">免费软件</option>
              <option value="opensource">开源自由软件</option>
              <option value="commercial">商业正版引导</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">排序：</span>
            {[
              { id: 'popular', label: '浏览热度' },
              { id: 'latest', label: '最新收录' },
              { id: 'updated', label: '版本更新' },
              { id: 'downloads', label: '下载触发' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onUpdateParams({ sort: s.id === 'popular' ? null : s.id, page: null })}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeSort === s.id
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 结果网格 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-32 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900 p-8 text-center space-y-2">
          <p className="text-sm font-medium text-rose-600">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-1.5 rounded-lg bg-[#1769D2] text-white text-xs font-semibold cursor-pointer"
          >
            重试加载
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2.5">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            当前筛选条件下暂无匹配的已发布装机软件
          </p>
          <p className="text-xs text-slate-400">可尝试重置筛选条件或更换关键词</p>
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#1769D2] text-white text-xs font-semibold cursor-pointer"
          >
            查看全部装机资源
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {items.map((sw) => (
            <Link
              key={sw.id}
              to={`/software/${sw.slug}`}
              className="group bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 hover:border-[#B7CEFA] dark:hover:border-blue-800 p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between min-w-0"
            >
              <div className="flex items-start gap-3">
                <SoftwareIcon
                  iconUrl={sanitizeChannelIconUrl(sw.iconUrl)}
                  name={sw.name}
                  slug={sw.slug}
                  categorySlug={sw.categorySlug}
                  size="md"
                  className="w-11 h-11! rounded-xl!"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#1769D2] truncate">
                      {getSimpleSoftwareName(sw.name, sw.englishName || undefined)}
                    </h3>
                    {sw.sourceVerified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {sw.categoryName}
                    </span>
                    {sw.latestVersion?.version && (
                      <span className="font-mono text-slate-500">
                        {getSimpleVersion(sw.latestVersion.version)}
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-300">
                      {formatLicenseLabel(sw.licenseType).label}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {sw.summary}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate">{formatShortPlatform(sw.supportedPlatforms)}</span>
                <span className="inline-flex items-center gap-1 text-[#1769D2] dark:text-blue-400 font-semibold shrink-0">
                  <Download className="w-3 h-3" />
                  详情与官网
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 分页条 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            第 {currentPage} / {totalPages} 页 · 共 {total} 款
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onUpdateParams({ page: currentPage - 1 <= 1 ? null : String(currentPage - 1) })}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              上一页
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onUpdateParams({ page: String(currentPage + 1) })}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              下一页
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
