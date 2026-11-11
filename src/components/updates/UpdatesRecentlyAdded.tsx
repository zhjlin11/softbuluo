import React from 'react';
import { Link } from 'react-router-dom';
import { PackagePlus, Download, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';
import { RecentlyAddedSoftwareDto } from '../../services/updatesService';
import { SoftwareIcon } from '../common/SoftwareIcon';

interface UpdatesRecentlyAddedProps {
  items: RecentlyAddedSoftwareDto[];
}

export const UpdatesRecentlyAdded: React.FC<UpdatesRecentlyAddedProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PackagePlus className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              最近加入软游部落
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            全新收录并完成人工安全审核的软件工具。入库时间仅代表首次收录，严格与版本升级动态区分。
          </p>
        </div>
        <Link
          to="/software"
          className="text-xs font-semibold text-[#1769D2] hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <span>查看全部收录</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-[#131C2E] rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start gap-3">
                <SoftwareIcon
                  iconUrl={item.iconUrl}
                  name={item.name}
                  slug={item.slug}
                  categorySlug={item.categorySlug}
                  size="md"
                  className="shrink-0 rounded-xl"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    <Link to={`/software/${item.slug}`} className="hover:text-[#1769D2] hover:underline">
                      {item.name}
                    </Link>
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium">
                      新收录
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                      v{item.currentVersion}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-3 leading-relaxed">
                {item.summary || '经软游部落人工安全核验，全新收录上线。'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>入库：{item.publishedAt.slice(0, 10)}</span>
              </span>
              <Link
                to={`/software/${item.slug}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-[#1769D2] hover:text-white text-slate-700 dark:text-slate-200 font-medium transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>查看</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
