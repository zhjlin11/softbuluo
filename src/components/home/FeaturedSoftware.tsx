import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Sparkles, ExternalLink } from 'lucide-react';
import { SoftwareItem } from '../../types/resource';
import { SoftwareIcon } from '../common/SoftwareIcon';
import { getSimpleSoftwareName, getSimpleVersion } from '../../utils/softwareName';
import { getResourceScreenshots } from '../../config/screenshots';

interface FeaturedSoftwareProps {
  softwareList: SoftwareItem[];
  onSelectSoftware: (software: SoftwareItem) => void;
  onViewAllClick?: () => void;
  className?: string;
}

export const FeaturedSoftware: React.FC<FeaturedSoftwareProps> = ({
  softwareList,
  onSelectSoftware,
  onViewAllClick,
  className = '',
}) => {
  if (!softwareList || softwareList.length === 0) {
    return null;
  }

  // 1. 今日主推第一行：选取 2 款具有原厂高清实机画面的旗舰软件，设计为并排双图片广告 Banner
  const win11Software = softwareList.find(
    (s) => s.slug.includes('win11') || s.slug.includes('windows-11')
  );
  const officeSoftware = softwareList.find(
    (s) => s.slug.includes('office') || s.slug.includes('365')
  );

  const ad1Software = win11Software || softwareList[0];
  const ad2Software = officeSoftware || (softwareList[1] !== ad1Software ? softwareList[1] : softwareList[2]) || softwareList[0];

  const ad1Screens = getResourceScreenshots(ad1Software?.slug || '');
  const ad2Screens = getResourceScreenshots(ad2Software?.slug || '');

  const ad1 = {
    software: ad1Software,
    imageUrl: ad1Screens[0]?.url || '/images/software/windows-11-screen-1.png',
    tag: ad1Software?.slug.includes('win') ? '今日首选 · 原厂正版' : '今日首选 · 官方核验',
    tagColor: 'bg-blue-600 text-white',
    subtitle: ad1Software?.summary ? ad1Software.summary.slice(0, 26) : '微软官方纯净原厂镜像 · SHA-256校验',
  };

  const ad2 = {
    software: ad2Software,
    imageUrl: ad2Screens[0]?.url || (ad2Software?.slug.includes('code') ? '/images/software/vscode-screen-1.png' : '/images/software/office-screen-1.png'),
    tag: ad2Software?.slug.includes('office')
      ? '办公必备 · 编辑力推'
      : (ad2Software?.slug.includes('code')
          ? '极客开发 · 官方标杆'
          : '编辑力推 · 官方核验'),
    tagColor: ad2Software?.slug.includes('code') ? 'bg-indigo-600 text-white' : 'bg-amber-600 text-white',
    subtitle: ad2Software?.summary ? ad2Software.summary.slice(0, 26) : '专业增强版完整离线镜像 · 永久授权',
  };

  const photoAds = [ad1, ad2];
  const adIds = new Set([ad1Software?.id, ad2Software?.id]);

  // 2. 后续行：过滤掉已在顶部广告位展示的资源，选取 8 款后续精选（2列 x 4行），紧密对齐左侧分类与右侧排行榜底部
  const remainingSoftware = softwareList.filter((s) => !adIds.has(s.id));
  const listItems = remainingSoftware.slice(0, 8);

  return (
    <div
      className={`bg-white dark:bg-[#141F33] rounded-xl border border-[#E5E9F0] dark:border-slate-800 p-3.5 sm:p-4 shadow-2xs h-full flex flex-col justify-between ${className}`}
    >
      <div>
        {/* 专区标题栏 */}
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#EDF0F4] dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <Award className="w-4 h-4 text-[#1769D2] shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-[#202938] dark:text-slate-100 shrink-0">
              编辑精选推荐
            </h2>
            <span className="text-xs text-[#667085] dark:text-slate-400 hidden xl:inline truncate">
              | 官方正规渠道核验与深度实测的主推工具
            </span>
          </div>

          {onViewAllClick && (
            <button
              onClick={onViewAllClick}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1769D2] dark:text-blue-400 hover:text-[#1258B5] transition-colors cursor-pointer"
            >
              <span>更多精选</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 1. 第一行：多个实机图片广告横幅 (2 栏并排超清实机大图广告) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
          {photoAds.map((ad, idx) => {
            const s = ad.software;
            if (!s) return null;
            const simpleName = getSimpleSoftwareName(s.name, s.englishName);
            const simpleVersion = getSimpleVersion(s.latestVersion?.version);

            return (
              <Link
                key={s.id || idx}
                to={`/software/${s.slug}`}
                title={s.name}
                className="group relative h-32 sm:h-34 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-500 transition-all duration-300 shadow-2xs flex flex-col justify-between p-3"
              >
                {/* 16:9 高清实机底图 */}
                <img
                  src={ad.imageUrl}
                  alt={s.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                />

                {/* 渐变遮罩层，保障文字清晰度 */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-950/60 to-slate-950/20 group-hover:from-slate-950/95 transition-colors" />

                {/* 广告顶栏角标 */}
                <div className="relative z-10 flex items-center justify-between">
                  <span
                    className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full shadow-sm tracking-wide ${ad.tagColor}`}
                  >
                    {ad.tag}
                  </span>
                  <span className="text-[9.5px] font-mono bg-black/70 text-slate-200 px-1.5 py-0.5 rounded backdrop-blur-xs">
                    {simpleVersion || '最新版'}
                  </span>
                </div>

                {/* 广告底栏内容 */}
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <SoftwareIcon
                      name={s.name}
                      slug={s.slug}
                      size="sm"
                      className="shrink-0 shadow-md ring-1 ring-white/20"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-blue-300 transition-colors truncate leading-tight">
                        {simpleName}
                      </h3>
                      <p className="text-[10.5px] text-slate-200/90 truncate leading-snug mt-0.5">
                        {ad.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 2. 后续行：高密度紧凑软件卡片列表 (2列 x 4行 = 8款)，与左侧分类栏及右侧排行榜底部严丝合缝对齐 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {listItems.map((item) => (
            <div
              key={item.id}
              className="group p-2 sm:p-2.5 bg-slate-50/60 dark:bg-slate-900/40 rounded-xl border border-[#E5E9F0] dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs transition-all flex items-center justify-between gap-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <SoftwareIcon
                  iconUrl={item.iconUrl}
                  name={item.name}
                  slug={item.slug}
                  categorySlug={item.categorySlug}
                  size="md"
                  className="shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/software/${item.slug}`}
                    title={item.name}
                    className="text-xs sm:text-sm font-bold text-[#202938] dark:text-slate-100 group-hover:text-[#1769D2] transition-colors truncate block leading-snug"
                  >
                    {getSimpleSoftwareName(item.name, item.englishName)}
                  </Link>
                  <div className="text-[10px] text-[#667085] dark:text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                    <span>{getSimpleVersion(item.latestVersion?.version)}</span>
                    <span>·</span>
                    <span className="truncate">{item.categoryName}</span>
                  </div>
                </div>
              </div>

              <Link
                to={`/software/${item.slug}`}
                className="px-2.5 py-1 rounded-md text-xs font-semibold text-[#1769D2] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 hover:bg-[#1769D2] hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all shrink-0"
              >
                获取
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
