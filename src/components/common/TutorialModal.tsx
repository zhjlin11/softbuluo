import React, { useEffect } from 'react';
import { X, Clock, User, Calendar, BookOpen, CheckCircle2 } from 'lucide-react';
import { TutorialItem } from '../../types/resource';

interface TutorialModalProps {
  tutorial: TutorialItem | null;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ tutorial, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (tutorial) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [tutorial, onClose]);

  if (!tutorial) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="关闭文章"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            {tutorial.category}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1 mb-3 leading-snug">
            {tutorial.title}
          </h2>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 dark:text-slate-500 pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>{tutorial.author}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 tabular-nums">
              <Calendar className="w-3.5 h-3.5" />
              <span>{tutorial.publishedAt}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 tabular-nums">
              <Clock className="w-3.5 h-3.5" />
              <span>预计阅读 {tutorial.readTime}</span>
            </span>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-8">
          <p className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 font-medium text-slate-800 dark:text-slate-200">
            摘要：{tutorial.summary}
          </p>

          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pt-2">
            一、核心原则与准备工作
          </h3>
          <p>
            在进行任何系统级装机或磁盘操作前，首要原则是确认关键数据已完成多端异地备份。避免使用任何内置推广流氓软件的第三方封装 Ghost 镜像，优先前往微软或原厂硬件官网下载原版安装镜像。
          </p>

          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 pt-2">
            二、工具选择与规范操作步骤
          </h3>
          <p>
            推荐搭配 7-Zip 进行安全解压缩，使用校验工具比对官方发布的 SHA-256 哈希值，确保文件在传输过程中未被篡改或受到网络运营商 DNS 劫持。
          </p>

          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">运维小贴士</span>
              遇到疑难系统报错时，建议先检查事件查看器中的系统关键日志，配合硬件温度检测工具排除散热过热引起的降频蓝屏。
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            完成阅读并返回
          </button>
        </div>
      </div>
    </div>
  );
};
