import React from 'react';
import { Scale, Zap, ShieldCheck, ArrowRight, Sparkles, CheckCircle2, SplitSquareVertical } from 'lucide-react';
import { HeroSlideItem } from '../../services/compareService';
import { SoftwareIcon } from '../common/SoftwareIcon';

interface ComparePortalHeroProps {
  slides: HeroSlideItem[];
  onSelectPair: (leftSlug: string, rightSlug: string) => void;
  onScrollToMatrix: () => void;
  comparableCount: number;
  articlesCount: number;
  alternativesCount: number;
}

export const ComparePortalHero: React.FC<ComparePortalHeroProps> = ({
  slides,
  onSelectPair,
  onScrollToMatrix,
  comparableCount,
  articlesCount,
  alternativesCount,
}) => {
  const primarySlide = slides[0] || {
    title: '7-Zip vs PeaZip：开源解压缩工具全面横评',
    summary: '极致算法压缩率 vs 现代图形界面与二要素安全加密的深度对决',
    badgeText: '年度旗舰横评',
    targetUrl: '/compare/7zip-vs-peazip',
    matrixUrl: '/compare?left=7zip&right=peazip',
    softwareA: {
      slug: '7zip',
      name: '7-Zip',
      iconUrl: null,
      version: '最新稳定版',
      licenseType: '开源自由 (LGPL)',
      categoryName: '解压工具',
      editorNotes: null,
      isRecommended: true,
    },
    softwareB: {
      slug: 'peazip',
      name: 'PeaZip',
      iconUrl: null,
      version: '最新稳定版',
      licenseType: '开源自由 (LGPL)',
      categoryName: '解压工具',
      editorNotes: null,
      isRecommended: true,
    },
  };

  return (
    <section className="mb-10 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 lg:p-10 shadow-xl border border-indigo-900/40 relative overflow-hidden max-w-full">
      {/* 装饰光晕背景 */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none transform -translate-x-1/3 translate-y-1/3" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* 左侧 65% 主视觉文案与核心数据 */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span>软游部落 UI 3.0 对比评测中心</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
            软件横向对比与<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">客观选型指南</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            拒绝充值软文与虚假排行榜。软游部落依托真实系统环境，为您提供多维度功能参数对比、开源合规审查、启动与内存实测、差异高亮筛选及场景化选型建议。
          </p>

          {/* 核心指标统计徽章 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-xl font-bold text-blue-400">{comparableCount} 款</div>
              <div className="text-xs text-slate-400 mt-0.5">已发布可比软件</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-xl font-bold text-indigo-400">{articlesCount} 篇</div>
              <div className="text-xs text-slate-400 mt-0.5">深度长文横评</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-xl font-bold text-emerald-400">{alternativesCount} 组</div>
              <div className="text-xs text-slate-400 mt-0.5">认证开源替代方案</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-xl font-bold text-amber-400">100%</div>
              <div className="text-xs text-slate-400 mt-0.5">真实环境零软文</div>
            </div>
          </div>

          {/* 快捷跳转按钮 */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={onScrollToMatrix}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <SplitSquareVertical className="w-4 h-4" />
              <span>开始自由双软件对比</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#featured-articles"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-medium text-sm border border-white/15 transition-colors"
            >
              <span>查看精选长文</span>
            </a>
          </div>
        </div>

        {/* 右侧 35% 焦点对比卡片 (VS Spotlight) */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 p-5 md:p-6 backdrop-blur-md shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                {primarySlide.badgeText}
              </span>
              <span className="text-xs text-slate-400">标准化对齐评测</span>
            </div>

            <h2 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-blue-300 transition-colors">
              {primarySlide.title}
            </h2>
            <p className="text-xs text-slate-300 mb-5 line-clamp-2">
              {primarySlide.summary}
            </p>

            {/* VS 对决核心展示 */}
            <div className="grid grid-cols-5 items-center gap-2 py-4 px-3 rounded-xl bg-slate-950/40 border border-white/10 mb-5">
              {/* 左侧软件 */}
              <div className="col-span-2 flex flex-col items-center text-center">
                <SoftwareIcon
                  iconUrl={primarySlide.softwareA.iconUrl}
                  name={primarySlide.softwareA.name}
                  slug={primarySlide.softwareA.slug}
                  size="md"
                />
                <span className="mt-2 text-xs font-bold text-white truncate max-w-full">
                  {primarySlide.softwareA.name}
                </span>
                <span className="text-[10px] text-blue-300 truncate max-w-full">
                  {primarySlide.softwareA.licenseType}
                </span>
              </div>

              {/* VS 徽章 */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                  VS
                </span>
              </div>

              {/* 右侧软件 */}
              <div className="col-span-2 flex flex-col items-center text-center">
                <SoftwareIcon
                  iconUrl={primarySlide.softwareB.iconUrl}
                  name={primarySlide.softwareB.name}
                  slug={primarySlide.softwareB.slug}
                  size="md"
                />
                <span className="mt-2 text-xs font-bold text-white truncate max-w-full">
                  {primarySlide.softwareB.name}
                </span>
                <span className="text-[10px] text-indigo-300 truncate max-w-full">
                  {primarySlide.softwareB.licenseType}
                </span>
              </div>
            </div>

            {/* 立即一键载入对比 */}
            <button
              onClick={() => {
                onSelectPair(primarySlide.softwareA.slug, primarySlide.softwareB.slug);
                onScrollToMatrix();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>载入此组完整参数对比矩阵</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
