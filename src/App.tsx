import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link, Navigate } from 'react-router-dom';
import { SiteHeader } from './components/layout/SiteHeader';
import { SiteFooter } from './components/layout/SiteFooter';
import { HomePage } from './pages/HomePage';
import { ArrowLeft, Loader2 } from 'lucide-react';

// 页面级按需懒加载（将后台管理与详情页模块代码独立拆分，大幅缩减首屏首页 JS 体积）
const ResourceDetailPage = lazy(() =>
  import('./pages/ResourceDetailPage').then((m) => ({ default: m.ResourceDetailPage }))
);
const AdminLoginPage = lazy(() =>
  import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminResourcesPage = lazy(() =>
  import('./pages/admin/AdminResourcesPage').then((m) => ({ default: m.AdminResourcesPage }))
);
const AdminSourcesPage = lazy(() =>
  import('./pages/admin/AdminSourcesPage').then((m) => ({ default: m.AdminSourcesPage }))
);
const AdminOrdersPage = lazy(() =>
  import('./pages/admin/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage }))
);
const AdminRefundsPage = lazy(() =>
  import('./pages/admin/AdminRefundsPage').then((m) => ({ default: m.AdminRefundsPage }))
);
const AdminOperationsPage = lazy(() =>
  import('./pages/admin/AdminOperationsPage').then((m) => ({ default: m.AdminOperationsPage }))
);
const AdminImportPage = lazy(() =>
  import('./pages/admin/AdminImportPage').then((m) => ({ default: m.AdminImportPage }))
);
const AdminOfficialSourcesPage = lazy(() =>
  import('./pages/admin/AdminOfficialSourcesPage').then((m) => ({ default: m.AdminOfficialSourcesPage }))
);
const AdminVersionMonitorPage = lazy(() =>
  import('./pages/admin/AdminVersionMonitorPage').then((m) => ({ default: m.AdminVersionMonitorPage }))
);
const AdminLinkMonitorPage = lazy(() =>
  import('./pages/admin/AdminLinkMonitorPage').then((m) => ({ default: m.AdminLinkMonitorPage }))
);
const AdminTopicsPage = lazy(() =>
  import('./pages/admin/AdminTopicsPage').then((m) => ({ default: m.AdminTopicsPage }))
);
const AdminChannelConfigPage = lazy(() =>
  import('./pages/admin/AdminChannelConfigPage').then((m) => ({ default: m.AdminChannelConfigPage }))
);
const AdminTutorialsPage = lazy(() =>
  import('./pages/admin/AdminTutorialsPage').then((m) => ({ default: m.AdminTutorialsPage }))
);
const AdminJobsPage = lazy(() =>
  import('./pages/admin/AdminJobsPage').then((m) => ({ default: m.AdminJobsPage }))
);
const CategoryPage = lazy(() =>
  import('./pages/CategoryPage').then((m) => ({ default: m.CategoryPage }))
);
const TopicDetailPage = lazy(() =>
  import('./pages/TopicDetailPage').then((m) => ({ default: m.TopicDetailPage }))
);

// P8.7 全站独立栏目与专题中心页面懒加载
const SoftwarePage = lazy(() =>
  import('./pages/SoftwarePage').then((m) => ({ default: m.SoftwarePage }))
);
const SystemToolsPage = lazy(() =>
  import('./pages/SystemToolsPage').then((m) => ({ default: m.SystemToolsPage }))
);
const GamesPage = lazy(() =>
  import('./pages/GamesPage').then((m) => ({ default: m.GamesPage }))
);
const EssentialsPage = lazy(() =>
  import('./pages/EssentialsPage').then((m) => ({ default: m.EssentialsPage }))
);
const TutorialsPage = lazy(() =>
  import('./pages/TutorialsPage').then((m) => ({ default: m.TutorialsPage }))
);
const TutorialDetailPage = lazy(() =>
  import('./pages/TutorialDetailPage').then((m) => ({ default: m.TutorialDetailPage }))
);
const UpdatesPage = lazy(() =>
  import('./pages/UpdatesPage').then((m) => ({ default: m.UpdatesPage }))
);
const TopicsIndexPage = lazy(() =>
  import('./pages/TopicsIndexPage').then((m) => ({ default: m.TopicsIndexPage }))
);
const MembershipPage = lazy(() =>
  import('./pages/MembershipPage').then((m) => ({ default: m.MembershipPage }))
);
const CheckoutPage = lazy(() =>
  import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage }))
);
const AccountPage = lazy(() =>
  import('./pages/AccountPage').then((m) => ({ default: m.AccountPage }))
);
const ComparisonListPage = lazy(() =>
  import('./pages/ComparisonListPage').then((m) => ({ default: m.ComparisonListPage }))
);
const ComparisonDetailPage = lazy(() =>
  import('./pages/ComparisonDetailPage').then((m) => ({ default: m.ComparisonDetailPage }))
);
const AdminComparisonsPage = lazy(() =>
  import('./pages/admin/AdminComparisonsPage').then((m) => ({ default: m.AdminComparisonsPage }))
);
const AdminKeywordsPage = lazy(() =>
  import('./pages/admin/AdminKeywordsPage').then((m) => ({ default: m.AdminKeywordsPage }))
);
const AdminSeoAuditPage = lazy(() =>
  import('./pages/admin/AdminSeoAuditPage').then((m) => ({ default: m.AdminSeoAuditPage }))
);
const AdminReviewsPage = lazy(() =>
  import('./pages/admin/AdminReviewsPage').then((m) => ({ default: m.AdminReviewsPage }))
);
const AdminAiAssistantPage = lazy(() =>
  import('./pages/admin/AdminAiAssistantPage').then((m) => ({ default: m.AdminAiAssistantPage }))
);
const AdminAnalyticsPage = lazy(() =>
  import('./pages/admin/AdminAnalyticsPage').then((m) => ({ default: m.AdminAnalyticsPage }))
);

