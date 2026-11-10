import React from 'react';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  ChevronRight,
  Layers,
  LayoutList,
  AlertCircle,
} from 'lucide-react';
import { SoftwareItem } from '../../types/resource';
import { ChannelCategoryItem, ChannelSoftwareItem } from '../../services/channelService';
import { SoftwareCompactCard, SoftwareCardModel } from './SoftwareCompactCard';

interface SoftwareCategoryShowcaseProps {
  sectionRef: React.RefObject<HTMLElement | null>;
  categories: ChannelCategoryItem[];
  categoryBlocks: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    totalCount: number;
    softwares: ChannelSoftwareItem[];
  }>;
  activeCategory: string;
  activePlatform: string;
  activeLicense: string;
  activeSort: string;
  searchQuery: string;
  currentPage: number;
  isFilteredMode: boolean;
  filteredItems: SoftwareItem[];
  filteredTotal: number;
  filteredLoading: boolean;
  filteredError: string | null;
  pageSize: number;
  onUpdateParams: (updates: Record<string, string | null>, scroll?: boolean) => void;
  onToggleFlatList: () => void;
  onResetFilters: () => void;
  onRetryFiltered: () => void;
}

function mapSoftwareItemToCard(item: SoftwareItem): SoftwareCardModel {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    englishName: item.englishName,
    summary: item.summary,
    iconUrl: item.iconUrl,
    categoryName: item.categoryName,
    categorySlug: item.categorySlug,
    licenseType: item.licenseType,
    viewCount: (item as SoftwareItem & { viewCount?: number }).viewCount,
    latestVersion: item.latestVersion?.version || null,
    hasVerifiedSource: Boolean(item.sourceVerified),
  };
}

