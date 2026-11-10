import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowUpRight, Eye } from 'lucide-react';
import { SoftwareIcon } from '../common/SoftwareIcon';
import { formatLicenseLabel, getSimpleSoftwareName, getSimpleVersion, sanitizeChannelIconUrl } from './softwareHelpers';

export interface SoftwareCardModel {
  id: string;
  slug: string;
  name: string;
  englishName?: string | null;
  summary: string;
  iconUrl?: string | null;
  categoryName: string;
  categorySlug: string;
  licenseType?: string | null;
  viewCount?: number;
  latestVersion?: string | null;
  hasVerifiedSource?: boolean;
  badgeText?: string | null;
}

interface SoftwareCompactCardProps {
  item: SoftwareCardModel;
  onCategoryClick?: (categorySlug: string) => void;
}

export const SoftwareCompactCard: React.FC<SoftwareCompactCardProps> = ({ item, onCategoryClick }) => {
  const displayTitle = getSimpleSoftwareName(item.name, item.englishName || undefined) || item.name;
  const compactVersion = getSimpleVersion(item.latestVersion || undefined);
  const license = formatLicenseLabel(item.licenseType);

  const licenseClasses =
    license.tone === 'oss'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/70'
      : license.tone === 'paid'
        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/70'
        : 'bg-blue-50 text-[#1769D2] border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/70';

  return (
    <article
      className="group min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 hover:border-[#B7CEFA] dark:hover:border-blue-700/70 shadow-2xs hover:shadow-md transition-all duration-200 p-4 flex flex-col justify-between"
    >
      <div className="min-w-0">
        <div className="flex items-start gap-3 mb-2.5 min-w-0">
          <Link to={`/software/${item.slug}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
            <SoftwareIcon
              iconUrl={sanitizeChannelIconUrl(item.iconUrl)}
              name={item.name}
              slug={item.slug}
              categorySlug={item.categorySlug}
              size="md"
              className="group-hover:scale-105 transition-transform duration-200"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <Link
                to={`/software/${item.slug}`}
                title={item.name}
                className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 hover:text-[#1769D2] dark:hover:text-blue-400 truncate transition-colors"
              >
                {displayTitle}
              </Link>
              {item.hasVerifiedSource === true ? (
                <span
                  className="inline-flex items-center shrink-0"
                  title="含人工审核且近期巡检健康的直连/官网下载源"
                >
                  <ShieldCheck
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                    aria-label="含已审核健康直连来源"
                  />
                </span>
              ) : (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0"
                  title="已收录官方发布渠道，实际获取方式及授权请按详情页与原厂说明为准"
                >
                  登记渠道
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {compactVersion && (
                <span className="inline-flex items-center max-w-[110px] truncate px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium tabular-nums">
                  {compactVersion}
                </span>
              )}
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[11px] font-medium ${licenseClasses}`}>
                {license.label}
              </span>
              {item.badgeText && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium truncate max-w-[90px]">
                  {item.badgeText}
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 min-h-[2.4rem]">
          {item.summary}
        </p>
      </div>

      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/90 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {onCategoryClick ? (
            <button
              type="button"
              onClick={() => onCategoryClick(item.categorySlug)}
              className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-[#1769D2] dark:hover:text-blue-400 truncate cursor-pointer"
            >
              {item.categoryName}
            </button>
          ) : (
            <Link
              to={`/software?category=${item.categorySlug}`}
              className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-[#1769D2] dark:hover:text-blue-400 truncate"
            >
              {item.categoryName}
            </Link>
          )}
          {typeof item.viewCount === 'number' && item.viewCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-0.5 text-[11px] text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
              <Eye className="w-3 h-3" />
              {item.viewCount}
            </span>
          )}
        </div>

        <Link
          to={`/software/${item.slug}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EEF5FF] dark:bg-blue-950/70 text-[#1769D2] dark:text-blue-300 hover:bg-[#1769D2] hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-xs font-medium transition-colors shrink-0"
        >
          查看下载
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
};
