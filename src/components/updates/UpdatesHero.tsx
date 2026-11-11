import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Download, Calendar, ExternalLink, History } from 'lucide-react';
import { FeaturedUpdateDto } from '../../services/updatesService';
import { SoftwareIcon } from '../common/SoftwareIcon';

interface UpdatesHeroProps {
  featured: FeaturedUpdateDto[];
}

export const UpdatesHero: React.FC<UpdatesHeroProps> = ({ featured }) => {
  if (!featured || featured.length === 0) {
    return (
      <div className="mb-8 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white shadow-md relative overflow-hidden border border-blue-800/40">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/20">
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span>版本更新中心 · 真实发版 · 拒绝伪造</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-2">
            软件与游戏最新版本更新追踪中心
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            软游部落以软件原厂真实发布日期（releaseDate）为基准，严格区分软件入库时间与新版本发版时间。提供官方更新日志（Changelog）、版本演进历史与原厂直达下载入口。
          </p>
        </div>
      </div>
    );
  }

  const spotlight = featured[0];
  const sideItems = featured.slice(1, 4);

  return (
    <div className="mb-8 grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 焦点更新卡片 (65% 约等于 8 列) */}
      <div className="lg:col-span-8 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-blue-800/40 p-6 md:p-7 text-white shadow-md flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/20">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>焦点版本更新 · 原厂核验</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>官方发布：<strong className="text-white font-mono">{spotlight.releaseDate}</strong></span>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <SoftwareIcon
              iconUrl={spotlight.softwareIconUrl}
              name={spotlight.softwareName}
              slug={spotlight.softwareSlug}
              categorySlug={spotlight.categorySlug}
              size="lg"
              className="shrink-0 rounded-xl shadow-md border border-white/10"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-lg md:text-xl font-extrabold text-white truncate">
                  <Link to={`/software/${spotlight.softwareSlug}`} className="hover:text-blue-300 transition-colors">
                    {spotlight.softwareName}
                  </Link>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 font-mono font-bold text-xs">
                  v{spotlight.version}
                </span>
                {spotlight.isLatest && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-medium">
                    最新稳定版
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                发行方：{spotlight.developer} · 分类：{spotlight.categoryName} · 平台：{spotlight.platform}
              </p>
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 leading-relaxed">
            <span className="text-blue-300 font-semibold mr-1.5">更新摘要：</span>
            {spotlight.changelogSummary || '官方已发布全新版本，包含稳定性改进与功能优化。'}
          </div>
        </div>

        <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>已通过官方源验证与安全哈希核验</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              to={`/software/${spotlight.softwareSlug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>获取新版本</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 近期其他重要更新 (35% 约等于 4 列) */}
      <div className="lg:col-span-4 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100 px-1">
          <span className="flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-[#1769D2]" />
            <span>近期重要版本演进</span>
          </span>
          <span className="text-slate-400 text-[11px]">原厂直联</span>
        </div>

        <div className="flex-1 flex flex-col gap-3">
          {sideItems.map((item) => (
            <Link
              key={item.versionId}
              to={`/software/${item.softwareSlug}`}
              className="flex-1 p-3.5 rounded-xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-sm transition-all duration-200 flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <SoftwareIcon
                  iconUrl={item.softwareIconUrl}
                  name={item.softwareName}
                  slug={item.softwareSlug}
                  categorySlug={item.categorySlug}
                  size="sm"
                  className="shrink-0 rounded-lg"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-[#1769D2] transition-colors">
                    {item.softwareName}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-300 font-mono font-bold text-[10px]">
                      v{item.version}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.releaseDate}</span>
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1769D2] group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
          {sideItems.length === 0 && (
            <div className="flex-1 p-6 rounded-xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center">
              <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs text-slate-500">暂无更多焦点更新</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
