import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Clock,
  Laptop,
  CheckCircle2,
  Wrench,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { EnrichedTutorialDto, QuickTroubleshootEntry } from '../../services/tutorialService';

interface TutorialsHeroProps {
  hero: EnrichedTutorialDto;
  quickTroubleshooting: QuickTroubleshootEntry[];
}

export const TutorialsHero: React.FC<TutorialsHeroProps> = ({ hero, quickTroubleshooting }) => {
  return (
    <div className="mb-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* 左侧 65%：核心焦点实操指南 */}
      <div className="lg:col-span-8 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-blue-900/40 shadow-lg relative overflow-hidden flex flex-col justify-between group">
        {/* 背景光效微饰 */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>本周焦点实操</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-xs font-medium border border-white/10">
              {hero.categoryName}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
              {hero.difficultyLabel}
            </span>
            {hero.isHighRisk && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
                <ShieldAlert className="w-3 h-3" />
                <span>高风险操作须备份</span>
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-snug text-white group-hover:text-blue-200 transition-colors">
            <Link to={`/tutorials/${hero.slug}`}>
              {hero.title}
            </Link>
          </h2>

          <p className="mt-3 text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed max-w-2xl">
            {hero.summary}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-blue-400" />
              <span>适用平台：{hero.platform}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>预计耗时：约 {hero.readingMinutes} 分钟</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>工程师级步骤核验</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex flex-wrap gap-1.5">
            {hero.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-white/5 text-slate-400 text-[11px] border border-white/5"
              >
                #{tag}
              </span>
            ))}
          </div>

          <Link
            to={`/tutorials/${hero.slug}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1769D2] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-blue-500/20 transition-all duration-200 group-hover:translate-x-0.5"
          >
            <span>开始阅读实操指南</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 右侧 35%：热门排障快捷解决 */}
      <div className="lg:col-span-4 bg-white dark:bg-[#131C2E] rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-[#1769D2]">
                <Wrench className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                热门排障快捷解决
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">真实排障库</span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
            直击高频电脑硬件、Windows 系统与网络常见疑难，一键直达经过验证的解决方案：
          </p>

          <div className="space-y-2.5">
            {quickTroubleshooting.map((item) => (
              <Link
                key={item.id}
                to={`/tutorials/${item.slug}`}
                className="group flex items-start justify-between gap-2 p-2.5 rounded-xl hover:bg-blue-50/70 dark:hover:bg-slate-800/60 border border-transparent hover:border-blue-200 dark:hover:border-blue-900/40 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-[#1769D2] dark:text-blue-400 shrink-0">
                      {item.badge}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#1769D2] transition-colors">
                      {item.problem}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {item.description}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1769D2] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
          <span>所有方案均基于真实软硬件实操测试与复核</span>
        </div>
      </div>
    </div>
  );
};
