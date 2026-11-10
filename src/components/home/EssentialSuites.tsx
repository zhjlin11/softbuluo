import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Laptop,
  Wrench,
  Code2,
  Briefcase,
  Layers,
  ShieldCheck,
  Download,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { SoftwareItem } from '../../types/resource';
import { SoftwareIcon } from '../common/SoftwareIcon';
import { getSimpleSoftwareName, getSimpleVersion } from '../../utils/softwareName';

interface EssentialSuitesProps {
  softwareList: SoftwareItem[];
  onSelectSoftware?: (software: SoftwareItem) => void;
  className?: string;
}

type ScenarioKey = 'all' | 'new-pc' | 'geek' | 'dev' | 'office';

interface ScenarioTab {
  key: ScenarioKey;
  label: string;
  icon: React.FC<{ className?: string }>;
  description: string;
}

export const EssentialSuites: React.FC<EssentialSuitesProps> = ({
  softwareList,
  onSelectSoftware,
  className = '',
}) => {
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>('all');

  const tabs: ScenarioTab[] = [
    {
      key: 'all',
      label: '全部必备',
      icon: Layers,
      description: '站长与极客团队严选全能软件库，开箱即用',
    },
    {
      key: 'new-pc',
      label: '新机开箱',
      icon: Laptop,
      description: '新电脑第一天必装：浏览器、解压缩、快速搜索与纯净卸载',
    },
    {
      key: 'geek',
      label: '系统维护',
      icon: Wrench,
      description: '重装系统、启动盘制作、磁盘急救与硬件传感器监控神器',
    },
    {
      key: 'dev',
      label: '开发极客',
      icon: Code2,
      description: '全栈编程基石：代码编辑器、版本控制、抓包分析与传输工具',
    },
    {
      key: 'office',
      label: '办公创作',
      icon: Briefcase,
      description: '文字排版、表格处理、流媒体录制与创意设计利器',
    },
  ];

  // 按场景筛选软件
  const filteredList = useMemo(() => {
    if (!softwareList || softwareList.length === 0) return [];

    switch (activeScenario) {
      case 'new-pc':
        return softwareList.filter(
          (s) =>
            s.slug === 'chrome' ||
            s.slug === '7zip' ||
            s.slug === 'peazip' ||
            s.slug === 'everything' ||
            s.slug === 'vlc' ||
            s.slug === 'geek-uninstaller' ||
            s.slug === 'ab-download-manager' ||
            s.categorySlug === 'network'
        );
      case 'geek':
        return softwareList.filter(
          (s) =>
            s.slug === 'rufus' ||
            s.slug === 'diskgenius' ||
            s.slug === 'cpu-z' ||
            s.slug === 'hwinfo' ||
            s.slug.startsWith('windows-') ||
            s.categorySlug === 'hardware' ||
            s.categorySlug === 'sys-tools'
        );
      case 'dev':
        return softwareList.filter(
          (s) =>
            s.slug === 'vscode' ||
            s.slug === 'git' ||
            s.slug === 'wireshark' ||
            s.slug === 'filezilla' ||
            s.slug === 'sublime-text' ||
            s.categorySlug === 'dev' ||
            s.slug === 'ab-download-manager'
        );
      case 'office':
        return softwareList.filter(
          (s) =>
            s.slug.startsWith('office-') ||
            s.slug === 'microsoft-365' ||
            s.slug === 'libreoffice' ||
            s.slug === 'obs-studio' ||
            s.slug === 'blender' ||
            s.categorySlug === 'office' ||
            s.categorySlug === 'graphic' ||
            s.categorySlug === 'media'
        );
      default:
        return softwareList;
    }
  }, [softwareList, activeScenario]);

  if (!softwareList || softwareList.length === 0) {
    return null;
  }

  const currentTab = tabs.find((t) => t.key === activeScenario) || tabs[0];

  return (
    <section
      id="essential"
      className={`max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mb-10 scroll-mt-20 ${className}`}
    >
      <div className="bg-white dark:bg-[#141F33] rounded-xl border border-[#E5E9F0] dark:border-slate-800 p-5 sm:p-6 shadow-2xs transition-colors">
        {/* 顶部标题与场景切换 Tab */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#EDF0F4] dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>装机必备 · 纯净正版</span>
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                拒绝高速下载器 · 拒绝捆绑流氓软件
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#202938] dark:text-slate-100 flex items-center gap-2">
              电脑装机必备与环境套件
            </h2>
            <p className="text-xs text-[#667085] dark:text-slate-400 mt-0.5">
              {currentTab.description}
            </p>
          </div>

          {/* 场景分类 Pill 切换按钮组 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeScenario === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveScenario(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1769D2] text-white shadow-2xs'
                      : 'bg-[#F4F6F9] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 紧凑高密度 App 网格 (10列紧密排布 · 纯净软件名 · 紧凑间距) */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-10 gap-1.5 sm:gap-2 pt-3">
          {filteredList.slice(0, 30).map((item) => {
            const simpleName = getSimpleSoftwareName(item.name, item.englishName);
            return (
              <Link
                key={item.id}
                to={`/software/${item.slug}`}
                title={item.name}
                className="group relative flex flex-col items-center justify-between p-1.5 sm:p-2 rounded-lg border border-[#E5E9F0] dark:border-slate-800/90 bg-white dark:bg-[#10192A] hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs hover:-translate-y-0.5 transition-all text-center"
              >
                {/* 居中图标与正版微角标 */}
                <div className="relative mb-1 flex items-center justify-center">
                  <SoftwareIcon
                    iconUrl={item.iconUrl}
                    name={item.name}
                    slug={item.slug}
                    categorySlug={item.categorySlug}
                    size="lg"
                    className="shadow-2xs group-hover:scale-106 transition-transform duration-200"
                  />
                  <span className="absolute -top-1 -right-1 text-[8px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/90 px-1 py-0.2 rounded-full border border-emerald-200/80 dark:border-emerald-800/80">
                    正版
                  </span>
                </div>

                {/* 纯净精简软件名 (拒绝冗余副标题) */}
                <span className="w-full text-xs font-bold text-[#202938] dark:text-slate-100 group-hover:text-[#1769D2] dark:group-hover:text-blue-400 transition-colors truncate block">
                  {simpleName}
                </span>

                {/* 紧凑轻量版本号 */}
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 tabular-nums truncate max-w-full">
                  {getSimpleVersion(item.latestVersion?.version) || '最新版'}
                </span>
              </Link>
            );
          })}
        </div>

        {/* 底部保障提示与深度对比导航 */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              已核验 {filteredList.length} 款场景软件 · 原厂数字签名 · SHA-256 哈希校验防篡改
            </span>
          </div>
          <Link
            to="/compare"
            className="inline-flex items-center gap-1 font-semibold text-[#1769D2] dark:text-blue-400 hover:underline"
          >
            <span>同类软件深度对比与选型指南</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
