import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Link2,
  LogOut,
  ExternalLink,
  Shield,
  Layers,
  Menu,
  X,
  User,
  CreditCard,
  RotateCcw,
  Activity,
  FileSpreadsheet,
  Globe2,
  GitPullRequest,
  HeartPulse,
  Bookmark,
  BookOpen,
  Cpu,
  Scale,
  KeyRound,
  ShieldCheck,
  MessageSquare,
  Bot,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { adminGetMe, adminLogout } from '../../services/resourceService';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = '管理控制台' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    adminGetMe()
      .then((res) => {
        if (res.success && res.data?.user) {
          setCurrentUser(res.data.user);
        } else {
          navigate('/admin/login');
        }
      })
      .catch(() => {
        navigate('/admin/login');
      });
  }, [navigate]);

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: '运营工作台', href: '/admin/operations', icon: Activity },
    { label: '数据大盘', href: '/admin', icon: LayoutDashboard },
    { label: '增长与流量分析', href: '/admin/analytics', icon: TrendingUp },
    { label: '页面对比评测', href: '/admin/comparisons', icon: Scale },
    { label: 'SEO 关键词库', href: '/admin/seo/keywords', icon: KeyRound },
    { label: 'SEO 质量审计', href: '/admin/seo/audit', icon: ShieldCheck },
    { label: '用户纠错与报错', href: '/admin/reviews', icon: AlertTriangle },
    { label: 'AI 辅助运营', href: '/admin/ai-assistant', icon: Bot },
    { label: '批量收录与去重', href: '/admin/import', icon: FileSpreadsheet },
    { label: '官方资源来源', href: '/admin/sources', icon: Globe2 },
    { label: '版本自动监测', href: '/admin/version-monitor', icon: GitPullRequest },
    { label: '下载链接健康', href: '/admin/link-monitor', icon: HeartPulse },
    { label: '专题合集管理', href: '/admin/topics', icon: Bookmark },
    { label: '频道展位运营配置', href: '/admin/channel-software', icon: Layers },
    { label: '实用教程管理', href: '/admin/tutorials', icon: BookOpen },
    { label: '自动任务中心', href: '/admin/jobs', icon: Cpu },
    { label: '资源与版本库', href: '/admin/resources', icon: Package },
    { label: '下载来源核验', href: '/admin/download-sources', icon: Link2 },
    { label: '商业订单流水', href: '/admin/orders', icon: CreditCard },
    { label: '退款审核与争议', href: '/admin/refunds', icon: RotateCcw },
    { label: '开发者入驻审核', href: '/admin/developers', icon: ShieldCheck },
    { label: '软件所有权认领', href: '/admin/claims', icon: ShieldCheck },
    { label: '社区交流与举报', href: '/admin/community', icon: MessageSquare },
    { label: '开放 API 与限流', href: '/admin/api-keys', icon: KeyRound },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row text-slate-900 dark:text-slate-100 font-sans">
      {/* 侧边导航栏 */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-200 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* 品牌区 */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight">软游部落</span>
                <span className="text-[10px] text-slate-400">资源运营控制台</span>
              </div>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 导航菜单 */}
          <nav className="p-4 space-y-1.5 text-xs font-medium text-slate-300">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 底部用户与登出 */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>查看前台网站</span>
            </span>
          </Link>

          {currentUser && (
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-blue-900/60 border border-blue-500/40 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {currentUser.username}
                  </div>
                  <span className="text-[10px] text-blue-400 font-mono">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="退出登录"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 主工作区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部工具栏 */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>权限验证通过</span>
            </span>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="p-6 sm:p-8 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
