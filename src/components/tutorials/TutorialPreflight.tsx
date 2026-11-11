import React, { useState } from 'react';
import { ClipboardCheck, Check, AlertCircle } from 'lucide-react';

interface TutorialPreflightProps {
  checklist: string[];
}

export const TutorialPreflight: React.FC<TutorialPreflightProps> = ({ checklist }) => {
  const [checkedState, setCheckedState] = useState<Record<number, boolean>>({});

  if (!checklist || checklist.length === 0) return null;

  const toggleCheck = (idx: number) => {
    setCheckedState((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const checkedCount = Object.values(checkedState).filter(Boolean).length;
  const isAllChecked = checkedCount === checklist.length;

  return (
    <div className="my-6 p-4 sm:p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40">
      <div className="flex items-center justify-between pb-3 border-b border-blue-200/60 dark:border-blue-900/40 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#1769D2] text-white flex items-center justify-center">
            <ClipboardCheck className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            开始之前，请先检查（操作准备清单）
          </h3>
        </div>
        <span className="text-[11px] text-blue-700 dark:text-blue-300 font-mono font-medium">
          进度：{checkedCount} / {checklist.length}
        </span>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
        实操技术指南通常依赖特定软硬件环境。建议您在动手操作前逐一核对以下前置条件：
      </p>

      <div className="space-y-2">
        {checklist.map((item, idx) => {
          const isChecked = !!checkedState[idx];
          return (
            <label
              key={idx}
              onClick={() => toggleCheck(idx)}
              className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer select-none transition-all duration-150 ${
                isChecked
                  ? 'bg-blue-100/70 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-slate-900 dark:text-white'
                  : 'bg-white dark:bg-[#131C2E] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-200'
              }`}
            >
              <div
                className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                  isChecked
                    ? 'bg-[#1769D2] text-white'
                    : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                }`}
              >
                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className={`text-xs leading-snug ${isChecked ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                {item}
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-3 pt-2 text-[10px] text-slate-400 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 text-slate-400 shrink-0" />
        <span>提示：勾选仅供读者自检核对，不代表本站已对您的本地设备完成自动检测。</span>
      </div>
    </div>
  );
};
