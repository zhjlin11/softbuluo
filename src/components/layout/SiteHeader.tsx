import React, { useState, useEffect } from 'react';
import { Layers, Search, Sun, Moon, Menu, X, Shield, User } from 'lucide-react';
import { siteConfig } from '../../config/site';

interface SiteHeaderProps {
  onSearchClick: () => void;
  activeNav: string;
  onNavClick: (href: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({
  onSearchClick,
  activeNav,
  onNavClick,
  isDark,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 监听 ESC 键关闭移动菜单
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header
      className={`sticky top-0 z-40 w-full h-[68px] bg-slate-900 text-white border-b transition-all duration-200 ${
        isScrolled
          ? 'border-slate-800 shadow-md bg-slate-900/95 backdrop-blur-md'
          : 'border-slate-800/80'
      }`}
    >
      <div className="max-w-[1280px] h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
        {/* 左侧：品牌 Logo 与名称 */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              onNavClick('#hero');
            }}
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-lg"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-500 transition-colors">
              <Layers className="w-5 h-5 stroke-[2]" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
              {siteConfig.name}
            </span>
          </a>
        </div>

        {/* 中间桌面导航 (6大核心频道) */}
        <nav
          aria-label="主要导航"
          className="hidden md:flex items-center gap-1 lg:gap-2 text-sm font-medium text-slate-300"
        >
          {siteConfig.navItems.map((item) => {
            const isActive = activeNav === item.href;
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  onNavClick(item.href);
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-white bg-slate-800/90 font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* 右侧功能区：快捷搜索、主题切换、用户入口 */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* 快捷聚焦搜索按键 */}
          <button
            onClick={onSearchClick}
            aria-label="打开搜索框"
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-800/80 hover:bg-slate-800 hover:text-white rounded-lg border border-slate-700/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">搜索资源</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-900 rounded border border-slate-700">
              Ctrl K
            </kbd>
          </button>

          {/* 深浅主题切换 */}
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? "切换为明亮模式" : "切换为暗色模式"}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-300" />
            )}
          </button>

          {/* 登录/用户入口 (规范占位无虚假收费) */}
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            title="用户中心 (P1 接入)"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>登录</span>
          </button>

          {/* 移动端汉堡菜单按钮 */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "关闭导航菜单" : "展开导航菜单"}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 移动端导航抽屉 */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-label="移动端全站导航"
          className="md:hidden fixed inset-x-0 top-[68px] bottom-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-top-4 duration-200"
        >
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              导航频道
            </div>
            <div className="grid grid-cols-2 gap-2">
              {siteConfig.navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    onNavClick(item.href);
                  }}
                  className={`p-3 text-sm rounded-xl transition-colors font-medium ${
                    activeNav === item.href
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSearchClick();
                }}
                className="w-full flex items-center justify-center gap-2 p-3 text-sm font-medium text-white bg-slate-800 rounded-xl hover:bg-slate-750 transition-colors"
              >
                <Search className="w-4 h-4 text-slate-400" />
                <span>搜索全部软件与系统工具</span>
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
            <span>{siteConfig.shortName} · 官方正版渠道</span>
            <div className="flex items-center gap-1 text-emerald-400">
              <Shield className="w-3.5 h-3.5" />
              <span>纯净安全</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
