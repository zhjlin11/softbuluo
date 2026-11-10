import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Settings, Cpu, Wifi, HardDrive, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { SoftwareItem } from '../../types/resource';
import { SoftwareIcon } from '../common/SoftwareIcon';
import { getSimpleSoftwareName, getSimpleVersion } from '../../utils/softwareName';

interface ToolCategoriesProps {
  toolList: SoftwareItem[];
  onSelectSoftware: (software: SoftwareItem) => void;
}

export const ToolCategories: React.FC<ToolCategoriesProps> = ({
  toolList,
  onSelectSoftware,
}) => {
  const [activeScenario, setActiveScenario] = useState<string>('all');

  const scenarios = [
    { id: 'all', label: '全部装机与运维利器', icon: Wrench },
    { id: 'install', label: '新电脑装机必备', icon: Settings },
    { id: 'hardware', label: '硬件体质与稳定性检测', icon: Cpu },
    { id: 'network', label: '网络故障与端口诊断', icon: Wifi },
  ];

  const filteredTools = toolList.filter((item) => {
    if (activeScenario === 'all') return true;
    if (activeScenario === 'hardware') return item.categorySlug === 'hardware' || item.slug.includes('cpu');
    if (activeScenario === 'network') return item.categorySlug === 'network' || item.slug.includes('net');
    if (activeScenario === 'install') return item.categorySlug === 'sys-tools' || item.slug.includes('zip') || item.isFeatured;
    return true;
  });

  return (
    <section id="tools" className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mb-12 scroll-mt-20">
      <div className="bg-white dark:bg-[#141F33] rounded-lg border border-[#E5E9F0] dark:border-slate-800 p-5 sm:p-6">
        {/* 标题与场景过滤器 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 mb-5 border-b border-[#EDF0F4] dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="w-4 h-4 text-[#1769D2]" />
              <h2 className="text-base sm:text-lg font-bold text-[#202938] dark:text-slate-100">
                装机与维修工具箱
              </h2>
              <span className="text-xs text-[#667085] dark:text-slate-400 hidden sm:inline">
                | 面向装机维护、系统重装与硬件检测的纯净无捆绑实用工具
              </span>
            </div>
            <p className="text-xs text-slate-500">
              杜绝任何第三方商业篡改与捆绑流氓软件，提供官方 SHA-256 完整性校验与直连通道。
            </p>
          </div>

          {/* 场景切换标签 */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0">
            {scenarios.map((sc) => {
              const Icon = sc.icon;
              const isActive = activeScenario === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => setActiveScenario(sc.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#1769D2] text-white font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sc.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 工具条目高密度网格 (8列紧密排布 · 纯净软件名 · 紧凑间距) */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-1.5 sm:gap-2">
          {filteredTools.map((tool) => {
            const simpleName = getSimpleSoftwareName(tool.name, tool.englishName);
            return (
              <Link
                key={tool.id}
                to={`/tool/${tool.slug}`}
                title={tool.name}
                className="p-1.5 sm:p-2 bg-slate-50/70 dark:bg-slate-900/60 rounded-lg border border-[#E5E9F0] dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col items-center justify-between group hover:shadow-xs text-center"
              >
                <div className="flex flex-col items-center w-full">
                  <SoftwareIcon
                    iconUrl={tool.iconUrl}
                    name={tool.name}
                    slug={tool.slug}
                    categorySlug={tool.categorySlug}
                    size="md"
                    className="group-hover:scale-106 transition-transform"
                  />
                  <span className="w-full text-xs font-bold text-[#202938] dark:text-slate-100 group-hover:text-[#1769D2] transition-colors truncate mt-1 block">
                    {simpleName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 tabular-nums truncate max-w-full">
                    {getSimpleVersion(tool.latestVersion?.version) || '最新版'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
