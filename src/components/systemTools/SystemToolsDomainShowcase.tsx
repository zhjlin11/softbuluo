import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Bookmark,
  Award,
  ArrowUpRight,
  Monitor,
} from 'lucide-react';
import { SystemToolChannelItem, SystemToolDomainBlock } from '../../services/channelService';
import { SoftwareIcon } from '../common/SoftwareIcon';
import {
  formatLicenseLabel,
  formatShortPlatform,
  getSimpleSoftwareName,
  getSimpleVersion,
  sanitizeChannelIconUrl,
} from '../software/softwareHelpers';

interface SystemToolsDomainShowcaseProps {
  sectionRef?: React.RefObject<HTMLElement | null>;
  domains: SystemToolDomainBlock[];
  activeDomainSlug: string;
  onSelectDomain: (slug: string) => void;
  onJumpToCatalogWithCategory: (categorySlug: string) => void;
  editorPicks: SystemToolChannelItem[];
}

export const SystemToolsDomainShowcase: React.FC<SystemToolsDomainShowcaseProps> = ({
  sectionRef,
  domains,
  activeDomainSlug,
  onSelectDomain,
  onJumpToCatalogWithCategory,
  editorPicks,
}) => {
  const displayedDomains =
    activeDomainSlug === 'all'
      ? domains
      : domains.filter((d) => d.slug === activeDomainSlug);

  return (
    <div className="space-y-8">
      {/* 专业系统工具分类分区 */}
      <section ref={sectionRef} aria-labelledby="domains-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="domains-heading" className="text-xl font-bold text-slate-900 dark:text-white">
              专业系统工具分类
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              按技术人员核心排障维度归档（每款工具严格归口主功能域，单款分类自动采用紧凑专列展示）
            </p>
          </div>
          {activeDomainSlug !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectDomain('all')}
              className="text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline cursor-pointer"
            >
              显示全部分类 ({domains.length})
            </button>
          )}
        </div>

        <div className="space-y-4">
          {displayedDomains.map((domain) => {
            const isSingleTool = domain.tools.length === 1;
            return (
              <div
                key={domain.slug}
                className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-5 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{domain.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 tabular-nums">
                        {domain.totalCount} 款真实工具
                      </span>
                      {domain.relatedTopic && (
                        <Link
                          to={`/topics/${domain.relatedTopic.slug}`}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-300 hover:underline"
                        >
                          <Bookmark className="w-3 h-3" />
                          {domain.relatedTopic.title}
                        </Link>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{domain.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onJumpToCatalogWithCategory(domain.filterCategorySlug)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
                  >
                    在工具库筛选同类
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 领域内风险提示 */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{domain.safetyNote}</span>
                </p>

                {isSingleTool ? (
                  /* 单分类仅 1 款工具：采用紧凑横向展示，避免制造大型空白区域 */
                  (() => {
                    const t = domain.tools[0];
                    const lic = formatLicenseLabel(t.licenseType);
                    const ver = getSimpleVersion(t.latestVersion || undefined);
                    return (
                      <div className="rounded-xl border border-[#DCE6F5] dark:border-slate-800 bg-[#F9FBFE] dark:bg-slate-800/40 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <SoftwareIcon
                            iconUrl={sanitizeChannelIconUrl(t.iconUrl)}
                            name={t.name}
                            slug={t.slug}
                            categorySlug={t.categorySlug}
                            size="md"
                            className="shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                to={`/software/${t.slug}`}
                                className="text-base font-bold text-slate-900 dark:text-white hover:text-[#1769D2]"
                              >
                                {getSimpleSoftwareName(t.name)}
                              </Link>
                              {ver && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono">
                                  {ver}
                                </span>
                              )}
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                {lic.label}
                              </span>
                              {t.riskLevel === 'HIGH' && (
                                <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100/80 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-medium">
                                  高风险 · 操作前需备份
                                </span>
                              )}
                              {!t.hasVerifiedSource && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  登记渠道
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {t.summary}
                            </p>
                          </div>
                        </div>

                        <Link
                          to={`/software/${t.slug}`}
                          className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-semibold shrink-0 transition-colors"
                        >
                          查看详情与安全说明
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    );
                  })()
                ) : (
                  /* 多款工具：均匀 2~3 列紧凑工具卡 */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {domain.tools.map((t) => {
                      const lic = formatLicenseLabel(t.licenseType);
                      const ver = getSimpleVersion(t.latestVersion || undefined);
                      return (
                        <article
                          key={t.id}
                          className="min-w-0 rounded-xl border border-[#E6ECF5] dark:border-slate-800 hover:border-[#93B8F8] dark:hover:border-blue-700/70 p-4 flex flex-col justify-between transition-colors"
                        >
                          <div>
                            <div className="flex items-start gap-3">
                              <SoftwareIcon
                                iconUrl={sanitizeChannelIconUrl(t.iconUrl)}
                                name={t.name}
                                slug={t.slug}
                                categorySlug={t.categorySlug}
                                size="md"
                                className="shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Link
                                    to={`/software/${t.slug}`}
                                    title={t.name}
                                    className="text-sm font-bold text-slate-900 dark:text-white hover:text-[#1769D2] truncate"
                                  >
                                    {getSimpleSoftwareName(t.name)}
                                  </Link>
                                  {t.hasVerifiedSource ? (
                                    <span title="含已审核健康直连来源" className="inline-flex shrink-0">
                                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    </span>
                                  ) : (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                                      登记渠道
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  {ver && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono truncate max-w-[90px]">
                                      {ver}
                                    </span>
                                  )}
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                                      lic.tone === 'oss'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/70'
                                        : lic.tone === 'paid'
                                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/70'
                                          : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/70'
                                    }`}
                                  >
                                    {lic.label}
                                  </span>
                                  {t.riskLevel === 'HIGH' && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium">
                                      需备份
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {t.summary}
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-400 inline-flex items-center gap-1 truncate">
                              <Monitor className="w-3 h-3 shrink-0" />
                              {formatShortPlatform(t.platform)}
                            </span>
                            <Link
                              to={`/software/${t.slug}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EFF5FF] dark:bg-blue-950/50 hover:bg-[#1769D2] text-[#1769D2] dark:text-blue-300 hover:text-white font-medium transition-colors"
                            >
                              查看工具
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 编辑精选工具 */}
      {editorPicks.length > 0 && (
        <section aria-labelledby="editor-tools-heading" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </span>
              <div>
                <h2 id="editor-tools-heading" className="text-xl font-bold text-slate-900 dark:text-white">
                  编辑精选工具
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  筛选技术代表性强、渠道清晰的系统排障及底层运维工具（已与顶部常用栏去重降低重叠）
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {editorPicks.map((tool) => {
              const lic = formatLicenseLabel(tool.licenseType);
              const ver = getSimpleVersion(tool.latestVersion || undefined);
              return (
                <article
                  key={tool.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 hover:border-[#93B8F8] dark:hover:border-blue-700/70 p-5 shadow-2xs flex flex-col justify-between transition-colors"
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
                            className="text-base font-bold text-slate-900 dark:text-white hover:text-[#1769D2] truncate"
                          >
                            {getSimpleSoftwareName(tool.name)}
                          </Link>
                          {tool.hasVerifiedSource ? (
                            <span title="含已审核健康直连来源" className="inline-flex shrink-0">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                              登记渠道
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-300 font-medium">
                            {tool.domainName}
                          </span>
                          {ver && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                              {ver}
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            {lic.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {tool.editorialNote || tool.summary}
                    </p>

                    {tool.riskNotice && (
                      <div className="mt-2.5 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50 rounded-lg px-2.5 py-1.5 line-clamp-2">
                        {tool.riskNotice}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatShortPlatform(tool.platform)}
                    </span>
                    <Link
                      to={`/software/${tool.slug}`}
                      className="inline-flex items-center gap-1 font-semibold text-[#1769D2] dark:text-blue-400 hover:underline"
                    >
                      查看详情与来源
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
