import React, { useState } from 'react';
import { Wrench, Shield, Check, Cpu, HardDrive, Wifi, Settings, ExternalLink } from 'lucide-react';
import { SoftwareItem } from '../../types/resource';

interface ToolCategoriesProps {
  toolList: SoftwareItem[];
  onSelectSoftware: (software: SoftwareItem) => void;
}

export const ToolCategories: React.FC<ToolCategoriesProps> = ({
  toolList,
  onSelectSoftware,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'sys-tools' | 'hardware' | 'network'>('all');

  const tabs = [
    { id: 'all', label: '全部运维工具', icon: Wrench },
    { id: 'sys-tools', label: 'Windows系统维护与分区', icon: Settings },
    { id: 'hardware', label: 'CPU与硬件体质检测', icon: Cpu },
    { id: 'network', label: '网卡与网络协议诊断', icon: Wifi },
  ] as const;

  const filteredTools =
    activeTab === 'all'
      ? toolList
      : toolList.filter((item) => item.categorySlug === activeTab);

  return (
    <section id="tools" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-2 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 rounded border border-blue-200/60 dark:border-blue-900/40">
            <span>IT 运维与装机维修精选专区</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            系统与维修工具
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            为技术员、运维工程师量身整理的高效装机验机、网络排障与分区急救利器
          </p>
        </div>

        {/* 横向分类切换标签 (遵守 interactive filter controls 规范) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto max-w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 资源卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            onClick={() => onSelectSoftware(tool)}
            className="flex flex-col justify-between p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-sm shrink-0">
                    {tool.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {tool.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {tool.categoryName}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                  v{tool.latestVersion.version}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                {tool.summary}
              </p>

              {/* 关键标签 */}
              <div className="flex flex-wrap items-center gap-1.5 mb-4">
                {tool.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>官方原厂源</span>
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSoftware(tool);
                }}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                查看工具参数 →
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
