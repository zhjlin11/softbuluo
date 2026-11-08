import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Shield, ArrowRight, CornerDownLeft, Sparkles, AlertCircle } from 'lucide-react';
import { siteConfig } from '../../config/site';
import { getSearchSuggestions } from '../../services/resourceService';
import { SoftwareItem } from '../../types/resource';

interface HeroSearchProps {
  onSearchSubmit: (query: string) => void;
  onSelectSoftware: (software: SoftwareItem) => void;
  searchRef?: React.RefObject<HTMLInputElement | null>;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  onSearchSubmit,
  onSelectSoftware,
  searchRef: externalRef,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SoftwareItem[]>([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef || localRef;
  const containerRef = useRef<HTMLDivElement>(null);

  // 防抖检索建议
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setIsSuggestOpen(false);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await getSearchSuggestions(query);
        setSuggestions(results);
        setIsSuggestOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // 点击外部收起建议
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 键盘快捷导航支持 (上下键、回车、ESC)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsSuggestOpen(false);
      return;
    }

    if (isSuggestOpen && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          onSelectSoftware(suggestions[selectedIndex]);
          setIsSuggestOpen(false);
        } else {
          handleSubmit();
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (query.trim()) {
      setIsSuggestOpen(false);
      onSearchSubmit(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsSuggestOpen(false);
    inputRef.current?.focus();
  };

  const handlePopularClick = (keyword: string) => {
    setQuery(keyword);
    onSearchSubmit(keyword);
  };

  return (
    <section
      id="hero"
      className="relative pt-12 pb-16 md:pt-18 md:pb-22 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* 柔和的现代背景微光 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-[800px] mx-auto text-center">
        {/* 顶部可信信任指示标签 */}
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-xs">
          <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>人工核对官方发布源 · 严格杜绝流氓捆绑</span>
        </div>

        {/* 主标题 */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-4 text-balance">
          找软件，来这里就够了
        </h1>

        {/* 副标题 */}
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed text-balance">
          {siteConfig.description}
        </p>

        {/* 核心大搜索框容器 (680-760px) */}
        <div ref={containerRef} className="relative w-full max-w-[740px] mx-auto mb-5 text-left">
          <div className="relative flex items-center h-14 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent transition-all">
            <div className="pl-4.5 pr-2 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5 stroke-[2]" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setIsSuggestOpen(true);
              }}
              placeholder="搜索软件、游戏、驱动或系统工具……"
              aria-label="搜索软件或系统工具"
              className="w-full h-full pr-12 text-sm sm:text-base bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
            />

            {/* 清空按钮 */}
            {query && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="清空输入内容"
                className="p-1.5 mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* 提交搜索按钮 */}
            <button
              type="button"
              onClick={handleSubmit}
              className="h-10 px-5 mr-2 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-xs shrink-0"
            >
              <span>搜索</span>
              <ArrowRight className="w-4 h-4 hidden sm:inline" />
            </button>
          </div>

          {/* 实时建议浮动面板 */}
          {isSuggestOpen && (
            <div
              role="listbox"
              className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-50 animate-in fade-in-50 duration-150"
            >
              <div className="px-3.5 py-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>匹配资源建议 ({suggestions.length})</span>
                <span className="flex items-center gap-1">
                  <span>按回车直达</span>
                  <CornerDownLeft className="w-3 h-3" />
                </span>
              </div>

              {suggestions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  没有找到包含 &quot;{query}&quot; 的相关软件，可按回车查看全站搜索
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {suggestions.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onSelectSoftware(item);
                          setIsSuggestOpen(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {item.name.slice(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                                {item.name}
                              </span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                                v{item.latestVersion.version}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {item.summary}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right text-[11px] text-slate-400">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {item.categoryName}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 热门搜索标签 (严格从配置读取，无假造热度) */}
        {siteConfig.popularSearches && siteConfig.popularSearches.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-slate-400 dark:text-slate-500">热门搜索：</span>
            {siteConfig.popularSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handlePopularClick(item)}
                className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-md transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
