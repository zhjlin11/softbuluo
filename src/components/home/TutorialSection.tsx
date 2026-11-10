import React from 'react';
import { BookOpen, Clock, User, Calendar, ArrowRight, ShieldAlert } from 'lucide-react';
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

  const mainTutorial = tutorials[0];
  const listTutorials = tutorials.slice(1);

  return (
    <section id="tutorials" className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mb-12 scroll-mt-20">
      <div className="bg-white dark:bg-[#141F33] rounded-lg border border-[#E5E9F0] dark:border-slate-800 p-5 sm:p-6">
        <div className="flex items-center justify-between pb-3 mb-5 border-b border-[#EDF0F4] dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#1769D2]" />
            <h2 className="text-base sm:text-lg font-bold text-[#202938] dark:text-slate-100">
              装机与实操避坑教程
            </h2>
            <span className="text-xs text-[#667085] dark:text-slate-400 hidden sm:inline">
              | 拒绝流氓 PE 与病毒捆绑 · 原版系统维护实战指南
            </span>
          </div>
          <span className="text-xs text-[#1769D2] dark:text-blue-400 font-medium">
            技术团队整理
          </span>
        </div>

        {/* 编辑式排版：左侧单篇深度精选 + 右侧多篇列表条目 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧单篇深度重点文章 (带视觉图文横幅) */}
          {mainTutorial && (
            <div
              onClick={() => onSelectTutorial?.(mainTutorial)}
              className="lg:col-span-5 p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/90 dark:border-slate-800 cursor-pointer hover:border-blue-400 transition-all flex flex-col justify-between group shadow-xs hover:shadow-sm"
            >
              <div>
                {/* 视觉主题横幅 */}
                <div className="w-full h-28 sm:h-32 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 mb-3.5 p-3.5 text-white flex flex-col justify-between relative overflow-hidden shadow-xs group-hover:brightness-105 transition-all">
                  <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between text-[11px] font-semibold text-blue-100 relative z-10">
                    <span className="px-2 py-0.5 rounded bg-black/35 backdrop-blur-xs">装机深度避坑实战</span>
                    <span className="font-mono text-blue-200">{mainTutorial.publishedAt}</span>
                  </div>
                  <div className="relative z-10">
                    <span className="text-[11px] text-blue-200 font-medium">官方正版 · 纯净零流氓</span>
                    <h4 className="text-sm font-bold text-white truncate mt-0.5">
                      {mainTutorial.title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#1769D2] dark:text-blue-400 font-semibold mb-2">
                  <span>深度长文指南</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>预计阅读 {mainTutorial.readTime}</span>
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-[#202938] dark:text-slate-100 mb-2 leading-snug group-hover:text-[#1769D2] transition-colors">
                  {mainTutorial.title}
                </h3>

                <p className="text-xs text-[#667085] dark:text-slate-400 leading-relaxed mb-3 line-clamp-2">
                  {mainTutorial.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  作者：{mainTutorial.author}
                </span>
                <span className="text-[#1769D2] dark:text-blue-400 font-semibold inline-flex items-center gap-1">
                  <span>阅读全文</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          )}

          {/* 右侧文字列表 (以标题、摘要、日期为主，告别统一卡片) */}
          <div className="lg:col-span-7 flex flex-col justify-between divide-y divide-slate-100 dark:divide-slate-800/80">
            {listTutorials.map((tut) => (
              <div
                key={tut.id}
                onClick={() => onSelectTutorial?.(tut)}
                className="py-3.5 first:pt-0 last:pb-0 cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h4 className="text-sm font-bold text-[#202938] dark:text-slate-100 group-hover:text-[#1769D2] transition-colors line-clamp-1">
                    {tut.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono shrink-0 tabular-nums">
                    {tut.publishedAt}
                  </span>
                </div>

                <p className="text-xs text-[#667085] dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
                  {tut.summary}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="text-[#1769D2] dark:text-blue-400 font-medium">
                    {tut.category}
                  </span>
                  <span>·</span>
                  <span>预计阅读 {tut.readTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
