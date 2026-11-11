import React from 'react';
import { AlertOctagon, ShieldAlert, AlertTriangle } from 'lucide-react';

interface TutorialRiskBannerProps {
  isHighRisk?: boolean;
  category?: string;
}

export const TutorialRiskBanner: React.FC<TutorialRiskBannerProps> = ({ isHighRisk, category }) => {
  if (!isHighRisk) return null;

  return (
    <div className="my-5 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
            <span>高风险系统操作安全警示</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-semibold">
              不可逆操作提示
            </span>
          </h4>
          <p className="mt-1 text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
            本教程实操涉及<strong>底层磁盘格式化、系统引导修改、深度注册表清理或系统服务禁用</strong>。操作前请遵循以下安全准则：
          </p>
          <ul className="mt-2 text-xs space-y-1 list-disc pl-4 text-amber-900/80 dark:text-amber-300/80">
            <li><strong>完整数据备份</strong>：务必将涉及磁盘的重要个人文件、文档与许可证备份至外置存储设备。</li>
            <li><strong>核实驱动器盘符</strong>：选择磁盘或格式化目标时，请务必核对驱动器号与容量大小，切勿误选系统主盘。</li>
            <li><strong>创建系统还原点</strong>：修改注册表或服务项前，建议在 Windows 控制面板中建立最新的“系统还原点”以便回退。</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
