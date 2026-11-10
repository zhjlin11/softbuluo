import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookOpen,
  Scale,
  Clock,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { ChannelComparisonItem, ChannelTopicItem, ChannelTutorialItem, SystemToolChannelItem } from '../../services/channelService';
import { SoftwareIcon } from '../common/SoftwareIcon';
import { formatLicenseLabel, formatShortDate, getSimpleSoftwareName, getSimpleVersion, sanitizeChannelIconUrl } from '../software/softwareHelpers';

interface SystemToolsEditorialAndUpdatesProps {
  topics: ChannelTopicItem[];
  tutorials: Array<
    ChannelTutorialItem & {
      requireBackup?: boolean;
      requireAdmin?: boolean;
    }
  >;
  comparisons: ChannelComparisonItem[];
  versionUpdates: SystemToolChannelItem[];
  newlyCataloged: SystemToolChannelItem[];
}

export const SystemToolsEditorialAndUpdates: React.FC<SystemToolsEditorialAndUpdatesProps> = ({
  topics,
  tutorials,
  comparisons,
  versionUpdates,
  newlyCataloged,
}) => {
  return (
    <div className="space-y-8">
      {/* 1. 维修与维护专题合集 */}
      {topics.length > 0 && (
        <section aria-labelledby="repair-topics-heading" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Bookmark className="w-4 h-4" />
              </span>
              <div>
                <h2 id="repair-topics-heading" className="text-xl font-bold text-slate-900 dark:text-white">
                  维修与维护专题
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  围绕系统排障、硬盘急救与环境治理组织的已审核发布专题合集
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                to={`/topics/${topic.slug}`}
                className="group bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 hover:border-[#93B8F8] dark:hover:border-blue-700/70 overflow-hidden shadow-2xs flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden">
                    {topic.coverUrl && (
                      <img
                        src={topic.coverUrl}
                        alt={topic.title}
                        width={960}
                        height={540}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                    <span className="absolute bottom-2.5 left-3 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white font-medium">
                      关联 {topic.resourceCount} 款资源
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#1769D2] dark:group-hover:text-blue-400 line-clamp-1">
                      {topic.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {topic.description}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-[#1769D2] dark:text-blue-400 font-medium">
                  <span>进入专题工具清单</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 2. 系统维护教程 + 评测对比 */}
      {(tutorials.length > 0 || comparisons.length > 0) && (
        <section aria-labelledby="repair-tutorials-heading" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* 左：系统维护实操教程 */}
          <div className="lg:col-span-8 min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-5 shadow-2xs">
            <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </span>
                <div>
                  <h2 id="repair-tutorials-heading" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    系统维护教程与排障指南
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    仅收录已审核发布的实操教程，涉高危操作均标注备份与权限提醒
                  </p>
                </div>
              </div>
              <Link to="/tutorials" className="text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline shrink-0">
                全部教程 &gt;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {tutorials.map((tut) => (
                <Link
                  key={tut.id}
                  to={`/tutorials/${tut.slug}`}
                  className="group p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#93B8F8] dark:hover:border-blue-800 bg-[#FAFBFD] dark:bg-slate-800/35 flex flex-col justify-between gap-2 transition-colors"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      {tut.requireBackup && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          涉及数据 · 需先备份
                        </span>
                      )}
                      {tut.requireAdmin && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                          <ShieldAlert className="w-3 h-3" />
                          管理员权限
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#1769D2] line-clamp-2 leading-snug">
                      {tut.title}
                    </h3>
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {tut.summary}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="truncate">{tut.software ? getSimpleSoftwareName(tut.software.name) : '系统运维指南'}</span>
                    <span className="tabular-nums shrink-0">{formatShortDate(tut.publishedAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 右：工具对比评测与安全提示卡 */}
          <div className="lg:col-span-4 min-w-0 flex flex-col gap-4">
            {comparisons.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-5 shadow-2xs flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Scale className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">工具选型对比</h3>
                    </div>
                    <Link to="/compare" className="text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline">
                      对比中心
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {comparisons.map((comp) => (
                      <Link
                        key={comp.id}
                        to={`/compare/${comp.slug}`}
                        className="block p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-[#93B8F8] bg-[#F8FAFD] dark:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          {comp.softwares.slice(0, 2).map((s) => (
                            <span key={s.slug} className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-200">
                              <SoftwareIcon
                                iconUrl={sanitizeChannelIconUrl(s.iconUrl)}
                                name={s.name}
                                slug={s.slug}
                                size="sm"
                                className="w-5! h-5! rounded-sm!"
                              />
                              {getSimpleSoftwareName(s.name)}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">{comp.title}</div>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{comp.summary}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-900 dark:bg-slate-900/90 text-white rounded-xl border border-slate-800 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>下载校验与授权声明</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                本频道仅收录开源及官方公开发布通道，拒绝提供修改版系统镜像与激活绕过脚本。即使下载渠道可达，仍建议核查数字签名与实际 SHA-256 哈希；标注「未含哈希」的来源请自行前往厂商发布页核验。
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 3. 最近更新（严格区分原厂版本发布日期 vs 平台收录日期） */}
      <section aria-labelledby="tool-updates-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="tool-updates-heading" className="text-xl font-bold text-slate-900 dark:text-white">
              近期版本更新与最新收录工具
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              严格采用审核版本发布日期 (`releaseDate`) 与入库上架时间 (`publishedAt`) 双口径分离
            </p>
          </div>
          <Link
            to="/updates"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline shrink-0"
          >
            更新日志中心
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 左：近期版本更新 */}
          <div className="min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1769D2]" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">最近版本更新</h3>
              </div>
              <span className="text-[11px] text-slate-400">按原厂版本发布日</span>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {versionUpdates.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/software/${item.slug}`}
                    className="group flex items-center justify-between gap-3 py-2.5 px-1.5 -mx-1.5 rounded-lg hover:bg-[#F5F8FC] dark:hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SoftwareIcon
                        iconUrl={sanitizeChannelIconUrl(item.iconUrl)}
                        name={item.name}
                        slug={item.slug}
                        categorySlug={item.categorySlug}
                        size="sm"
                        className="w-8! h-8! rounded-lg! shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 group-hover:text-[#1769D2] truncate">
                            {getSimpleSoftwareName(item.name)}
                          </span>
                          {item.latestVersion && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-300 font-mono">
                              {getSimpleVersion(item.latestVersion)}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{item.domainName}</div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                      {formatShortDate(item.releaseDate)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 右：最新收录工具 */}
          <div className="min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">最新收录工具</h3>
              </div>
              <span className="text-[11px] text-slate-400">按公开入库发布时间</span>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {newlyCataloged.map((item) => {
                const lic = formatLicenseLabel(item.licenseType);
                return (
                  <li key={item.id}>
                    <Link
                      to={`/software/${item.slug}`}
                      className="group flex items-center justify-between gap-3 py-2.5 px-1.5 -mx-1.5 rounded-lg hover:bg-[#F5F8FC] dark:hover:bg-slate-800/70 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SoftwareIcon
                          iconUrl={sanitizeChannelIconUrl(item.iconUrl)}
                          name={item.name}
                          slug={item.slug}
                          categorySlug={item.categorySlug}
                          size="sm"
                          className="w-8! h-8! rounded-lg! shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 group-hover:text-[#1769D2] truncate">
                              {getSimpleSoftwareName(item.name)}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {lic.label}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">{item.summary}</div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                        {formatShortDate(item.catalogedAt)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
