import React from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  ShieldCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Download,
} from 'lucide-react';
import { SoftwareItem } from '../../types/resource';
import { SoftwareIcon } from '../common/SoftwareIcon';
import {
  formatLicenseLabel,
  formatShortPlatform,
  getSimpleSoftwareName,
  getSimpleVersion,
  sanitizeChannelIconUrl,
} from '../software/softwareHelpers';

interface SystemToolsCatalogSectionProps {
  sectionRef?: React.RefObject<HTMLElement | null>;
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

const TOOL_CATEGORY_FILTERS = [
  { slug: 'all', label: '全部工具' },
  { slug: 'sys-tools', label: '系统与引导管理' },
  { slug: 'hardware', label: '硬件体检监测' },
  { slug: 'network', label: '网络诊断传输' },
  { slug: 'dev', label: '终端维护辅助' },
];

const HIGH_RISK_SLUGS = new Set(['diskgenius', 'rufus', 'geek-uninstaller']);

export const SystemToolsCatalogSection: React.FC<SystemToolsCatalogSectionProps> = ({
  sectionRef,
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
  const [draftKeyword, setDraftKeyword] = React.useState(searchQuery);
  React.useEffect(() => {
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
    <section ref={sectionRef} aria-labelledby="tools-catalog-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="tools-catalog-heading" className="text-xl font-bold text-slate-900 dark:text-white">
            完整系统工具库与多维检索
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            实时检索全部已发布非测试 `TOOL` 资源（共 {total} 款符合条件），严格标示来源审核状态与操作风险
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
          {/* 分类芯片 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {TOOL_CATEGORY_FILTERS.map((c) => {
              const active = activeCategory === c.slug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => onUpdateParams({ category: c.slug === 'all' ? null : c.slug, page: null })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1769D2] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* 关键字搜索 */}
          <form onSubmit={handleSubmitSearch} className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={draftKeyword}
                onChange={(e) => setDraftKeyword(e.target.value)}
                placeholder="搜工具名或功能..."
                aria-label="在系统工具库内检索"
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F8FAFD] dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#1769D2]"
              />
            </div>
            <button
              type="submit"
              className="h-9 px-3.5 rounded-lg bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
            >
              筛选
            </button>
          </form>
        </div>

        {/* 平台 · 授权 · 排序 */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">平台:</span>
              {[
                { key: 'all', label: '全部' },
                { key: 'windows', label: 'Windows' },
                { key: 'macos', label: 'macOS' },
                { key: 'linux', label: 'Linux' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => onUpdateParams({ platform: p.key === 'all' ? null : p.key, page: null })}
                  className={`px-2 py-1 rounded text-xs cursor-pointer ${
                    activePlatform === p.key
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-[#1769D2] dark:text-blue-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">授权:</span>
              {[
                { key: 'all', label: '全部' },
                { key: 'free', label: '免费' },
                { key: 'opensource', label: '开源' },
                { key: 'commercial', label: '商业授权' },
              ].map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => onUpdateParams({ license: l.key === 'all' ? null : l.key, page: null })}
                  className={`px-2 py-1 rounded text-xs cursor-pointer ${
                    activeLicense === l.key
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-[#1769D2] dark:text-blue-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {[
              { key: 'popular', label: '真实热度' },
              { key: 'downloads', label: '下载点击' },
              { key: 'version', label: '最近更新' },
              { key: 'latest', label: '最新收录' },
              { key: 'name', label: '名称排序' },
            ].map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => onUpdateParams({ sort: s.key === 'popular' ? null : s.key, page: null })}
                className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                  activeSort === s.key
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-medium'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-44 rounded-xl bg-white dark:bg-slate-900 border border-[#E6ECF5] dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/60 p-8 text-center space-y-2.5">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-1.5 rounded-lg bg-[#1769D2] text-white text-xs font-medium cursor-pointer"
          >
            重试加载
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-10 text-center space-y-2.5">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            没有匹配该组合条件的系统工具
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-1.5 rounded-lg bg-[#EFF5FF] text-[#1769D2] text-xs font-semibold cursor-pointer"
          >
            查看全部工具
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((tool) => {
              const lic = formatLicenseLabel(tool.licenseType);
              const ver = getSimpleVersion(tool.latestVersion?.version || undefined);
              const isHighRisk = HIGH_RISK_SLUGS.has(tool.slug);
              return (
                <article
                  key={tool.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 hover:border-[#93B8F8] dark:hover:border-blue-700/70 p-4 shadow-2xs flex flex-col justify-between transition-colors"
                >
                  <div>
                    <div className="flex items-start gap-3">
                      <SoftwareIcon
                        iconUrl={sanitizeChannelIconUrl(tool.iconUrl)}
                        name={tool.name}
                        slug={tool.slug}
                        categorySlug={tool.categorySlug}
                        size="md"
                        className="shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Link
                            to={`/software/${tool.slug}`}
                            title={tool.name}
                            className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white hover:text-[#1769D2] truncate"
                          >
                            {getSimpleSoftwareName(tool.name, tool.englishName)}
                          </Link>
                          {tool.sourceVerified ? (
                            <span title="含已审核健康直连来源" className="inline-flex shrink-0">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </span>
                          ) : (
                            <span
                              title={tool.sourceStatus || '已登记渠道（请参考详情页说明）'}
                              className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0"
                            >
                              登记渠道
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {ver && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                              {ver}
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            {lic.label}
                          </span>
                          {isHighRisk && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium">
                              <AlertTriangle className="w-3 h-3" />
                              高风险
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {tool.summary}
                    </p>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 truncate">
                      {tool.categoryName} · {formatShortPlatform(tool.latestVersion?.platform?.[0])}
                    </span>
                    <Link
                      to={`/software/${tool.slug}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#EFF5FF] dark:bg-blue-950/50 hover:bg-[#1769D2] text-[#1769D2] dark:text-blue-300 hover:text-white font-medium transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      详情与渠道
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                第 {currentPage} / {totalPages} 页 · 共 {total} 款工具
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => onUpdateParams({ page: String(currentPage - 1) })}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  上一页
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => onUpdateParams({ page: String(currentPage + 1) })}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs disabled:opacity-40 cursor-pointer"
                >
                  下一页
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};
