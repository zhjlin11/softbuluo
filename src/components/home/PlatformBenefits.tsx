import React from 'react';
import { ShieldCheck, FileCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const PlatformBenefits: React.FC = () => {
  return (
    <section className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-5 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#16834A] dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#202938] dark:text-slate-200 block text-xs mb-1">
                软游部落 · 来源核验与安全透明承诺
              </span>
              <p className="leading-relaxed">
                本站优先收录软件著作权人官方主站发布的原始安装程序。非商业软件著作权方，不对第三方软件代码提供绝对免责担保；通过提供原厂 SHA-256 指纹比对、版本更新记录与官方链接健康检测，协助技术人员规避流氓下载器与钓鱼中间件。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-[11px] font-mono text-slate-500 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-3 md:pt-0 md:pl-5">
            <div>
              <span className="font-semibold block text-slate-700 dark:text-slate-300">来源透明</span>
              <span>100% 官方可查</span>
            </div>
            <div>
              <span className="font-semibold block text-slate-700 dark:text-slate-300">拒绝捆绑</span>
              <span>严禁流氓壳程序</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
