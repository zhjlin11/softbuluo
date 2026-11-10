import React from 'react';
import { MessageSquare, Plus, Search, CheckCircle2, ShieldCheck, HelpCircle, Sparkles } from 'lucide-react';

interface CommunityHeroProps {
  onOpenCreateModal: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  totalThreads: number;
  resolvedThreads: number;
}

export const CommunityHero: React.FC<CommunityHeroProps> = ({
  onOpenCreateModal,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  totalThreads,
  resolvedThreads,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 md:p-10 mb-8 shadow-xl border border-indigo-900/40">
      {/* 背景装饰网格与光晕 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.25),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* 左侧标语与定位 */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-medium mb-3 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>软游部落技术互助社区 · UI 3.0</span>
            <span className="w-1 h-1 rounded-full bg-blue-400" />
            <span className="text-blue-200">纯净无灌水</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-3">
            电脑装机维护与正版软件技术问答
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            汇聚真实用户的系统排障经验、软硬件调试技巧与官方开发者一手答疑。拒绝机器人刷量与垃圾营销，沉淀真正可落地的技术解答。
          </p>

          {/* 实时真实特征胶囊 */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                真实收录 <strong className="text-white font-semibold">{totalThreads}</strong> 篇讨论
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>
                已成功解决 <strong className="text-white font-semibold">{resolvedThreads}</strong> 个疑难求助
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>支持采纳最佳解答闭环</span>
            </div>
          </div>
        </div>

        {/* 右侧快捷搜索与发帖主行动区 */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-3">
          <form onSubmit={onSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索问题、错误代码、软件名..."
              className="w-full pl-9 pr-20 py-2.5 bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-800 border border-slate-700/80 focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-center"
            >
              搜索
            </button>
          </form>

          <button
            onClick={onOpenCreateModal}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all transform active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>提问求助 / 发起讨论</span>
          </button>
        </div>
      </div>
    </div>
  );
};