// P6 开发者入驻、社区交流、只读开放 API 与治理后台页面懒加载
const DeveloperPortalPage = lazy(() =>
  import('./pages/DeveloperPortalPage').then((m) => ({ default: m.DeveloperPortalPage }))
);
const DeveloperRegisterPage = lazy(() =>
  import('./pages/DeveloperRegisterPage').then((m) => ({ default: m.DeveloperRegisterPage }))
);
const DeveloperDashboardPage = lazy(() =>
  import('./pages/DeveloperDashboardPage').then((m) => ({ default: m.DeveloperDashboardPage }))
);
const DeveloperApiKeysPage = lazy(() =>
  import('./pages/DeveloperApiKeysPage').then((m) => ({ default: m.DeveloperApiKeysPage }))
);
const DeveloperPublicPage = lazy(() =>
  import('./pages/DeveloperPublicPage').then((m) => ({ default: m.DeveloperPublicPage }))
);
const ApiDocsPage = lazy(() =>
  import('./pages/ApiDocsPage').then((m) => ({ default: m.ApiDocsPage }))
);
const CommunityPage = lazy(() =>
  import('./pages/CommunityPage').then((m) => ({ default: m.CommunityPage }))
);
const CommunityDetailPage = lazy(() =>
  import('./pages/CommunityDetailPage').then((m) => ({ default: m.CommunityDetailPage }))
);
const AdminDevelopersPage = lazy(() =>
  import('./pages/admin/AdminDevelopersPage').then((m) => ({ default: m.AdminDevelopersPage }))
);
const AdminClaimsPage = lazy(() =>
  import('./pages/admin/AdminClaimsPage').then((m) => ({ default: m.AdminClaimsPage }))
);
const AdminCommunityPage = lazy(() =>
  import('./pages/admin/AdminCommunityPage').then((m) => ({ default: m.AdminCommunityPage }))
);
const AdminApiKeysPage = lazy(() =>
  import('./pages/admin/AdminApiKeysPage').then((m) => ({ default: m.AdminApiKeysPage }))
);

const PageLoadingFallback = () => (
  <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-slate-400">
    <Loader2 className="w-6 h-6 animate-spin text-[#1769D2] mb-2" />
    <span className="text-xs">加载页面模块中...</span>
  </div>
);

