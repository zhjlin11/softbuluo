import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, FolderKanban, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';
import { GamesChannelData } from '../../services/channelService';
import { SoftwareLeaderboards } from '../software/SoftwareLeaderboards';
import { getSimpleSoftwareName, getSimpleVersion } from '../software/softwareHelpers';

interface GamesEditorialAndUpdatesProps {
  leaderboards: GamesChannelData['leaderboards'];
  hotTopics: GamesChannelData['hotTopics'];
  guides: GamesChannelData['guides'];
  latestUpdates: GamesChannelData['latestUpdates'];
}

export const GamesEditorialAndUpdates: React.FC<GamesEditorialAndUpdatesProps> = ({
  leaderboards,
  hotTopics,
  guides,
  latestUpdates,
}) => {
  return (
    <section aria-label="真实榜单、游戏专题、攻略指南与更新动态" className="space-y-6">
      {/* 1. 真实排行榜（低样本诚实模式，不凑数不填充 0 记录） */}
      <SoftwareLeaderboards
        mostViewed={leaderboards.popularTop.map((x) => x.software)}
        mostDownloaded={leaderboards.downloadsTop.map((x) => x.software)}
        headingTitle="游戏真实热度与下载触发榜"
        headingSubtitle="仅展示存在真实非零统计的已发布游戏（样本积累中自动切换 TOP 排名），不充数不混入辅助工具"
        viewTopTitle="游戏详情关注"
      />

      {/* 2. 游戏专题、攻略指南 与 最近版本动态 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 游戏专题卡片 */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-[#E6ECF5] dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-[#1769D2]" />
                精选游戏专题
              </h3>
              <Link to="/topics" className="text-[11px] text-[#1769D2] hover:underline">
                全部专题
              </Link>
            </div>

            {hotTopics.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">暂无已关联游戏专题</p>
            ) : (
              hotTopics.map((topic) => (
                <Link
                  key={topic.id}
                  to={`/topics/${topic.slug}`}
                  className="group block rounded-xl overflow-hidden bg-[#F5F8FC] dark:bg-slate-800/70 border border-[#E6ECF5] dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="relative h-32 bg-slate-900 overflow-hidden">
                    <img
                      src={topic.coverUrl || '/images/games/hero-indie-collection.svg'}
                      alt={topic.title}
                      width={640}
                      height={360}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                    <span className="absolute bottom-2.5 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600/90 text-white text-[10px] font-semibold">
                      <Sparkles className="w-3 h-3" />
                      含 {topic.resourceCount} 款已发布作品
                    </span>
                  </div>
                  <div className="p-3.5 space-y-1.5">
                    <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#1769D2]">
                      {topic.title}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {topic.description}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* 游戏攻略与录屏/校验指南 */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-[#E6ECF5] dark:border-slate-800 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1769D2]" />
              游戏录屏、配置与校验指南
            </h3>
            <Link to="/tutorials" className="text-[11px] text-[#1769D2] hover:underline">
              教程中心
            </Link>
          </div>

          {guides.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              暂无已发布攻略指南（草稿作品相关文章已自动隐藏）
            </p>
          ) : (
            <div className="space-y-2.5">
              {guides.map((g) => (
                <Link
                  key={g.id}
                  to={`/tutorials/${g.slug}`}
                  className="group block p-3 rounded-xl bg-[#F5F8FC] dark:bg-slate-800/70 hover:bg-blue-50/70 dark:hover:bg-slate-800 border border-[#E6ECF5] dark:border-slate-700/80 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                      {g.guideScopeLabel}
                    </span>
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {g.publishedAt || '近期'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#1769D2] leading-snug">
                    {g.title}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {g.summary}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 最近版本更新与收录记录 */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-[#E6ECF5] dark:border-slate-800 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#1769D2]" />
              最近版本与收录状态
            </h3>
            <Link to="/updates" className="text-[11px] text-[#1769D2] hover:underline">
              全站更新
            </Link>
          </div>

          <div className="space-y-2.5">
            {latestUpdates.versionUpdates.map((item) => {
              const ver = getSimpleVersion(item.latestVersion || undefined);
              return (
                <Link
                  key={item.id}
                  to={`/game/${item.slug}`}
                  className="group flex items-center justify-between gap-3 p-3 rounded-xl bg-[#F5F8FC] dark:bg-slate-800/70 hover:bg-blue-50/70 dark:hover:bg-slate-800 border border-[#E6ECF5] dark:border-slate-700/80 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#1769D2] truncate">
                        {getSimpleSoftwareName(item.name)}
                      </span>
                      {ver && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-[#1769D2] border border-blue-200 dark:border-blue-800 shrink-0">
                          {ver}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        入库：{(item.publishedAt || item.catalogedAt).slice(0, 10)}
                      </span>
                      <span>· 更新：{item.updatedAt.slice(0, 10)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1769D2] shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
