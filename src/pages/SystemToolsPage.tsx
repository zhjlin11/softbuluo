import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { SoftwareItem } from '../types/resource';
import {
  getSystemToolsChannelPortal,
  getSystemToolsResourcesList,
  SystemToolsChannelData,
} from '../services/channelService';
import { SystemToolsPortalHero } from '../components/systemTools/SystemToolsPortalHero';
import { SystemToolsScenarioNavigator } from '../components/systemTools/SystemToolsScenarioNavigator';
import { SystemToolsDomainShowcase } from '../components/systemTools/SystemToolsDomainShowcase';
import { SoftwareLeaderboards } from '../components/software/SoftwareLeaderboards';
import { SystemToolsEditorialAndUpdates } from '../components/systemTools/SystemToolsEditorialAndUpdates';
import { SystemToolsCatalogSection } from '../components/systemTools/SystemToolsCatalogSection';

const CATALOG_PAGE_SIZE = 12;

function applySystemToolsSeoMeta(data?: SystemToolsChannelData | null) {
  const origin =
    import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  const canonicalUrl = `${origin}/system-tools`;

  const title = '系统工具频道 - 专业电脑维护、硬件体检、磁盘分区与网络排障中心 - 软游部落';
  const description = data
    ? `软游部落系统工具频道汇集 ${data.meta.totalToolsCount} 款维护诊断与系统引导工具（含 ${data.meta.utilityToolsCount} 款实操维保工具），已登记 ${data.meta.registeredSourcesCount} 条可用来源（含 ${data.meta.approvedHealthySourcesCount} 条已审核健康直连），覆盖电脑故障场景排障、编辑精选、维修教程与高风险操作备份提示，具体 SHA-256 校验状态以各来源明细为准。`
    : '软游部落系统工具频道围绕电脑运行缓慢、硬盘健康与数据恢复、网络排障、硬件体检与装机引导，提供系统维护工具导航与安全操作指引。';

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

export const SystemToolsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const scenariosRef = useRef<HTMLElement | null>(null);
  const domainsRef = useRef<HTMLElement | null>(null);
  const catalogRef = useRef<HTMLElement | null>(null);

  const [portalData, setPortalData] = useState<SystemToolsChannelData | null>(null);
  const [portalLoading, setPortalLoading] = useState(true);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [activeDomainSlug, setActiveDomainSlug] = useState<string>('all');

  const [catalogItems, setCatalogItems] = useState<SoftwareItem[]>([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const activeCategory = searchParams.get('category') || 'all';
  const activePlatform = searchParams.get('platform') || 'all';
  const activeLicense = searchParams.get('license') || 'all';
  const activeSort = searchParams.get('sort') || 'popular';
  const searchQuery = searchParams.get('q') || '';
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const loadPortal = useCallback(async () => {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const data = await getSystemToolsChannelPortal();
      setPortalData(data);
      applySystemToolsSeoMeta(data);
    } catch (err: any) {
      setPortalError(err.message || '系统工具频道数据加载失败');
    } finally {
      setPortalLoading(false);
    }
  }, []);

  useEffect(() => {
    applySystemToolsSeoMeta(null);
    loadPortal();
  }, [loadPortal]);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const res = await getSystemToolsResourcesList({
        categorySlug: activeCategory,
        platform: activePlatform,
        license: activeLicense,
        sort: activeSort,
        search: searchQuery || undefined,
        limit: CATALOG_PAGE_SIZE,
        offset: (currentPage - 1) * CATALOG_PAGE_SIZE,
      });
      setCatalogItems(res.items || []);
      setCatalogTotal(res.total || 0);
    } catch (err: any) {
      setCatalogError(err.message || '工具列表加载失败');
      setCatalogItems([]);
    } finally {
      setCatalogLoading(false);
    }
  }, [activeCategory, activePlatform, activeLicense, activeSort, searchQuery, currentPage]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleUpdateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      for (const [k, v] of Object.entries(updates)) {
        if (!v || v === 'all') next.delete(k);
        else next.set(k, v);
      }
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const handleResetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectDomain = (slug: string) => {
    setActiveDomainSlug(slug);
    scrollTo(domainsRef);
  };

  const handleJumpCatalogWithCategory = (categorySlug: string) => {
    handleUpdateParams({ category: categorySlug, page: null });
    scrollTo(catalogRef);
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] dark:bg-[#0D1524] transition-colors">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-7 sm:space-y-8">
        {portalLoading ? (
          <div className="space-y-5">
            <div className="h-24 rounded-xl bg-white dark:bg-slate-900 border border-[#E6ECF5] dark:border-slate-800 animate-pulse" />
            <div className="h-12 rounded-xl bg-white dark:bg-slate-900 border border-[#E6ECF5] dark:border-slate-800 animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 h-[330px] rounded-2xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
              <div className="lg:col-span-4 h-[330px] rounded-2xl bg-white dark:bg-slate-900 border border-[#E6ECF5] dark:border-slate-800 animate-pulse" />
            </div>
          </div>
        ) : portalError || !portalData ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/60 p-12 text-center space-y-3 shadow-xs">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">系统工具频道加载异常</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {portalError || '系统工具数据暂时无法读取，请稍后重试'}
            </p>
            <button
              type="button"
              onClick={loadPortal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重新加载频道
            </button>
          </div>
        ) : (
          <>
            {/* 1 & 2 & 3. 紧凑头部 + 快捷分类 + 专题大图与右侧维修常用工具 */}
            <SystemToolsPortalHero
              meta={portalData.meta}
              domains={portalData.domainBlocks}
              activeDomainSlug={activeDomainSlug}
              onSelectDomain={handleSelectDomain}
              heroSlides={portalData.heroSlides}
              commonTools={portalData.commonTools}
              onJumpToCatalog={() => scrollTo(catalogRef)}
              onJumpToScenarios={() => scrollTo(scenariosRef)}
            />

            {/* 系统工具高危操作安全告知 */}
            <div
              role="note"
              aria-label="高危系统维护操作风险提示"
              className="p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/35 border border-amber-200/90 dark:border-amber-800/70 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-[13px] text-amber-950 dark:text-amber-200 leading-relaxed">
                <strong className="font-bold">高风险维护安全提醒：</strong>
                执行磁盘分区调整、数据扇区恢复、启动 U 盘格式化写入、注册表深度清理或系统重装前，务必先将重要文件备份至另一块独立硬盘或云盘。本频道绝不提供第三方魔改系统与破解激活脚本，所有下载来源均标注真实审核与 SHA-256 核验状态。
              </div>
            </div>

            {/* 4. 重点特色：电脑遇到问题？按场景找工具 */}
            <SystemToolsScenarioNavigator
              sectionRef={scenariosRef}
              scenarios={portalData.scenarios}
              onFilterDomain={handleSelectDomain}
            />

            {/* 5 & 6. 专业系统工具分类 + 编辑精选工具 */}
            <SystemToolsDomainShowcase
              sectionRef={domainsRef}
              domains={portalData.domainBlocks}
              activeDomainSlug={activeDomainSlug}
              onSelectDomain={handleSelectDomain}
              onJumpToCatalogWithCategory={handleJumpCatalogWithCategory}
              editorPicks={portalData.editorPicks}
            />

            {/* 7. 实用工具排行榜 (复用 P8.7.2 真实低流量自适应组件) */}
            <SoftwareLeaderboards
              mostViewed={portalData.leaderboards.mostViewed}
              mostDownloaded={portalData.leaderboards.mostDownloaded}
              headingTitle="实用工具排行榜"
              headingSubtitle="严格采用真实系统工具浏览量与非测试下载触发事件排序（绝不注水或用 0 点击凑榜）"
              viewTopTitle="热门关注工具"
            />

            {/* 8 & 9 & 10. 维修专题合集 + 系统维护教程与对比 + 最近更新/新收录双栏 */}
            <SystemToolsEditorialAndUpdates
              topics={portalData.hotTopics}
              tutorials={portalData.tutorials}
              comparisons={portalData.comparisons}
              versionUpdates={portalData.latestUpdates.versionUpdates}
              newlyCataloged={portalData.latestUpdates.newlyCataloged}
            />

            {/* 11. 完整工具库与多维检索 */}
            <SystemToolsCatalogSection
              sectionRef={catalogRef}
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
              pageSize={CATALOG_PAGE_SIZE}
              onUpdateParams={handleUpdateParams}
              onResetFilters={handleResetFilters}
              onRetry={loadCatalog}
            />
          </>
        )}
      </div>
    </div>
  );
};
