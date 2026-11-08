import React from 'react';
import { BookOpen, Clock, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { TutorialItem } from '../../types/resource';

interface TutorialSectionProps {
  tutorials: TutorialItem[];
  onSelectTutorial?: (tutorial: TutorialItem) => void;
}

export const TutorialSection: React.FC<TutorialSectionProps> = ({
  tutorials,
  onSelectTutorial,
}) => {
  if (!tutorials || tutorials.length === 0) {
    return null;
  }

  return (
    <section id="tutorials" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              安装教程与问题解决
            </h2>
            <span className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              <BookOpen className="w-3.5 h-3.5" />
              <span>实用干货</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            由技术团队与运维一线整理的纯净装机、系统排障与软件优化实操指南
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {tutorials.map((tut) => (
          <article
            key={tut.id}
            onClick={() => onSelectTutorial?.(tut)}
            className="flex flex-col justify-between p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div>
              {/* 分类与预计阅读时长 */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mb-2.5">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {tut.category}
                </span>
                <span className="flex items-center gap-1 tabular-nums">
                  <Clock className="w-3 h-3" />
                  <span>{tut.readTime}</span>
                </span>
              </div>

              {/* 文章标题 */}
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mb-2.5">
                {tut.title}
              </h3>

              {/* 摘要 */}
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
                {tut.summary}
              </p>
            </div>

            {/* 底部作者与发布日期 */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span className="truncate max-w-[120px]">{tut.author}</span>
              <span className="tabular-nums">{tut.publishedAt}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
