import React from 'react';
import { Compass, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { DecisionGuideItem } from '../../services/compareService';

interface CompareDecisionGuideProps {
  guides: DecisionGuideItem[];
  onSelectPair: (leftSlug: string, rightSlug: string) => void;
  onScrollToMatrix: () => void;
}

export const CompareDecisionGuide: React.FC<CompareDecisionGuideProps> = ({
  guides,
  onSelectPair,
  onScrollToMatrix,
}) => {
  return (
    <section className="mb-14">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>专业选型指南 · 拒绝选择困难症</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            场景化软件选型建议
          </h2>
          <p className="mt-1 text-xs md:text-sm text-slate-600 dark:text-slate-400">
            按工作场景、预算及合规要求为您匹配最适用的工具方案。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {guides.map((guide) => {
          const { leftSlug, leftName, rightSlug, rightName } = guide.recommendedPair;

          return (
            <div
              key={guide.id}
              className="flex flex-col justify-between p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                {/* 场景名称与人群 */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/60 inline-block mb-1.5">
                      {guide.scenario}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {guide.scenario}选型建议
                    </h3>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                    <Users className="w-3 h-3" />
                    <span>{guide.targetUsers}</span>
                  </div>
                </div>

                {/* 核心建议 */}
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {guide.guidance}
                </p>

                {/* 关键考量指标 */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 mb-5">
                  <div className="text-[11px] font-medium text-slate-400 mb-1">关键决策维度：</div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{guide.keyCriteria}</p>
                </div>
              </div>

              {/* 载入两款软件对比 */}
              {leftSlug && rightSlug && (
                <button
                  onClick={() => {
                    onSelectPair(leftSlug, rightSlug);
                    onScrollToMatrix();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>载入此场景对决：{leftName} vs {rightName}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
