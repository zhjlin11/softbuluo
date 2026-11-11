import React from 'react';
import { ShieldCheck, History, Clock, FileCheck, CheckCircle2, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { UpdatesChannelData } from '../../services/updatesService';

interface UpdatesSidebarProps {
  stats: UpdatesChannelData['stats'];
  meta: UpdatesChannelData['meta'];
}

export const UpdatesSidebar: React.FC<UpdatesSidebarProps> = ({ stats, meta }) => {
  return (
    <div className="space-y-5">
      {/* 实时版本监测统计卡 */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <History className="w-4 h-4 text-[#1769D2]" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            版本更新数据概览
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">最近 7 天发版</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {stats.updates7d} 个版本
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">最近 30 天发版</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {stats.updates30d} 个版本
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">全库已收录正版软件</span>
            <span className="font-mono font-bold text-[#1769D2]">
              {stats.totalPublished} 款
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">已核验版本演进记录</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {stats.totalVersions} 条
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">已登记官方下载来源</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {stats.verifiedSourcesCount} 条
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 leading-normal flex items-start gap-1.5">
          <Clock className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
          <span>口径说明：以软件官方发布日期（releaseDate）为准，排除任何数据库编辑时间的虚假统计。</span>
        </div>
      </div>

      {/* 软游部落品质承诺 */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-900/40">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-[#1769D2]" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            五大更新安全准则
          </h3>
        </div>

        <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span><strong>时间真实</strong>：严格区分收录入库与官方新版本发布。</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span><strong>原厂日志</strong>：仅采纳官方 Changelog，绝无 AI 伪造漏洞说明。</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span><strong>绝无捆绑</strong>：仅提供官方原厂安装包，拒绝流氓高速下载器。</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span><strong>哈希核验</strong>：支持官方 SHA-256 完整性比对与数字签名审查。</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span><strong>SSRF 防护</strong>：下载链路通过 P8.8 工业级安全校验与隔离。</span>
          </li>
        </ul>
      </div>

      {/* 版本更新提醒说明 */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 text-xs text-slate-500 leading-relaxed">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#1769D2]" />
          <span>版本演进与监测机制</span>
        </div>
        <p>
          软游部落采用「官方渠道自动化探查 + 编辑人工复核」双层工作流。探查到新版本后，必须经由编辑人工完成官方安装包签名校验与安全扫描后方可归档公开。
        </p>
      </div>
    </div>
  );
};
