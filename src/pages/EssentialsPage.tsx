import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { SoftwareItem } from '../types/resource';
import {
  EssentialsChannelData,
  getDesktopResourcesList,
  getEssentialsChannelPortal,
} from '../services/channelService';
import { EssentialsPortalHero } from '../components/essentials/EssentialsPortalHero';
import { EssentialsSetupPlansAndChecklist } from '../components/essentials/EssentialsSetupPlansAndChecklist';
import { EssentialsWorkflowAndToolbox } from '../components/essentials/EssentialsWorkflowAndToolbox';
import { EssentialsCategoriesAndDiscovery } from '../components/essentials/EssentialsCategoriesAndDiscovery';
import { EssentialsCatalogSection } from '../components/essentials/EssentialsCatalogSection';

function applyEssentialsSeoMeta(data?: EssentialsChannelData | null) {
  const origin =
    import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  const canonicalUrl = `${origin}/essentials`;

  const title = '装机必备 - 新电脑装机与必备软件中心 - 软游部落';
  const description = data
    ? `软游部落装机必备频道汇总 ${data.meta.totalPublishedSoftwareCount} 款已发布软件与工具（${data.meta.registeredSourcesCount} 条已登记下载来源，其中 ${data.meta.approvedHealthySourcesCount} 条经人工审核健康直连），提供场景装机方案、交互式勾选清单导出、系统安装流程与装机维修工具箱。`
    : '软游部落装机必备频道：从原版系统安装、官方驱动配置到场景化必备软件清单勾选导出，一站式完成新电脑初始化。';

  document.title = title;

  const upsertMeta = (attr: 'name' | 'property', key: string, content: string) => {
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  upsertMeta('name', 'description', description);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', canonicalUrl);

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', canonicalUrl);
}

export const EssentialsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [portalData, setPortalData] = useState<EssentialsChannelData | null>(null);
  const [portalLoading, setPortalLoading] = useState(true);
  const [portalError, setPortalError] = useState<string | null>(null);

  const [catalogItems, setCatalogItems] = useState<SoftwareItem[]>([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const activeSuiteId = searchParams.get('suite') || 'office';
  const activeCategory = searchParams.get('category') || 'all';
  const activePlatform = searchParams.get('platform') || 'all';
  const activeLicense = searchParams.get('license') || 'all';
  const activeSort = searchParams.get('sort') || 'popular';
  const searchQuery = searchParams.get('q') || '';
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const pageSize = 12;

  const loadPortal = useCallback(async () => {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const data = await getEssentialsChannelPortal();
      setPortalData(data);
      applyEssentialsSeoMeta(data);
    } catch (err: any) {
      setPortalError(err.message || '装机必备频道数据加载失败');
    } finally {
      setPortalLoading(false);
    }
  }, []);

  useEffect(() => {
    applyEssentialsSeoMeta(null);
    loadPortal();
  }, [loadPortal]);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const res = await getDesktopResourcesList({
        categorySlug: activeCategory,
        platform: activePlatform,
        license: activeLicense,
        sort: activeSort,
        search: searchQuery,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      });
      setCatalogItems(res.items || []);
      setCatalogTotal(res.total || 0);
    } catch (err: any) {
      setCatalogError(err.message || '装机软件目录加载失败');
    } finally {
      setCatalogLoading(false);
    }
  }, [activeCategory, activePlatform, activeLicense, activeSort, searchQuery, currentPage]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const updateParams = (updates: Record<string, string | null>, scrollTargetId?: string) => {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    setSearchParams(next, { replace: true });
    if (scrollTargetId) {
      const el = document.getElementById(scrollTargetId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const jumpToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleResetFilters = () => {
    const next = new URLSearchParams(searchParams);
    ['category', 'platform', 'license', 'sort', 'q', 'page'].forEach((k) => next.delete(k));
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0D1524]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-8">
        {portalLoading ? (
          <div className="min-h-[calc(100vh-80px)] space-y-6">
            <div className="h-28 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-8 h-[340px] rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="lg:col-span-4 h-[340px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : portalError || !portalData ? (
          <div className="min-h-[60vh] bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900 p-10 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              新电脑装机与必备软件中心暂时加载失败
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {portalError || '请检查后端 API 服务连接状态后重试'}
            </p>
            <button
              type="button"
              onClick={loadPortal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重新加载装机频道
            </button>
          </div>
        ) : (
          <>
            {/* 顶部面包屑 + 标题 + 阶段锚点 + 65%/35% 主题大图与常用工具 */}
            <EssentialsPortalHero
              meta={portalData.meta}
              stageNav={portalData.stageNav}
              heroSlides={portalData.heroSlides}
              quickTools={portalData.quickTools}
              onJumpToSection={jumpToSection}
            />

            {/* 核心能力：6 大装机用途方案 + 分组复选软件清单 + TXT/JSON 安全导出 */}
            <EssentialsSetupPlansAndChecklist
              setupPlans={portalData.setupPlans}
              activePlanId={activeSuiteId}
              checklistSecurityNotice={portalData.meta.checklistSecurityNotice}
              onSelectPlan={(planId) => updateParams({ suite: planId })}
            />

            {/* 系统安装与驱动配置 8 步流程 + 高风险警示专业维修工具箱 */}
            <EssentialsWorkflowAndToolbox
              installWorkflow={portalData.installWorkflow}
              toolboxGroups={portalData.toolboxGroups}
              onJumpToChecklist={() => jumpToSection('essentials-checklist')}
            />

            {/* 非空常用分类推荐货架 + 专题 + 实战教程 + 真实热度榜 + 最近版本更新 */}
            <EssentialsCategoriesAndDiscovery
              data={portalData}
              onSelectCategoryFilter={(slug) =>
                updateParams({ category: slug, page: null }, 'essentials-catalog')
              }
            />

            {/* 完整装机软件资源库（关键词/分类/平台/许可/排序/分页全部真生效） */}
            <EssentialsCatalogSection
              categories={portalData.categoryShelves}
              items={catalogItems}
              total={catalogTotal}
              loading={catalogLoading}
              error={catalogError}
              activeCategory={activeCategory}
              activePlatform={activePlatform}
              activeLicense={activeLicense}
              activeSort={activeSort}
              searchQuery={searchQuery}
              currentPage={currentPage}
              pageSize={pageSize}
              onUpdateParams={(updates) => updateParams(updates)}
              onResetFilters={handleResetFilters}
              onRetry={loadCatalog}
            />
          </>
        )}
      </div>
    </div>
  );
};
