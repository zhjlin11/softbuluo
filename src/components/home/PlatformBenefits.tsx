import React from 'react';
import { ShieldCheck, FolderTree, RefreshCw, BookOpenCheck } from 'lucide-react';

export const PlatformBenefits: React.FC = () => {
  const benefits = [
    {
      icon: ShieldCheck,
      title: "可信官方来源",
      description: "核对官方发布源与开发者主页，提供经过安全验证的官方直达链接与版本 Hash，拒绝流氓改装包与隐形捆绑。",
    },
    {
      icon: FolderTree,
      title: "专业结构化整理",
      description: "针对系统维护、硬件分析、网络排障与日常办公分类归档，大幅减少寻找工具和鉴别真伪的时间成本。",
    },
    {
      icon: RefreshCw,
      title: "版本持续追踪",
      description: "定期核查收录资源的最新稳定发行版、Changelog 与兼容性说明，确保下载地址始终有效可用。",
    },
    {
      icon: BookOpenCheck,
      title: "实用技术教程",
      description: "提供一线的系统装机、PE 启动盘制作、故障排查与工具参数解析指南，让每款工具都能发挥最大价值。",
    },
  ];

  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mb-20">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          为什么选择软件资源中心？
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          回归纯净工具本质，坚持客观真实，让每位电脑用户放心获取所需资源
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {benefits.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 stroke-[1.8]" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
