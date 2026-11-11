import React from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Wrench,
  Briefcase,
  Code2,
  Gamepad2,
  ArrowRight,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { SoftwareItem } from '../../types/resource';
import { SoftwareIcon } from '../common/SoftwareIcon';
import { getSimpleSoftwareName, getSimpleVersion } from '../../utils/softwareName';

interface MultiCategoryLeaderboardProps {
  softwareList: SoftwareItem[];
  className?: string;
}

export const MultiCategoryLeaderboard: React.FC<MultiCategoryLeaderboardProps> = ({
  softwareList,
  className = '',
}) => {
  if (!softwareList || softwareList.length === 0) {
    return null;
  }

  // 根据分类与关键词拆分出 4 大品类的数据
  const systemTools = softwareList.filter(
    (s) =>
      s.categorySlug === 'sys-tools' ||
      s.categorySlug === 'hardware' ||
      s.slug.includes('win') ||
      s.slug.includes('disk') ||
      s.slug.includes('zip') ||
      s.slug.includes('cpu')
  );

  const officeTools = softwareList.filter(
    (s) =>
      s.categorySlug === 'office' ||
      s.slug.includes('office') ||
      s.slug.includes('wps') ||
      s.slug.includes('word') ||
      s.slug.includes('pdf') ||
      s.slug.includes('font') ||
      s.slug.includes('wechat')
  );

  const devNetworkTools = softwareList.filter(
    (s) =>
      s.categorySlug === 'dev' ||
      s.categorySlug === 'network' ||
      s.slug.includes('code') ||
      s.slug.includes('git') ||
      s.slug.includes('net') ||
      s.slug.includes('chrome') ||
      s.slug.includes('ab-')
  );

  const mediaGames = softwareList.filter(
    (s) =>
      s.categorySlug === 'media' ||
      s.categorySlug === 'game' ||
      s.slug.includes('player') ||
      s.slug.includes('music') ||
      s.slug.includes('video') ||
      s.slug.includes('game')
  );

  // 兜底补齐：若某个分类不足 5 款，从全局高热度软件中填充不重复项
  const fillCategory = (list: SoftwareItem[]) => {
    const set = new Set(list.map((item) => item.id));
    const result = [...list];
    for (const item of softwareList) {
      if (result.length >= 5) break;
      if (!set.has(item.id)) {
        set.add(item.id);
        result.push(item);
      }
    }
    return result.slice(0, 5);
  };

  const columns = [
    {
      id: 'system',
      title: '系统与装机维护',
      subtitle: 'PE / 原版镜像 / 驱动硬件',
      icon: Wrench,
      badgeColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60',
      items: fillCategory(systemTools),
    },
    {
      id: 'office',
      title: '办公与生产力',
      subtitle: '文档协作 / 字体 / 会议沟通',
      icon: Briefcase,
      badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
      items: fillCategory(officeTools),
    },
    {
      id: 'dev',
      title: '编程与网络利器',
      subtitle: '代码编辑 / 远程 / 极速下载',
      icon: Code2,
      badgeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
      items: fillCategory(devNetworkTools),
    },
    {
      id: 'media',
      title: '影音与多媒体',
      subtitle: '高清播放 / 格式转换 / 娱乐',
      icon: Gamepad2,
      badgeColor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60',
      items: fillCategory(mediaGames),
    },
  ];

  return (
    <section id="hits" className={`max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mb-10 scroll-mt-20 ${className}`}>
      {/* 专区标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 mb-5 border-b border-[#E5E9F0] dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-rose-50 dark:bg-rose-950/60 text-[#D92D20] flex items-center justify-center">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#202938] dark:text-slate-100">
              全站热门资源多品类四栏排行榜
            </h2>
            <span className="text-xs text-[#667085] dark:text-slate-400 hidden md:inline">
              | 汇聚各大核心分类真实热度 TOP 5 工具，一屏尽览全网精选
            </span>
          </div>
          <p className="text-xs text-[#667085] dark:text-slate-400">
            拒绝商业刷榜，按全网真实获取频次与官方正版核验状态动态加权排序。
          </p>
        </div>

        <Link
          to="/software"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1769D2] dark:text-blue-400 hover:text-[#1258B5] transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>查看完整软件中心</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 四列平行排行榜网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const Icon = col.icon;
          const topOne = col.items[0];
          const remainingItems = col.items.slice(1, 5);

          return (
            <div
              key={col.id}
              className="bg-white dark:bg-[#141F33] rounded-xl border border-[#E5E9F0] dark:border-slate-800 p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div>
                {/* 栏目标题 */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#EDF0F4] dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${col.badgeColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#202938] dark:text-slate-100 leading-tight">
                        {col.title}
                      </h3>
                      <div className="text-[10px] text-slate-400 leading-none mt-0.5">
                        {col.subtitle}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    TOP 5
                  </span>
                </div>

                {/* No. 1 突出大卡片展示 (大图标 · 少介绍 · 突出榜首) */}
                {topOne && (
                  <div className="mb-3.5 p-3 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200/80 dark:border-slate-700/60 relative group">
                    <div className="flex items-center gap-3">
                      {/* 榜首特大红标数字 */}
                      <span className="text-2xl font-black font-mono text-[#D92D20] leading-none shrink-0">
                        1
                      </span>
                      <SoftwareIcon
                        iconUrl={topOne.iconUrl}
                        name={topOne.name}
                        slug={topOne.slug}
                        categorySlug={topOne.categorySlug}
                        size="lg"
                        className="shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                      />

                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/software/${topOne.slug}`}
                          title={topOne.name}
                          className="text-xs sm:text-sm font-bold text-[#202938] dark:text-slate-100 group-hover:text-[#1769D2] transition-colors truncate block"
                        >
                          {getSimpleSoftwareName(topOne.name, topOne.englishName)}
                        </Link>
                        <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 mt-1 font-mono">
                          <span
                            className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 max-w-[100px] truncate"
                            title={topOne.latestVersion?.version}
                          >
                            {getSimpleVersion(topOne.latestVersion?.version) || '最新版'}
                          </span>
                          <Link
                            to={`/software/${topOne.slug}`}
                            className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-semibold hover:underline shrink-0"
                          >
                            <span>直达获取</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* No. 2 - 5 紧凑扁平文字行 (放大图标 · 极速扫读) */}
                <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {remainingItems.map((item, idx) => {
                    const rank = idx + 2;
                    return (
                      <div
                        key={item.id}
                        className="pt-2 pb-1.5 first:pt-0 flex items-center justify-between gap-2.5 group hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg px-1.5 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* 排名徽章 */}
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono shrink-0 select-none ${
                              rank === 2
                                ? 'bg-amber-500 text-white'
                                : rank === 3
                                ? 'bg-amber-600/80 text-white'
                                : 'text-slate-400 bg-slate-100 dark:bg-slate-800'
                            }`}
                          >
                            {rank}
                          </span>

                          <SoftwareIcon
                            iconUrl={item.iconUrl}
                            name={item.name}
                            slug={item.slug}
                            categorySlug={item.categorySlug}
                            size="md"
                            className="shrink-0 shadow-2xs"
                          />

                          <div className="min-w-0">
                            <Link
                              to={`/software/${item.slug}`}
                              title={item.name}
                              className="text-xs font-semibold text-[#202938] dark:text-slate-200 group-hover:text-[#1769D2] transition-colors truncate block"
                            >
                              {getSimpleSoftwareName(item.name, item.englishName)}
                            </Link>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                            {item.downloadCount}次
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 栏目底部分类直达 */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">官方核验直链</span>
                <Link
                  to={`/?category=${topOne?.categorySlug || 'all'}`}
                  className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-medium flex items-center gap-0.5"
                >
                  <span>浏览更多</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
