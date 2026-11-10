import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Bookmark,
  BookOpen,
  Scale,
  RefreshCw,
  PlusCircle,
  Award,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { EssentialsChannelData } from '../../services/channelService';
import { SoftwareIcon } from '../common/SoftwareIcon';
import { SoftwareLeaderboards } from '../software/SoftwareLeaderboards';
import {
  formatLicenseLabel,
  formatShortDate,
  formatShortPlatform,
  getSimpleSoftwareName,
  getSimpleVersion,
  sanitizeChannelIconUrl,
} from '../software/softwareHelpers';

interface EssentialsCategoriesAndDiscoveryProps {
  data: EssentialsChannelData;
  onSelectCategoryFilter: (categorySlug: string) => void;
}

export const EssentialsCategoriesAndDiscovery: React.FC<EssentialsCategoriesAndDiscoveryProps> = ({
  data,
  onSelectCategoryFilter,
}) => {
  return (
    <div className="space-y-8">
      {/* 1. 常用软件分类推荐（基于真实数据库非空分类，无空白堆砌、无重复） */}
      {data.categoryShelves.length > 0 && (
        <section id="essentials-categories" aria-labelledby="categories-shelf-heading" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-400 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </span>
              <div>
                <h2 id="categories-shelf-heading" className="text-xl font-bold text-slate-900 dark:text-white">
                  常用软件分类推荐
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  依据当前已公开发布资源动态呈现，各分类软件去重独立展示
                </p>
              </div>
            </div>
            <Link
              to="/software"
              className="text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline shrink-0"
            >
              前往电脑软件全量频道 →
            </Link>
          </div>

          <div className="space-y-5">
            {data.categoryShelves.map((shelf) => (
              <div
                key={shelf.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{shelf.name}</h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium tabular-nums">
                        实有 {shelf.totalCount} 款
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{shelf.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onSelectCategoryFilter(shelf.slug)}
                      className="text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      在下方目录筛选
                    </button>
                    <Link
                      to={`/category/${shelf.slug}`}
                      className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      分类归档页 →
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {shelf.softwares.map((sw) => (
                    <Link
                      key={sw.id}
                      to={`/software/${sw.slug}`}
                      className="group p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#B7CEFA] dark:hover:border-blue-800 hover:bg-[#F5F8FC] dark:hover:bg-slate-800/60 transition-colors flex items-start gap-3 min-w-0"
                    >
                      <SoftwareIcon
                        iconUrl={sanitizeChannelIconUrl(sw.iconUrl)}
                        name={sw.name}
                        slug={sw.slug}
                        categorySlug={sw.categorySlug}
                        size="md"
                        className="w-10 h-10! rounded-lg!"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#1769D2] truncate">
                            {getSimpleSoftwareName(sw.name, sw.englishName || undefined)}
                          </span>
                          {sw.hasVerifiedSource && (
                            <span title="含已审核健康官方来源" className="inline-flex shrink-0">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {sw.summary}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{formatLicenseLabel(sw.licenseType).label}</span>
                          {sw.latestVersion && <span>· {getSimpleVersion(sw.latestVersion)}</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. 装机指南与专题合集 */}
      {data.hotTopics.length > 0 && (
        <section id="essentials-guides" aria-labelledby="essentials-topics-heading" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </span>
              <div>
                <h2 id="essentials-topics-heading" className="text-xl font-bold text-slate-900 dark:text-white">
                  装机指南与专题合集
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  全部来自平台已审核发布的装机专题，使用原创安全示意图与真实关联数量
                </p>
              </div>
            </div>
            <Link
              to="/topics"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline shrink-0"
            >
              全部专题
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.hotTopics.map((topic) => (
              <Link
                key={topic.id}
                to={`/topics/${topic.slug}`}
                className="group min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 hover:border-[#B7CEFA] dark:hover:border-blue-800 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                    <img
                      src={topic.coverUrl}
                      alt={`${topic.title} 装机专题示意图`}
                      width={960}
                      height={540}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent" />
                    <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between gap-2">
                      <div className="flex items-center -space-x-1.5">
                        {topic.previewSoftwares.slice(0, 4).map((sw) => (
                          <SoftwareIcon
                            key={sw.slug}
                            iconUrl={sanitizeChannelIconUrl(sw.iconUrl)}
                            name={sw.name}
                            slug={sw.slug}
                            categorySlug={sw.categorySlug}
                            size="sm"
                            className="w-7 h-7! rounded-md! ring-2 ring-slate-900/70"
                          />
                        ))}
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white font-semibold shrink-0">
                        关联 {topic.resourceCount} 款软件
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#1769D2] dark:group-hover:text-blue-400 line-clamp-1">
                      {topic.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {topic.description}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 tabular-nums">{topic.publishedAt}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#1769D2] dark:text-blue-400">
                    进入专题
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. 装机实战教程与评测选型 (8 + 4 cols) */}
      {(data.tutorials.length > 0 || data.comparisons.length > 0) && (
        <section aria-labelledby="essentials-tutorials-heading" className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#1769D2]" />
                <h2 id="essentials-tutorials-heading" className="text-lg font-bold text-slate-900 dark:text-white">
                  装机实战教程
                </h2>
              </div>
              <Link to="/tutorials" className="text-xs font-medium text-[#1769D2] hover:underline">
                全部教程 →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.tutorials.map((tut) => (
                <Link
                  key={tut.id}
                  to={`/tutorials/${tut.slug}`}
                  className="group p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-[#B7CEFA] dark:hover:border-blue-800 hover:bg-[#F5F8FC] dark:hover:bg-slate-800/60 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {tut.isHighRisk && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          重要提示
                        </span>
                      )}
                      {tut.software && (
                        <span className="text-[10px] text-slate-400 truncate">
                          关联：{getSimpleSoftwareName(tut.software.name)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#1769D2] line-clamp-1">
                      {tut.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {tut.summary}
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="tabular-nums">{tut.publishedAt}</span>
                    <span className="text-[#1769D2] font-medium">阅读指南 →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 右侧：装机编辑推荐 + 横向评测 */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#1769D2]" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">编辑部装机优选</h2>
                </div>
                <span className="text-[11px] text-slate-400">{data.editorPicks.length} 款</span>
              </div>

              <div className="space-y-2">
                {data.editorPicks.slice(0, 6).map((sw) => (
                  <Link
                    key={sw.id}
                    to={`/software/${sw.slug}`}
                    className="group flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#F5F8FC] dark:hover:bg-slate-800/70 transition-colors"
                  >
                    <SoftwareIcon
                      iconUrl={sanitizeChannelIconUrl(sw.iconUrl)}
                      name={sw.name}
                      slug={sw.slug}
                      categorySlug={sw.categorySlug}
                      size="sm"
                      className="w-8 h-8! rounded-lg!"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-[#1769D2] truncate">
                        {getSimpleSoftwareName(sw.name, sw.englishName || undefined)}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {sw.categoryName} · {formatShortPlatform(sw.platform)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {data.comparisons.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">装机软件横向对比</h2>
                  </div>
                  <Link to="/compare" className="text-xs text-[#1769D2] hover:underline">
                    评测中心 →
                  </Link>
                </div>
                <div className="space-y-2">
                  {data.comparisons.map((comp) => (
                    <Link
                      key={comp.id}
                      to={`/compare/${comp.slug}`}
                      className="block p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-[#B7CEFA] hover:bg-[#F5F8FC] dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{comp.title}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{comp.summary}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. 真实装机工具榜单（复用全站零伪造统计组件） */}
      <SoftwareLeaderboards
        mostViewed={data.leaderboards.mostViewed}
        mostDownloaded={data.leaderboards.mostDownloaded}
        headingTitle="近期热门装机工具与下载点击动态"
        headingSubtitle={`${data.meta.viewStatsLabel} · ${data.meta.downloadStatsLabel}`}
        viewTopTitle="近期热门装机软件"
      />

      {/* 5. 严格区分「版本发布日更新」与「平台最新收录」 */}
      <section aria-labelledby="essentials-updates-heading" className="space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 id="essentials-updates-heading" className="text-xl font-bold text-slate-900 dark:text-white">
              近期版本更新与最新收录软件
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              严格使用软件版本真实发布日期与平台首次公开收录日期，杜绝因编辑摘要改动误报发版
            </p>
          </div>
          <Link to="/updates" className="text-xs font-medium text-[#1769D2] hover:underline shrink-0">
            全站更新动态 →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#1769D2]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">近期版本发布更新</h3>
              </div>
              <span className="text-[11px] text-slate-400">依版本发布日期</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {data.latestUpdates.versionUpdates.map((sw) => (
                <Link
                  key={sw.id}
                  to={`/software/${sw.slug}`}
                  className="py-2 flex items-center justify-between gap-3 hover:text-[#1769D2] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SoftwareIcon
                      iconUrl={sanitizeChannelIconUrl(sw.iconUrl)}
                      name={sw.name}
                      slug={sw.slug}
                      categorySlug={sw.categorySlug}
                      size="sm"
                      className="w-7 h-7! rounded-md!"
                    />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">
                      {getSimpleSoftwareName(sw.name)}
                    </span>
                    {sw.latestVersion && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] font-mono shrink-0">
                        {getSimpleVersion(sw.latestVersion)}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                    {sw.releaseDate || formatShortDate(sw.updatedAt)}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">最新公开发布收录</h3>
              </div>
              <span className="text-[11px] text-slate-400">依入库发布日期</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {data.latestUpdates.newlyCataloged.map((sw) => (
                <Link
                  key={sw.id}
                  to={`/software/${sw.slug}`}
                  className="py-2 flex items-center justify-between gap-3 hover:text-[#1769D2] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SoftwareIcon
                      iconUrl={sanitizeChannelIconUrl(sw.iconUrl)}
                      name={sw.name}
                      slug={sw.slug}
                      categorySlug={sw.categorySlug}
                      size="sm"
                      className="w-7 h-7! rounded-md!"
                    />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">
                      {getSimpleSoftwareName(sw.name)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                      {sw.categoryName}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                    {formatShortDate(sw.catalogedAt)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
