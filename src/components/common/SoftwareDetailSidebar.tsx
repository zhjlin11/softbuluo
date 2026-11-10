import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Download, ChevronRight, Layers, Sparkles } from 'lucide-react';
import { SoftwareIcon } from './SoftwareIcon';

interface SoftwareDetailSidebarProps {
  currentSlug?: string;
  className?: string;
}

export const SoftwareDetailSidebar: React.FC<SoftwareDetailSidebarProps> = ({
  currentSlug = '',
  className = '',
}) => {
  const [activeRankTab, setActiveRankTab] = useState<'hot' | 'new'>('hot');

  // 1. 每周推荐榜单数据 (对应图 2 顶部)
  const weeklyRecommendations = [
    {
      name: '迅雷 极速版',
      slug: 'xunlei',
      size: '197 MB',
      date: '2026-10-29',
      desc: '多资源超线程下载技术',
    },
    {
      name: '迅雷 11',
      slug: 'xunlei-11',
      size: '6.6 MB',
      date: '2026-11-06',
      desc: '轻量化极简界面与高速引擎',
    },
    {
      name: '百度网盘 客户端',
      slug: 'baidunetdisk',
      size: '85.2 MB',
      date: '2026-10-26',
      desc: '超大空间与跨端文件同步',
    },
    {
      name: 'Pandownload 极速版',
      slug: 'pandownload',
      size: '384 MB',
      date: '2026-05-06',
      desc: '免登录批量不限速加速工具',
    },
    {
      name: '百度文库下载器',
      slug: 'wenku',
      size: '75.04 MB',
      date: '2026-02-28',
      desc: '免券免积分批量提取文档',
    },
  ];

  // 2. 装机必备 8 宫格应用 (对应图 3 核心 4 列布局)
  const essentialGrid = [
    { name: '360卫士', slug: '360safe' },
    { name: '360软管', slug: '360soft' },
    { name: '驱动精灵', slug: 'drivergenius' },
    { name: '百度网盘', slug: 'baidunetdisk' },
    { name: '360浏览器', slug: '360browser' },
    { name: 'WPS Office', slug: 'wps' },
    { name: 'QQ电脑版', slug: 'qq' },
    { name: '雷电模拟器', slug: 'leidian' },
  ];

  // 3. 分类常用快捷索引 (对应图 4 标签栏)
  const categorizedTags = [
    {
      category: '游戏娱乐',
      bgClass: 'bg-[#1464E9]',
      items: ['雷神加速器', '腾讯助手', '迅游'],
    },
    {
      category: '影音软件',
      bgClass: 'bg-[#0EA5E9]',
      items: ['抖音电脑版', '爱奇艺', '优酷视频'],
    },
    {
      category: '系统安全',
      bgClass: 'bg-[#2563EB]',
      items: ['鲁大师', '方正字体', '2345卫士'],
    },
    {
      category: '办公软件',
      bgClass: 'bg-[#3B82F6]',
      items: ['Office', '夸克网盘', '360压缩'],
    },
  ];

  // 4. 本周最热 / 最新榜单数据 (对应图 4 选项卡)
  const hotSoftwares = [
    { rank: 1, name: '迅雷 11 极速版', slug: 'xunlei' },
    { rank: 2, name: '360软件管家 独立版', slug: '360soft' },
    {
      rank: 3,
      name: '种子搜索',
      slug: 'zhongzi',
      rating: 4.5,
      isFeatured: true,
      summary: '全网磁力极速索引引擎',
    },
    { rank: 4, name: '蘑菇下载器', slug: 'mogu-download' },
    { rank: 5, name: 'Free Download Manager (FDM)', slug: 'fdm' },
  ];

  const newSoftwares = [
    { rank: 1, name: 'Windows 11 24H2 官方镜像', slug: 'windows-11' },
    { rank: 2, name: 'Visual Studio Code 1.99', slug: 'vscode' },
    {
      rank: 3,
      name: 'AB Download Manager',
      slug: 'ab-download-manager',
      rating: 5.0,
      isFeatured: true,
      summary: '开源跨平台多线程下载神器',
    },
    { rank: 4, name: 'Geek Uninstaller 纯净卸载', slug: 'geek' },
    { rank: 5, name: 'PotPlayer 高清影音播放器', slug: 'potplayer' },
  ];

  const currentRankList = activeRankTab === 'hot' ? hotSoftwares : newSoftwares;

  return (
    <aside className={`w-full space-y-4 select-none ${className}`}>
      {/* 模块 1：每周推荐 (图 2) */}
      <div className="bg-white dark:bg-[#141F33] rounded-lg border border-[#E5E9F0] dark:border-slate-800 p-4 shadow-2xs">
        <div className="flex items-center gap-1.5 pb-3 border-b border-[#EDF0F4] dark:border-slate-800">
          <span className="text-base leading-none">💖</span>
          <h3 className="text-[13.5px] font-bold text-[#172B4D] dark:text-slate-100">
            每周推荐
          </h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {weeklyRecommendations.map((item, idx) => (
            <Link
              key={idx}
              to={`/software/${item.slug}`}
              className="flex items-center gap-3 py-2.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded-md px-1 transition-colors group"
            >
              <SoftwareIcon
                name={item.name}
                slug={item.slug}
                size="sm"
                className="shrink-0 rounded-lg group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold text-[#202938] dark:text-slate-200 group-hover:text-[#1464E9] dark:group-hover:text-blue-400 truncate transition-colors">
                  {item.name}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5 tabular-nums">
                  {item.size} <span className="mx-1 text-slate-300 dark:text-slate-700">|</span> {item.date}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-[#EDF0F4] dark:border-slate-800">
          下载服务协议见页面底部
        </div>
      </div>

      {/* 模块 2：双图片广告推广横幅 (图 2, 图 3) */}
      <div className="space-y-2.5">
        {/* 广告位 1: 豆包 AI 智能助手体验 */}
        <a
          href="https://www.doubao.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block relative rounded-lg overflow-hidden border border-[#D8E3F0] dark:border-slate-700 group shadow-2xs hover:shadow-xs transition-shadow cursor-pointer"
        >
          <div className="relative h-[95px] bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#2563EB] p-3 text-white flex flex-col justify-between">
            {/* 顶栏徽标 */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-medium text-white">
                <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                <span>工作效率搭子 · 豆包全新升级</span>
              </div>
            </div>

            {/* 核心文案与按钮 */}
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="text-[14px] font-extrabold tracking-tight text-white drop-shadow-sm">
                  新用户领 <span className="text-amber-300 text-[15px]">30天免费</span> 体验套餐
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5">
                  全场景生产力与AI写作助手
                </div>
              </div>

              <div className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-[11px] rounded-full shadow-sm shrink-0 flex items-center gap-0.5 group-hover:scale-105 transition-transform">
                <span>点击领取</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* 广告角标 */}
            <span className="absolute bottom-1 left-2 text-[9px] text-white/50 select-none font-mono">
              广告
            </span>
          </div>
        </a>

        {/* 广告位 2: 影之刃零 / 游戏大作预约 */}
        <a
          href="https://softtribe.top/#games"
          className="block relative rounded-lg overflow-hidden border border-[#D8E3F0] dark:border-slate-700 group shadow-2xs hover:shadow-xs transition-shadow cursor-pointer"
        >
          <div className="relative h-[95px] bg-gradient-to-r from-[#18181B] via-[#27272A] to-[#7F1D1D] p-3 text-white flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono tracking-wider text-rose-300/90 font-bold">
                PHANTOM BLADE 零 · 震撼发布
              </span>
            </div>

            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="text-[15px] font-extrabold text-amber-400 tracking-wider">
                  预售开启 · 立即预约
                </div>
                <div className="text-[10px] text-rose-200 mt-0.5">
                  参与预约活动保底 必得原厂定制礼包
                </div>
              </div>

              <div className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-full shadow-sm shrink-0 flex items-center gap-0.5 group-hover:scale-105 transition-transform">
                <span>立即预约</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            <span className="absolute bottom-1 left-2 text-[9px] text-white/50 select-none font-mono">
              广告
            </span>
          </div>
        </a>
      </div>

      {/* 模块 3：装机必备 (图 3, 图 4 经典 4 列 Dock 与分类检索) */}
      <div className="bg-white dark:bg-[#141F33] rounded-lg border border-[#E5E9F0] dark:border-slate-800 p-4 shadow-2xs">
        {/* 标题带底部蓝色下划线 */}
        <div className="border-b border-[#EDF0F4] dark:border-slate-800 pb-2 mb-3.5">
          <div className="inline-flex items-center gap-1.5 border-b-2 border-[#1464E9] pb-2 -mb-[9.5px]">
            <Layers className="w-4 h-4 text-[#1464E9]" />
            <h3 className="text-[13.5px] font-bold text-[#172B4D] dark:text-slate-100">
              装机必备
            </h3>
          </div>
        </div>

        {/* 4 列 x 2 行 高密度图标网格 */}
        <div className="grid grid-cols-4 gap-2 text-center pb-4 border-b border-[#EDF0F4] dark:border-slate-800">
          {essentialGrid.map((item, idx) => (
            <Link
              key={idx}
              to={`/software/${item.slug}`}
              className="flex flex-col items-center p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
            >
              <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
                <SoftwareIcon
                  name={item.name}
                  slug={item.slug}
                  size="sm"
                  className="rounded-lg shadow-2xs"
                />
              </div>
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-[#1464E9] dark:group-hover:text-blue-400 truncate w-full mt-1.5">
                {item.name}
              </span>
            </Link>
          ))}
        </div>

        {/* 分类快捷标签栏 (对应图 4 中部彩色标签带) */}
        <div className="pt-3 space-y-2 text-xs">
          {categorizedTags.map((cat, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[11px]">
              <span
                className={`${cat.bgClass} text-white font-medium px-1.5 py-0.5 rounded text-[10px] shrink-0`}
              >
                {cat.category}
              </span>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
                {cat.items.map((sub, sIdx) => (
                  <Link
                    key={sIdx}
                    to={`/?search=${encodeURIComponent(sub)}`}
                    className="hover:text-[#1464E9] dark:hover:text-blue-400 transition-colors"
                  >
                    {sub}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 模块 4：本周最热 / 本周最新 选项卡榜单 (图 4 底部) */}
      <div className="bg-white dark:bg-[#141F33] rounded-lg border border-[#E5E9F0] dark:border-slate-800 p-4 shadow-2xs">
        {/* Tab 切换头 */}
        <div className="flex items-center border-b border-[#EDF0F4] dark:border-slate-800 mb-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveRankTab('hot')}
            className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
              activeRankTab === 'hot'
                ? 'border-[#1464E9] text-[#1464E9] font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            本周最热软件
          </button>
          <button
            type="button"
            onClick={() => setActiveRankTab('new')}
            className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
              activeRankTab === 'new'
                ? 'border-[#1464E9] text-[#1464E9] font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            本周最新软件
          </button>
        </div>

        {/* 榜单 1 ~ 5 条目列表 */}
        <div className="space-y-2">
          {currentRankList.map((item) => {
            // 特殊样式：Top 3 卡片 (对应图 4 中间粉红大图标+星级+查看按钮的醒目布局)
            if (item.isFeatured) {
              return (
                <div
                  key={item.rank}
                  className="flex items-center gap-2.5 p-2 bg-slate-50/80 dark:bg-slate-800/40 rounded-lg border border-slate-200/70 dark:border-slate-800 my-2"
                >
                  <span className="font-extrabold text-amber-500 font-mono text-base w-4 text-center shrink-0">
                    {item.rank}
                  </span>
                  <SoftwareIcon
                    name={item.name}
                    slug={item.slug}
                    size="md"
                    className="shrink-0 rounded-lg shadow-2xs"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#202938] dark:text-slate-100 truncate">
                      {item.name}
                    </div>
                    {/* 4.5 星好评 */}
                    <div className="flex items-center gap-0.5 text-amber-400 text-[10px] mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <Star className="w-3 h-3 fill-amber-400" />
                      <Star className="w-3 h-3 fill-amber-400" />
                      <Star className="w-3 h-3 fill-amber-400" />
                      <Star className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                    </div>
                  </div>
                  <Link
                    to={`/software/${item.slug}`}
                    className="px-2.5 py-1 text-xs font-medium text-[#1464E9] border border-[#1464E9] hover:bg-[#1464E9] hover:text-white rounded transition-colors shrink-0 cursor-pointer shadow-2xs"
                  >
                    查看
                  </Link>
                </div>
              );
            }

            // 常规 1, 2, 4, 5 条目
            return (
              <Link
                key={item.rank}
                to={`/software/${item.slug}`}
                className="flex items-center gap-2.5 py-1.5 px-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded transition-colors group"
              >
                <span
                  className={`font-mono text-xs font-extrabold w-4 text-center shrink-0 ${
                    item.rank === 1
                      ? 'text-red-500'
                      : item.rank === 2
                      ? 'text-orange-500'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {item.rank}
                </span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-[#1464E9] dark:group-hover:text-blue-400 truncate flex-1 transition-colors">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
