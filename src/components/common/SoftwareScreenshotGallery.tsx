import React, { useState, useEffect } from 'react';
import {
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { ScreenshotItem } from '../../config/screenshots';

interface SoftwareScreenshotGalleryProps {
  screenshots: ScreenshotItem[];
  softwareName: string;
  className?: string;
}

export const SoftwareScreenshotGallery: React.FC<SoftwareScreenshotGalleryProps> = ({
  screenshots,
  softwareName,
  className = '',
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  // 快捷键支持：ESC 退出，左右方向键翻页
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : screenshots.length - 1));
      } else if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => (prev < screenshots.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, screenshots.length]);

  if (!screenshots || screenshots.length === 0) {
    return null;
  }

  const currentItem = screenshots[selectedIndex] || screenshots[0];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 专区标题 */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#202938] dark:text-slate-100 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-[#1769D2] dark:text-blue-400" />
          <span>软件实机运行截图与界面预览</span>
          <span className="text-[11px] font-normal text-slate-400">
            (共 {screenshots.length} 张高清界面)
          </span>
        </h2>
        <span className="text-xs text-slate-400 hidden sm:inline flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>官方原版界面 · 无二次加水印</span>
        </span>
      </div>

      {/* 桌面拟态窗口外框 */}
      <div className="rounded-xl border border-[#E5E9F0] dark:border-slate-800 bg-white dark:bg-[#0E1726] shadow-sm overflow-hidden transition-all">
        {/* 拟态窗口标题栏 */}
        <div className="px-4 py-2.5 bg-slate-100/90 dark:bg-slate-900/90 border-b border-[#E5E9F0] dark:border-slate-800 flex items-center justify-between select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <div className="text-[11px] font-mono text-slate-400 truncate max-w-[260px]">
            {softwareName} - 界面实拍预览
          </div>
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="text-xs text-slate-500 hover:text-[#1769D2] dark:text-slate-400 dark:hover:text-blue-400 inline-flex items-center gap-1 cursor-pointer transition-colors"
            title="点击查看全屏大图"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">全屏放大</span>
          </button>
        </div>

        {/* 主大图预览展位 */}
        <div
          onClick={() => setIsLightboxOpen(true)}
          className="group relative aspect-video sm:aspect-[16/10] max-h-[520px] bg-slate-950 flex items-center justify-center overflow-hidden cursor-zoom-in"
        >
          <img
            src={currentItem.url}
            alt={currentItem.caption || softwareName}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />

          {/* 悬停放大指示遮罩 */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium text-xs pointer-events-none">
            <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-lg">
              <Maximize2 className="w-4 h-4" />
              <span>点击查看全屏高清大图</span>
            </div>
          </div>

          {/* 底部悬浮说明条 */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 text-white text-xs flex items-center justify-between">
            <span className="truncate pr-4 font-medium drop-shadow-sm">
              {currentItem.caption}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/20 backdrop-blur-xs shrink-0">
              {selectedIndex + 1} / {screenshots.length}
            </span>
          </div>
        </div>

        {/* 缩略图横排栏 (多于 1 张截图时展现) */}
        {screenshots.length > 1 && (
          <div className="p-3 bg-slate-50/70 dark:bg-slate-900/50 border-t border-[#E5E9F0] dark:border-slate-800 flex items-center gap-3 overflow-x-auto scrollbar-none">
            {screenshots.map((sc, idx) => {
              const isActive = idx === selectedIndex;
              return (
                <button
                  key={sc.url}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`group relative shrink-0 w-24 sm:w-28 aspect-video rounded-md overflow-hidden border transition-all cursor-pointer ${
                    isActive
                      ? 'border-[#1769D2] ring-2 ring-[#1769D2]/30 scale-102'
                      : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                  }`}
                  title={sc.caption}
                >
                  <img
                    src={sc.url}
                    alt={sc.caption}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white truncate px-1 py-0.5">
                    图 {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 沉浸式全屏 Lightbox 大图画廊模态框 */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fade-in"
        >
          {/* 模态框顶部工具条 */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 select-none">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold">{softwareName}</span>
              <span className="text-xs text-white/60">
                ({selectedIndex + 1} / {screenshots.length})
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="按 ESC 或点击关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 居中大图与翻页按钮 */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            {screenshots.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((prev) => (prev > 0 ? prev - 1 : screenshots.length - 1));
                }}
                className="absolute left-2 sm:left-6 z-10 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-[#1769D2] text-white transition-all cursor-pointer border border-white/10 shadow-lg"
                title="上一张 (←)"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            <img
              src={currentItem.url}
              alt={currentItem.caption}
              className="max-h-[82vh] max-w-[94vw] object-contain rounded-lg shadow-2xl select-none"
            />

            {screenshots.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((prev) => (prev < screenshots.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-2 sm:right-6 z-10 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-[#1769D2] text-white transition-all cursor-pointer border border-white/10 shadow-lg"
                title="下一张 (→)"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>

          {/* 模态框底部说明与按键提示 */}
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-white/80 gap-2">
            <span className="font-medium text-white">{currentItem.caption}</span>
            <div className="flex items-center gap-3 text-white/50 text-[11px]">
              <span>支持键盘 ← / → 切换</span>
              <span>·</span>
              <span>ESC 键退出预览</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