export const SoftwareCategoryShowcase: React.FC<SoftwareCategoryShowcaseProps> = ({
  sectionRef,
  categories,
  categoryBlocks,
  activeCategory,
  activePlatform,
  activeLicense,
  activeSort,
  searchQuery,
  currentPage,
  isFilteredMode,
  filteredItems,
  filteredTotal,
  filteredLoading,
  filteredError,
  pageSize,
  onUpdateParams,
  onToggleFlatList,
  onResetFilters,
  onRetryFiltered,
}) => {
  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));

  const handleFilterSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const val = String(form.get('q') || '').trim();
    onUpdateParams({ q: val || null, page: null });
  };

  return (
    <section
      id="software-catalog-section"
      ref={sectionRef as any}
      aria-labelledby="catalog-showcase-heading"
      className="space-y-4 scroll-mt-20"
    >
      {/* 区块标题 + 模式切换 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </span>
          <div>
            <h2 id="catalog-showcase-heading" className="text-lg font-bold text-slate-900 dark:text-white">
              分类软件专区与资源检索
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              支持按分类、系统平台、授权协议与热度多维筛选（每款仅展示真实可访问版本）
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleFlatList}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E6ECF5] dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[#B7CEFA] text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        >
          <LayoutList className="w-3.5 h-3.5 text-[#1769D2]" />
          {isFilteredMode ? '切换分类分组视图' : '切换全部软件分页列表'}
        </button>
      </div>

      {/* 多维筛选面板 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-4 space-y-3 shadow-2xs">
        {/* 第一行：分类选择 + 紧凑本地检索 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateParams({ category: null, page: null })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-[#1769D2] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              全部分类
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onUpdateParams({ category: cat.slug, page: null })}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeCategory === cat.slug
                    ? 'bg-[#1769D2] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.name}
                <span className={`ml-1 text-[10px] ${activeCategory === cat.slug ? 'text-blue-100' : 'text-slate-400'}`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleFilterSearch} className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                key={`q-input-${searchQuery}`}
                placeholder="筛选频道内软件..."
                className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#1769D2]"
              />
            </div>
            <button
              type="submit"
              className="h-8 px-3 rounded-lg bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              筛选
            </button>
          </form>
        </div>

        {/* 第二行：平台 / 授权 / 排序 */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                平台:
              </span>
              {[
                { id: 'all', label: '全部' },
                { id: 'windows', label: 'Windows' },
                { id: 'macos', label: 'macOS' },
                { id: 'linux', label: 'Linux' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onUpdateParams({ platform: p.id === 'all' ? null : p.id, page: null })}
                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    activePlatform === p.id
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-[#1769D2] dark:text-blue-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <span className="hidden sm:inline text-slate-200 dark:text-slate-700">|</span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">授权:</span>
              {[
                { id: 'all', label: '全部' },
                { id: 'free', label: '免费软件' },
                { id: 'opensource', label: '开源软件' },
                { id: 'commercial', label: '商业授权' },
              ].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => onUpdateParams({ license: l.id === 'all' ? null : l.id, page: null })}
                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    activeLicense === l.id
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-[#1769D2] dark:text-blue-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
            {[
              { id: 'popular', label: '浏览热度' },
              { id: 'downloads', label: '下载点击' },
              { id: 'latest', label: '最新收录' },
              { id: 'name', label: '名称排序' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onUpdateParams({ sort: s.id, page: null })}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeSort === s.id
                    ? 'bg-white dark:bg-slate-900 text-[#1769D2] dark:text-blue-300 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 视图 A：未过滤且默认视图 -> 分门别类展示专区（大类横排 + 小众类并列紧凑布局，消灭空列留白） */}
      {!isFilteredMode ? (
        <div className="space-y-5">
          {categoryBlocks
            .filter((b) => b.softwares.length >= 4)
            .map((block) => (
              <div
                key={block.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{block.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 tabular-nums">
                        共 {block.totalCount} 款
                      </span>
                    </div>
                    {block.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {block.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onUpdateParams({ category: block.slug, page: null })}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
                  >
                    查看本类全部 {block.totalCount} 款
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {block.softwares.map((sw) => (
                    <SoftwareCompactCard
                      key={sw.id}
                      item={sw}
                      onCategoryClick={(slug) => onUpdateParams({ category: slug, page: null })}
                    />
                  ))}
                </div>
              </div>
            ))}

          {categoryBlocks.some((b) => b.softwares.length < 4) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {categoryBlocks
                .filter((b) => b.softwares.length < 4)
                .map((block) => (
                  <div
                    key={block.id}
                    className="min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">{block.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 tabular-nums">
                            共 {block.totalCount} 款
                          </span>
                        </div>
                        {block.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {block.description}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onUpdateParams({ category: block.slug, page: null })}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
                      >
                        查看本类全部 {block.totalCount} 款
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div
                      className={`grid gap-3.5 ${
                        block.softwares.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
                      }`}
                    >
                      {block.softwares.map((sw) => (
                        <SoftwareCompactCard
                          key={sw.id}
                          item={sw}
                          onCategoryClick={(slug) => onUpdateParams({ category: slug, page: null })}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : (
        /* 视图 B：筛选 / 搜索 / 分页全量网格 */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              共找到符合条件的正版桌面软件{' '}
              <strong className="text-slate-900 dark:text-white tabular-nums">{filteredTotal}</strong> 款
              {searchQuery && (
                <span className="ml-2">
                  （关键词：“<strong className="text-[#1769D2]">{searchQuery}</strong>”）
                </span>
              )}
            </div>
            {(activeCategory !== 'all' ||
              activePlatform !== 'all' ||
              activeLicense !== 'all' ||
              Boolean(searchQuery)) && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#1769D2] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重置筛选
              </button>
            )}
          </div>

          {filteredError ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/50 p-10 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="text-sm text-slate-700 dark:text-slate-200">{filteredError}</p>
              <button
                type="button"
                onClick={onRetryFiltered}
                className="px-4 py-1.5 rounded-lg bg-[#1769D2] text-white text-xs font-medium cursor-pointer"
              >
                重新加载
              </button>
            </div>
          ) : filteredLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-4 animate-pulse"
                />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 py-14 px-4 text-center space-y-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                未找到符合当前筛选条件的桌面软件
              </p>
              <p className="text-xs text-slate-400">
                你可以放宽平台/授权限制或更换搜索关键词重试
              </p>
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1769D2] text-white text-xs font-medium hover:bg-blue-700 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                恢复全部桌面软件
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <SoftwareCompactCard
                  key={item.id}
                  item={mapSoftwareItemToCard(item)}
                  onCategoryClick={(slug) => onUpdateParams({ category: slug, page: null })}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onUpdateParams({ page: String(currentPage - 1) })}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium disabled:opacity-40 cursor-pointer"
              >
                上一页
              </button>
              <span className="text-xs text-slate-500 px-2 tabular-nums">
                第 {currentPage} / {totalPages} 页
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onUpdateParams({ page: String(currentPage + 1) })}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium disabled:opacity-40 cursor-pointer"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
