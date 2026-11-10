import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  ArrowRight,
  BookOpen,
  Scale,
  RefreshCw,
  PlusCircle,
  ChevronRight,
} from 'lucide-react';
import { SoftwareIcon } from '../common/SoftwareIcon';
import {
  ChannelComparisonItem,
  ChannelSoftwareItem,
  ChannelTopicItem,
  ChannelTutorialItem,
} from '../../services/channelService';
import {
  formatShortDate,
  formatShortPlatform,
  getSimpleSoftwareName,
  getSimpleVersion,
  sanitizeChannelIconUrl,
} from './softwareHelpers';

interface SoftwareEditorialExtrasProps {
  hotTopics: ChannelTopicItem[];
  tutorials: ChannelTutorialItem[];
  comparisons: ChannelComparisonItem[];
  versionUpdates: ChannelSoftwareItem[];
  newlyCataloged: ChannelSoftwareItem[];
}

const TOPIC_ACCENTS = [
  'from-blue-600 to-indigo-600',
  'from-cyan-600 to-blue-600',
  'from-emerald-600 to-teal-600',
  'from-indigo-600 to-violet-600',
  'from-sky-600 to-blue-700',
  'from-slate-700 to-slate-900',
];

export const SoftwareEditorialExtras: React.FC<SoftwareEditorialExtrasProps> = ({
  hotTopics,
  tutorials,
  comparisons,
  versionUpdates,
  newlyCataloged,
}) => {
  return (
    <div className="space-y-8">
      {/* 1. 软件专题推荐 (3列桌面卡片) */}
      {hotTopics.length > 0 && (
        <section aria-labelledby="topics-heading" className="space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </span>
              <div>
                <h2 id="topics-heading" className="text-lg font-bold text-slate-900 dark:text-white">
                  软件专题推荐
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  围绕装机、排障、办公与生产力场景深度聚合正版工具清单
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
            {hotTopics.map((topic, idx) => (
              <Link
                key={topic.id}
                to={`/topics/${topic.slug}`}
                className="group min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 hover:border-[#B7CEFA] dark:hover:border-blue-800 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* 原创矢量视觉顶栏与真实图标组合（杜绝外链失效与版权争议图片） */}
                  <div
                    className={`h-24 px-4 flex items-center justify-between bg-gradient-to-r ${TOPIC_ACCENTS[idx % TOPIC_ACCENTS.length]} text-white relative overflow-hidden`}
                  >
                    <div className="relative z-10 flex items-center gap-1.5">
                      {topic.previewSoftwares.slice(0, 4).map((sw) => (
                        <div
                          key={sw.slug}
                          className="p-1 rounded-lg bg-white/95 dark:bg-slate-900/95 shadow-xs"
                        >
                          <SoftwareIcon
                            iconUrl={sanitizeChannelIconUrl(sw.iconUrl)}
                            name={sw.name}
                            slug={sw.slug}
                            categorySlug={sw.categorySlug}
                            size="sm"
                            className="w-7 h-7! rounded-md!"
                          />
                        </div>
                      ))}
                    </div>
                    <span className="relative z-10 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-medium shrink-0">
                      {topic.resourceCount} 款软件
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white group-hover:text-[#1769D2] dark:group-hover:text-blue-400 line-clamp-2 transition-colors">
                      {topic.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {topic.description}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{topic.isFeatured ? '官方编辑精选合集' : '场景软件合集'}</span>
                  <span className="inline-flex items-center gap-1 text-[#1769D2] dark:text-blue-400 font-medium">
                    进入专题
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 2. 实用教程与横向评测对比 */}
      {(tutorials.length > 0 || comparisons.length > 0) && (
        <section aria-labelledby="tutorials-compare-heading" className="space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="tutorials-compare-heading" className="text-lg font-bold text-slate-900 dark:text-white">
                装机教程与选型评测
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                手把手实操指南与同类正版软件参数对比，快速选出最适合的工具
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 左侧：实用教程 (7列) */}
            <div className="lg:col-span-7 min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#1769D2]" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    实用教程指南
                  </h3>
                </div>
                <Link
                  to="/tutorials"
                  className="text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline"
                >
                  全部教程 &gt;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tutorials.map((tut) => (
                  <Link
                    key={tut.id}
                    to={`/tutorials/${tut.slug}`}
                    className="group min-w-0 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#B7CEFA] dark:hover:border-blue-800 hover:bg-[#F5F8FC] dark:hover:bg-slate-800/60 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#1769D2] dark:group-hover:text-blue-400 line-clamp-2 leading-snug">
                        {tut.title}
                      </h4>
                      <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {tut.summary}
                      </p>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate">
                        {tut.software ? getSimpleSoftwareName(tut.software.name) : '实战教程'}
                      </span>
                      <span className="tabular-nums shrink-0">{formatShortDate(tut.publishedAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 右侧：深度横向评测对比 (5列) */}
            <div className="lg:col-span-5 min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#1769D2]" />
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      深度横向对比评测
                    </h3>
                  </div>
                  <Link
                    to="/compare"
                    className="text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline"
                  >
                    评测中心 &gt;
                  </Link>
                </div>

                {comparisons.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">暂无已发布对比评测</p>
                ) : (
                  <div className="space-y-3">
                    {comparisons.map((comp) => (
                      <Link
                        key={comp.id}
                        to={`/compare/${comp.slug}`}
                        className="group block p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#B7CEFA] dark:hover:border-blue-800 hover:bg-[#F5F8FC] dark:hover:bg-slate-800/60 transition-all"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {comp.softwares.slice(0, 2).map((sw, i) => (
                            <React.Fragment key={sw.slug}>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <SoftwareIcon
                                  iconUrl={sanitizeChannelIconUrl(sw.iconUrl)}
                                  name={sw.name}
                                  slug={sw.slug}
                                  size="sm"
                                  className="w-6 h-6! rounded-md!"
                                />
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                                  {getSimpleSoftwareName(sw.name)}
                                </span>
                              </div>
                              {i === 0 && comp.softwares.length > 1 && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-[#1769D2] dark:text-blue-300 text-[10px] font-bold">
                                  VS
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#1769D2] dark:group-hover:text-blue-400 line-clamp-2">
                          {comp.title}
                        </h4>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {comp.summary}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>客观参数 · 绝无充值软文</span>
                <Link
                  to="/compare"
                  className="text-[#1769D2] dark:text-blue-400 font-medium hover:underline"
                >
                  查看全部评测
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. 最近更新动态（严格区分：版本发布日期 vs 新收录上架日期） */}
      <section aria-labelledby="updates-split-heading" className="space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
              <h2 id="updates-split-heading" className="text-lg font-bold text-slate-900 dark:text-white">
                近期版本更新与新收录软件
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                严格区分官网上游版本发布日期与平台首次收录日期，避免时间线混淆
              </p>
          </div>
          <Link
            to="/updates"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline shrink-0"
          >
            版本时间轴
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 左栏：近期版本更新 */}
          <div className="min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#1769D2]" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  近期版本更新
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">按版本发布日排序</span>
            </div>

            <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {versionUpdates.slice(0, 8).map((sw) => (
                <li key={sw.id}>
                  <Link
                    to={`/software/${sw.slug}`}
                    className="group flex items-center justify-between gap-3 py-2.5 px-1.5 -mx-1.5 rounded-lg hover:bg-[#F5F8FC] dark:hover:bg-slate-800/70 transition-colors min-w-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SoftwareIcon
                        iconUrl={sanitizeChannelIconUrl(sw.iconUrl)}
                        name={sw.name}
                        slug={sw.slug}
                        categorySlug={sw.categorySlug}
                        size="sm"
                        className="w-8 h-8! rounded-lg!"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 group-hover:text-[#1769D2] dark:group-hover:text-blue-400 truncate">
                            {getSimpleSoftwareName(sw.name, sw.englishName || undefined)}
                          </span>
                          {sw.latestVersion && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/70 text-[#1769D2] dark:text-blue-300 text-[10px] font-medium shrink-0">
                              {getSimpleVersion(sw.latestVersion)}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {formatShortPlatform(sw.platform)} · {sw.categoryName}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                      {formatShortDate(sw.releaseDate)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 右栏：新收录桌面软件 */}
          <div className="min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  新收录桌面软件
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">按平台首次上架时间排序</span>
            </div>

            <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {newlyCataloged.slice(0, 8).map((sw) => (
                <li key={sw.id}>
                  <Link
                    to={`/software/${sw.slug}`}
                    className="group flex items-center justify-between gap-3 py-2.5 px-1.5 -mx-1.5 rounded-lg hover:bg-[#F5F8FC] dark:hover:bg-slate-800/70 transition-colors min-w-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SoftwareIcon
                        iconUrl={sanitizeChannelIconUrl(sw.iconUrl)}
                        name={sw.name}
                        slug={sw.slug}
                        categorySlug={sw.categorySlug}
                        size="sm"
                        className="w-8 h-8! rounded-lg!"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 group-hover:text-[#1769D2] dark:group-hover:text-blue-400 truncate">
                            {getSimpleSoftwareName(sw.name, sw.englishName || undefined)}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium shrink-0">
                            新收录
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {sw.categoryName} · {sw.summary}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                      {formatShortDate(sw.catalogedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
