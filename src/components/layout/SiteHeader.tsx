import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, Menu, X, User, Crown } from 'lucide-react';
import { siteConfig } from '../../config/site';
import { MAIN_NAV_ITEMS } from '../../config/navigation';
import { getMemberProfile } from '../../services/commerceService';
import { AuthModal } from '../auth/AuthModal';

interface SiteHeaderProps {
  onSearchClick: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({
  onSearchClick,
  isDark,
  onToggleTheme,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [member, setMember] = useState<any | null>(null);
  const [isVip, setIsVip] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const syncMemberState = () => {
      getMemberProfile()
        .then((data) => {
          if (!active) return;
          setMember(data.member);
          setIsVip(data.isVip);
        })
        .catch(() => {
          if (!active) return;
          setMember(null);
          setIsVip(false);
        });
    };

    syncMemberState();
    window.addEventListener('softtribe-auth-updated', syncMemberState);
    return () => {
      active = false;
      window.removeEventListener('softtribe-auth-updated', syncMemberState);
    };
  }, []);

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

  const navLinks = MAIN_NAV_ITEMS;

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith('/#')) {
      const anchor = href.replace('/', '');
      if (location.pathname !== '/') {
        navigate(href);
        return;
      }
      const el = document.querySelector(anchor);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    } else if (href === '/') {
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
      }
    } else {
      navigate(href);
    }
  };

  const isLinkActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/' && !location.hash && !location.search;
    }
    if (href.startsWith('/#')) {
      return location.pathname === '/' && location.hash === href.replace('/', '');
    }
    return location.pathname.startsWith(href);
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full h-[64px] bg-[#FDFEFF]/98 dark:bg-[#121B2B]/98 border-b border-[#E7EDF5] dark:border-[#2D405C] backdrop-blur-md transition-all duration-150 ${
        isScrolled
          ? 'shadow-[0_2px_12px_rgba(15,35,70,0.035)]'
          : ''
      }`}
    >
      <div className="max-w-[1320px] h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 lg:gap-6">
        {/* 左侧：品牌 Logo 与名称 */}
        <div className="flex items-center shrink-0">
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1464E9] rounded-lg py-1"
          >
            {!logoError ? (
              <img
                src={siteConfig.logoUrl}
                alt="软游部落 Logo"
                onError={() => setLogoError(true)}
                className="h-8 sm:h-[34px] w-auto max-w-[125px] object-contain shrink-0 transition-transform group-hover:scale-102"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#1464E9] flex items-center justify-center text-white font-bold text-sm shadow-2xs">
                软游
              </div>
            )}
            <span className="text-[17.5px] font-bold tracking-tight text-[#172B4D] dark:text-[#ECF3FF] whitespace-nowrap">
              {siteConfig.name}
            </span>
          </Link>
        </div>

        {/* 中间桌面导航 (7 大核心主导航频道) */}
        <nav
          aria-label="主站导航"
          className="hidden xl:flex items-center gap-1 2xl:gap-1.5 text-[14px] font-medium"
        >
          {navLinks.map((item) => {
            const active = isLinkActive(item.href);
            return (
              <button
                key={item.label}
                id={item.id}
                onClick={() => handleNavClick(item.href)}
                className={`px-3 py-1.5 rounded-[8px] whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                  active
                    ? 'bg-[#EAF2FF] dark:bg-[#1E2D4A] text-[#1464E9] dark:text-[#4A91FF] font-semibold'
                    : 'text-[#52637D] dark:text-[#9AAFCB] hover:text-[#1464E9] dark:hover:text-[#4A91FF] hover:bg-[#F0F5FD] dark:hover:bg-slate-800/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* 右侧功能区：快捷搜索、主题切换、后台控制台/登录入口 */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* 快捷聚焦搜索框入口 */}
          <button
            onClick={onSearchClick}
            aria-label="聚焦搜索框"
            className="flex items-center gap-2 h-[36px] px-2.5 text-xs text-[#52637D] dark:text-[#9AAFCB] bg-[#F5F8FC] dark:bg-[#1E2C43] hover:bg-[#EEF5FF] dark:hover:bg-[#253550] hover:text-[#1464E9] dark:hover:text-[#4A91FF] rounded-[8px] border border-[#E3EAF3] dark:border-[#2D405C] hover:border-[#B8D3F9] dark:hover:border-[#4A91FF]/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1464E9] cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-[#7A8B9E] dark:text-[#9AAFCB]" />
            <span className="hidden sm:inline font-medium">全网找资源</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[#718198] dark:text-slate-400 bg-white dark:bg-[#121B2B] rounded border border-[#D8E3F0] dark:border-slate-700 shadow-2xs">
              Ctrl K
            </kbd>
          </button>

          {/* 深浅主题切换按钮 (36x36px) */}
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? "切换为亮色模式" : "切换为暗色模式"}
            className="w-9 h-9 flex items-center justify-center text-[#52637D] dark:text-[#9AAFCB] hover:text-[#172B4D] dark:hover:text-white bg-transparent hover:bg-[#F0F4FA] dark:hover:bg-[#1E2C43] rounded-[8px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1464E9] cursor-pointer"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#F59E0B]" />
            ) : (
              <Moon className="w-4 h-4 text-[#52637D]" />
            )}
          </button>

          {/* 会员中心与登录状态入口 */}
          {member ? (
            <Link
              to="/account"
              className="flex items-center gap-1.5 h-[36px] px-2.5 text-xs font-semibold text-[#172B4D] dark:text-[#ECF3FF] bg-[#F5F8FC] dark:bg-[#1E2C43] hover:bg-[#EEF5FF] dark:hover:bg-[#253550] rounded-[9px] border border-[#E3EAF3] dark:border-[#2D405C] transition-colors"
            >
              {isVip ? (
                <Crown className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
              ) : (
                <User className="w-3.5 h-3.5 text-[#52637D] dark:text-[#9AAFCB]" />
              )}
              <span className="max-w-[70px] truncate">{member.username}</span>
            </Link>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-1.5 h-[36px] sm:h-[38px] px-3.5 text-xs sm:text-[13px] font-medium text-white bg-[#1464E9] hover:bg-[#0F55CD] active:bg-[#0C47AD] rounded-[9px] transition-colors shadow-[0_1px_4px_rgba(20,100,233,0.18)] cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>登录 / 注册</span>
            </button>
          )}

          {/* 移动端与平板汉堡折叠按钮 (<1280px 展示, 36x36px) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "关闭导航菜单" : "展开导航菜单"}
            aria-expanded={mobileMenuOpen}
            className="xl:hidden w-9 h-9 flex items-center justify-center text-[#52637D] dark:text-[#9AAFCB] hover:text-[#172B4D] dark:hover:text-white hover:bg-[#F0F4FA] dark:hover:bg-[#1E2C43] rounded-[8px] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 移动端与平板导航抽屉 */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-label="移动端全站导航"
          className="xl:hidden fixed inset-x-0 top-[64px] bottom-0 z-50 bg-[#FDFEFF]/98 dark:bg-[#121B2B]/98 backdrop-blur-md border-t border-[#E7EDF5] dark:border-[#2D405C] p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-top-2 duration-150"
        >
          <div className="space-y-4">
            <div className="text-xs font-semibold text-[#718198] dark:text-[#9AAFCB] uppercase tracking-wider mb-2">
              门户核心频道
            </div>
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((item, idx) => (
                <button
                  key={item.label}
                  id={`mobile-${item.id}`}
                  onClick={() => handleNavClick(item.href)}
                  className={`p-3 text-left rounded-[8px] text-xs font-medium transition-colors ${
                    idx === 0 ? 'col-span-2' : ''
                  } ${
                    isLinkActive(item.href)
                      ? 'bg-[#EAF2FF] dark:bg-[#1E2D4A] text-[#1464E9] dark:text-[#4A91FF] font-semibold'
                      : 'bg-[#F5F8FC] dark:bg-[#1E2C43] text-[#52637D] dark:text-[#9AAFCB] border border-[#E3EAF3] dark:border-[#2D405C] hover:border-[#1464E9]/40 hover:text-[#1464E9]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E7EDF5] dark:border-[#2D405C] flex items-center justify-between text-xs text-[#718198] dark:text-[#9AAFCB]">
            {member ? (
              <Link
                to="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-1.5 text-[#F59E0B] font-bold"
              >
                <Crown className="w-4 h-4 fill-[#F59E0B]" />
                <span>{member.username} (个人中心)</span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="flex items-center gap-1.5 text-[#52637D] dark:text-[#9AAFCB] hover:text-[#1464E9] dark:hover:text-white cursor-pointer font-medium"
              >
                <User className="w-4 h-4" />
                <span>会员登录 / 注册</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 弹窗 */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(data) => {
          setMember(data.member);
          setIsVip(data.isVip);
        }}
      />
    </header>
  );
};