function AppLayout({ isDark, setIsDark }: { isDark: boolean; setIsDark: (val: boolean) => void }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const focusSearch = () => {
    const el = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (isAdminRoute) {
    return (
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/operations" element={<AdminOperationsPage />} />
          <Route path="/admin/import" element={<AdminImportPage />} />
          <Route path="/admin/sources" element={<AdminOfficialSourcesPage />} />
          <Route path="/admin/version-monitor" element={<AdminVersionMonitorPage />} />
          <Route path="/admin/link-monitor" element={<AdminLinkMonitorPage />} />
          <Route path="/admin/topics" element={<AdminTopicsPage />} />
          <Route path="/admin/channel-software" element={<AdminChannelConfigPage />} />
          <Route path="/admin/tutorials" element={<AdminTutorialsPage />} />
          <Route path="/admin/jobs" element={<AdminJobsPage />} />
          <Route path="/admin/resources" element={<AdminResourcesPage />} />
          <Route path="/admin/download-sources" element={<AdminSourcesPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/refunds" element={<AdminRefundsPage />} />
          <Route path="/admin/comparisons" element={<AdminComparisonsPage />} />
          <Route path="/admin/seo/keywords" element={<AdminKeywordsPage />} />
          <Route path="/admin/seo/audit" element={<AdminSeoAuditPage />} />
          <Route path="/admin/reviews" element={<AdminReviewsPage />} />
          <Route path="/admin/ai-assistant" element={<AdminAiAssistantPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/admin/developers" element={<AdminDevelopersPage />} />
          <Route path="/admin/claims" element={<AdminClaimsPage />} />
          <Route path="/admin/community" element={<AdminCommunityPage />} />
          <Route path="/admin/api-keys" element={<AdminApiKeysPage />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA] dark:bg-[#0D1524] text-[#202938] dark:text-slate-100 transition-colors duration-150">
      {/* 顶部吸顶导航栏 */}
      <SiteHeader
        onSearchClick={focusSearch}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      <main className="flex-1">
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage onSearchClick={focusSearch} />} />

            {/* P8.7 全站独立栏目路由挂载 */}
            <Route path="/software" element={<SoftwarePage />} />
            <Route path="/software/:slug" element={<ResourceDetailPage />} />

            <Route path="/system-tools" element={<SystemToolsPage />} />
            <Route path="/tool/:slug" element={<ResourceDetailPage />} />

            <Route path="/games" element={<GamesPage />} />
            <Route path="/game/:slug" element={<ResourceDetailPage />} />

            <Route path="/essentials" element={<EssentialsPage />} />

            <Route path="/tutorials" element={<TutorialsPage />} />
            <Route path="/tutorials/:slug" element={<TutorialDetailPage />} />
            <Route path="/tutorial/:slug" element={<TutorialDetailPage />} />

            <Route path="/updates" element={<UpdatesPage />} />

            <Route path="/topics" element={<TopicsIndexPage />} />
            <Route path="/topics/:slug" element={<TopicDetailPage />} />
            <Route path="/topic/:slug" element={<TopicDetailPage />} />

            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/membership" element={<MembershipPage />} />
            <Route path="/checkout/:orderNo" element={<CheckoutPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/compare" element={<ComparisonListPage />} />
            <Route path="/compare/:slug" element={<ComparisonDetailPage />} />

            {/* 开发者路由已下线，统一重定向至首页 */}
            <Route path="/developer" element={<Navigate to="/" replace />} />
            <Route path="/developer/*" element={<Navigate to="/" replace />} />
            <Route path="/developers/*" element={<Navigate to="/" replace />} />

            {/* P6/P8.7.7 社区讨论与互动路由 */}
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/thread/:id" element={<CommunityDetailPage />} />
            <Route path="/community/:id" element={<CommunityDetailPage />} />
            <Route path="/community/software/:slug" element={<CommunityPage />} />
            <Route
              path="*"
              element={
                <div className="max-w-[1320px] mx-auto px-4 py-24 text-center">
                  <div className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#1769D2] flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                    404
                  </div>
                  <h1 className="text-xl font-bold mb-2">未找到该资源页面</h1>
                  <p className="text-xs text-slate-500 mb-6">该资源可能已变更路径或尚未正式发布收录。</p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1769D2] hover:bg-[#1258B5] text-white rounded-md text-xs font-semibold shadow-2xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>返回软游部落首页</span>
                  </Link>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </main>

      {/* 底部合规页脚 */}
      <SiteFooter
        onCategoryClick={(slug) => {
          window.location.href = `/?category=${slug}#search-results-section`;
        }}
      />
    </div>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <BrowserRouter>
      <AppLayout isDark={isDark} setIsDark={setIsDark} />
    </BrowserRouter>
  );
}
