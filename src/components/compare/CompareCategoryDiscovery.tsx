import React from 'react';
import { FolderGit2, ArrowRight } from 'lucide-react';
import { CategoryShelfItem } from '../../services/compareService';
import { SoftwareIcon } from '../common/SoftwareIcon';

interface CompareCategoryDiscoveryProps {
  categories: CategoryShelfItem[];
  onSelectPair: (leftSlug: string, rightSlug: string) => void;
  onScrollToMatrix: () => void;
}

export const CompareCategoryDiscovery: React.FC<CompareCategoryDiscoveryProps> = ({
  categories,
  onSelectPair,
  onScrollToMatrix,
}) => {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="mb-14">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">
            <FolderGit2 className="w-4 h-4" />
            <span>分类探索 · 同类对决</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            按品类浏览软件对比
          </h2>
          <p className="mt-1 text-xs md:text-sm text-slate-600 dark:text-slate-400">
            同一赛道下的产品各有所长，根据您的核心痛点一键载入同类竞品横评。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {cat.name}
                </h3>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/60">
                  {cat.softwareCount} 款软件
                </span>
              </div>

              {/* 代表软件图标展示 */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                {cat.sampleSoftwares.map((s) => (
                  <div key={s.slug} title={s.name}>
                    <SoftwareIcon
                      iconUrl={s.iconUrl}
                      name={s.name}
                      slug={s.slug}
                      size="sm"
                    />
                  </div>
                ))}
              </div>

              {/* 推荐对比对 */}
              {cat.suggestedPair && (
                <div className="space-y-2 mb-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    推荐同类对比：
                  </div>
                  <button
                    onClick={() => {
                      onSelectPair(cat.suggestedPair.leftSlug, cat.suggestedPair.rightSlug);
                      onScrollToMatrix();
                    }}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-100 dark:border-slate-700/60 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {cat.suggestedPair.leftName} vs {cat.suggestedPair.rightName}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
