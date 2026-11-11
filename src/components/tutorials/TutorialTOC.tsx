import React, { useState, useEffect } from 'react';
import { List, ChevronDown, ChevronUp, AlignLeft } from 'lucide-react';
import { TutorialHeading } from '../../services/tutorialService';

interface TutorialTOCProps {
  headings: TutorialHeading[];
  variant?: 'desktop' | 'mobile' | 'both';
}

export const TutorialTOC: React.FC<TutorialTOCProps> = ({ headings, variant = 'both' }) => {
  const [activeId, setActiveId] = useState<string>('');
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120; // 偏移顶部导航高度
      let currentId = headings[0].id;

      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el && el.offsetTop <= scrollPosition) {
          currentId = h.id;
        }
      }
      setActiveId(currentId);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  if (!headings || headings.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const topOffset = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
      setActiveId(id);
      setIsMobileExpanded(false);
    }
  };

  return (
    <>
      {/* 桌面端吸顶卡片 */}
      {variant !== 'mobile' && (
        <div className="hidden lg:block bg-white dark:bg-[#131C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3.5 flex items-center gap-1.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <List className="w-3.5 h-3.5 text-[#1769D2]" />
            <span>目录导航 ({headings.length} 节)</span>
          </h4>

          <nav className="space-y-1 text-xs">
            {headings.map((h) => {
              const isActive = activeId === h.id;
              const isLevel3 = h.level === 3;
              return (
                <button
                  key={h.id}
                  onClick={() => scrollToHeading(h.id)}
                  className={`w-full text-left py-1.5 px-2 rounded-lg transition-all flex items-start gap-1.5 leading-snug ${
                    isLevel3 ? 'pl-5 text-[11px]' : 'text-xs'
                  } ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      isActive ? 'bg-[#1769D2]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  />
                  <span className="line-clamp-2">{h.text}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* 移动端可折叠浮层 / 按钮 */}
      {variant !== 'desktop' && (
        <div className="lg:hidden my-4 bg-white dark:bg-[#131C2E] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <button
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <div className="flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-[#1769D2]" />
              <span>教程章节目录 ({headings.length} 节)</span>
            </div>
            {isMobileExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {isMobileExpanded && (
            <div className="p-3 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-1">
              {headings.map((h) => {
                const isActive = activeId === h.id;
                const isLevel3 = h.level === 3;
                return (
                  <button
                    key={h.id}
                    onClick={() => scrollToHeading(h.id)}
                    className={`w-full text-left py-1 px-2 rounded text-xs leading-snug flex items-center gap-1.5 ${
                      isLevel3 ? 'pl-4 text-[11px]' : ''
                    } ${
                      isActive
                        ? 'text-[#1769D2] font-bold bg-blue-50 dark:bg-blue-950/50'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-1 h-1 rounded-full shrink-0 ${
                        isActive ? 'bg-[#1769D2]' : 'bg-slate-400'
                      }`}
                    />
                    <span className="truncate">{h.text}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
};
