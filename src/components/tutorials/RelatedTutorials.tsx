import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface RelatedTutorialsProps {
  relatedTutorials: Array<{
    id: string;
    title: string;
    slug: string;
    summary: string;
    coverUrl: string | null;
    publishedAt: string | null;
    categoryName: string;
    difficultyLabel: string;
  }>;
  prevTutorial: { slug: string; title: string } | null;
  nextTutorial: { slug: string; title: string } | null;
}

export const RelatedTutorials: React.FC<RelatedTutorialsProps> = ({
  relatedTutorials,
  prevTutorial,
  nextTutorial,
}) => {
  return (
    <div className="space-y-6">
      {/* 同类推荐教程 */}
      {relatedTutorials && relatedTutorials.length > 0 && (
        <div className="bg-white dark:bg-[#131C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3.5 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-[#1769D2]" />
            <span>同类推荐实操指南</span>
          </h4>

          <div className="space-y-2.5">
            {relatedTutorials.map((tut) => (
              <Link
                key={tut.id}
                to={`/tutorials/${tut.slug}`}
                className="group block p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                  <span className="text-[#1769D2] font-semibold">{tut.categoryName}</span>
                  <span>•</span>
                  <span>{tut.difficultyLabel}</span>
                </div>
                <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#1769D2] line-clamp-2 leading-snug transition-colors">
                  {tut.title}
                </h5>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 上下篇切换导航 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {prevTutorial ? (
          <Link
            to={`/tutorials/${prevTutorial.slug}`}
            className="p-3.5 rounded-xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex items-start gap-2.5 group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-[#1769D2] group-hover:-translate-x-0.5 transition-transform mt-0.5 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block mb-0.5">上一篇实操教程</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1769D2] line-clamp-1 transition-colors">
                {prevTutorial.title}
              </span>
            </div>
          </Link>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 text-slate-400 text-xs flex items-center">
            <span>已经是第一篇教程</span>
          </div>
        )}

        {nextTutorial ? (
          <Link
            to={`/tutorials/${nextTutorial.slug}`}
            className="p-3.5 rounded-xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex items-start justify-between gap-2.5 group text-right"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-slate-400 block mb-0.5">下一篇实操教程</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1769D2] line-clamp-1 transition-colors">
                {nextTutorial.title}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1769D2] group-hover:translate-x-0.5 transition-transform mt-0.5 shrink-0" />
          </Link>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 text-slate-400 text-xs flex items-center justify-end">
            <span>已是最后一篇教程</span>
          </div>
        )}
      </div>
    </div>
  );
};
