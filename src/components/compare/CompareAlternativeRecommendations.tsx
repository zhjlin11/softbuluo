import React from 'react';
import { ArrowRight, ShieldCheck, Repeat, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { AlternativeItem } from '../../services/compareService';
import { SoftwareIcon } from '../common/SoftwareIcon';

interface CompareAlternativeRecommendationsProps {
  alternatives: AlternativeItem[];
  onSelectPair: (leftSlug: string, rightSlug: string) => void;
  onScrollToMatrix: () => void;
}

export const CompareAlternativeRecommendations: React.FC<CompareAlternativeRecommendationsProps> = ({
  alternatives,
  onSelectPair,
  onScrollToMatrix,
}) => {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <section className="mb-14">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wider">
            <Repeat className="w-4 h-4" />
            <span>开源与轻量化 · 认证替代方案</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            认证替代软件方案库
          </h2>
          <p className="mt-1 text-xs md:text-sm text-slate-600 dark:text-slate-400">
            当商业软件授权到期、体积过于臃肿或面临隐私审查时，这些经过人工审核的可靠替代品是极佳的选择。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {alternatives.map((alt) => (
          <div
            key={alt.id}
            className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
          >
            <div>
              {/* 原软件与替代软件对比头部 */}
              <div className="grid grid-cols-7 items-center gap-2 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                {/* 原软件 */}
                <div className="col-span-3 flex flex-col items-center text-center">
                  <SoftwareIcon
                    iconUrl={alt.fromIconUrl}
                    name={alt.fromName}
                    slug={alt.fromSlug}
                    size="sm"
                  />
                  <span className="mt-1.5 text-xs font-bold text-slate-900 dark:text-white truncate max-w-full">
                    {alt.fromName}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-full">
                    {alt.fromLicense}
                  </span>
                </div>

                {/* 替代指向箭头 */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* 推荐替代软件 */}
                <div className="col-span-3 flex flex-col items-center text-center">
                  <SoftwareIcon
                    iconUrl={alt.toIconUrl}
                    name={alt.toName}
                    slug={alt.toSlug}
                    size="sm"
                  />
                  <span className="mt-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 truncate max-w-full">
                    {alt.toName}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate max-w-full font-medium">
                    {alt.toLicense}
                  </span>
                </div>
              </div>

              {/* 替代理由 */}
              <div className="mb-4">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>推荐替代理由：</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {alt.reason}
                </p>
              </div>
            </div>

            {/* 载入对比按钮 */}
            <button
              onClick={() => {
                onSelectPair(alt.fromSlug, alt.toSlug);
                onScrollToMatrix();
              }}
              className="w-full py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>对比这两款软件参数</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
