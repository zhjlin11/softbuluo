import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Loader2, Compass } from 'lucide-react';
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
        console.error('获取搜索建议失败', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

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

  const handleKeywordClick = (keyword: string) => {
    setQuery(keyword);
    onSearchSubmit(keyword);
  };

  return (
    <section
      id="hero"
      className="bg-gradient-to-b from-[#F7FAFF] to-[#EEF5FF] dark:from-[#172338] dark:to-[#121B2B] border-b border-[#E7EDF5] dark:border-[#2D405C] py-8 sm:py-10 px-4 sm:px-6 lg:px-8 transition-colors"
    >
      <div className="max-w-[1320px] mx-auto flex flex-col items-center text-center">
        {/* 主标题与独立副标题 */}
        <h1 className="text-2xl sm:text-[26px] md:text-[28px] font-bold text-[#172B4D] dark:text-[#ECF3FF] tracking-tight">
          找软件 · 找游戏 · 找工具
        </h1>
        <p className="mt-2 text-xs sm:text-[13px] text-[#718198] dark:text-[#9AAFCB] font-normal tracking-wide">
          官方正版来源 · 拒绝流氓捆绑与暗中收费
        </p>

        {/* 核心大搜索框 (680–760px, 高度 54px) */}
        <div ref={containerRef} className="relative w-full max-w-[740px] mt-6">
          <div className="relative flex items-center h-[54px] bg-[#FFFFFF] dark:bg-[#1E2C43] rounded-[12px] border border-[#DDE7F3] dark:border-[#2D405C] shadow-[0_4px_20px_rgba(30,70,130,0.05)] dark:shadow-none focus-within:border-[#1464E9] dark:focus-within:border-[#4A91FF] focus-within:ring-4 focus-within:ring-[#1464E9]/10 dark:focus-within:ring-[#4A91FF]/15 transition-all duration-200">
            <div className="pl-4 pr-2 flex items-center pointer-events-none text-[#7A8B9E] dark:text-[#9AAFCB]">
              <Search className="w-4 h-4 stroke-[2]" />
            </div>

            <input
              ref={inputRef}
              id="main-search-input"
              name="q"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setIsSuggestOpen(true);
              }}
              placeholder="输入软件名称、英文名、游戏或系统工具（如 Chrome、7-Zip、VS Code、CPU-Z）"
              aria-label="搜索软件或系统工具"
              className="w-full h-full pr-10 text-sm sm:text-[14px] bg-transparent text-[#172B4D] dark:text-[#ECF3FF] placeholder:text-[#91A0B5] dark:placeholder:text-[#7E94B3] focus:outline-none"
            />

            {/* 清空按钮 */}
            {query && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="清空输入内容"
                className="p-1 mr-1 text-[#7A8B9E] hover:text-[#172B4D] dark:text-[#9AAFCB] dark:hover:text-[#ECF3FF] rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* 提交搜索按钮 */}
            <button
              type="button"
              onClick={handleSubmit}
              className="h-[42px] px-5 sm:px-6 mr-1.5 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-[#1464E9] hover:bg-[#0F55CD] active:bg-[#0C47AD] rounded-[9px] transition-colors shadow-[0_1px_4px_rgba(20,100,233,0.18)] shrink-0 cursor-pointer"
            >
              <span>搜索</span>
              <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
            </button>
          </div>

          {/* 实时搜索联想下拉浮层 */}
          {isSuggestOpen && (
            <div
              role="listbox"
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1E2C43] rounded-[10px] border border-[#DDE7F3] dark:border-[#2D405C] shadow-xl overflow-hidden z-50 text-xs text-left animate-in fade-in-50 duration-100"
            >
              {isLoading ? (
                <div className="p-4 text-center text-[#718198] dark:text-[#9AAFCB] flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1464E9]" />
                  <span>正在匹配实时库资源...</span>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="p-4 text-center text-[#718198] dark:text-[#9AAFCB]">
                  未找到包含 “{query}” 的软件资源
                </div>
              ) : (
                <div className="py-1">
                  <div className="px-3.5 py-2 text-[11px] font-semibold text-[#718198] dark:text-[#9AAFCB] bg-[#F5F8FC] dark:bg-[#172338] border-b border-[#E7EDF5] dark:border-[#2D405C] flex items-center justify-between">
                    <span>快速匹配</span>
                    <span className="font-normal text-[10px]">按 ↑↓ 导航，Enter 选中</span>
                  </div>
                  {suggestions.map((item, idx) => (
                    <div
                      key={item.id}
                      role="option"
                      aria-selected={idx === selectedIndex}
                      onClick={() => {
                        onSelectSoftware(item);
                        setIsSuggestOpen(false);
                      }}
                      className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        idx === selectedIndex
                          ? 'bg-[#EAF2FF] dark:bg-[#253550] text-[#1464E9] dark:text-[#4A91FF]'
                          : 'hover:bg-[#F5F8FC] dark:hover:bg-[#172338] text-[#172B4D] dark:text-[#ECF3FF]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-xs truncate">{item.name}</span>
                        <span className="text-[11px] text-[#718198] dark:text-[#9AAFCB] truncate hidden sm:inline">
                          {item.englishName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-[11px] text-[#718198] dark:text-[#9AAFCB]">
                        <span>{item.categoryName}</span>
                        <span className="text-[#1464E9] dark:text-[#4A91FF] font-medium">
                          查看官方来源 →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 推荐搜索词 (单行文字链接，精致点缀) */}
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-[#718198] dark:text-[#9AAFCB]">
          <span className="font-medium text-[#718198] dark:text-[#9AAFCB]">推荐搜索：</span>
          {siteConfig.popularSearches.map((keyword, index) => (
            <React.Fragment key={keyword}>
              <button
                type="button"
                onClick={() => handleKeywordClick(keyword)}
                className="hover:text-[#1464E9] dark:hover:text-[#4A91FF] transition-colors cursor-pointer"
              >
                {keyword}
              </button>
              {index < siteConfig.popularSearches.length - 1 && (
                <span className="text-[#D0DBEA] dark:text-[#2D405C]" aria-hidden="true">
                  /
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};
