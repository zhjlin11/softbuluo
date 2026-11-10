import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Scale, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { GrowthService } from '../services/growthService';
import {
  CompareService,
  CompareChannelData,
  CompareMatrixData,
} from '../services/compareService';
import { ComparePortalHero } from '../components/compare/ComparePortalHero';
import { CompareSoftwareSelectorAndMatrix } from '../components/compare/CompareSoftwareSelectorAndMatrix';
import { CompareDecisionGuide } from '../components/compare/CompareDecisionGuide';
import { CompareFeaturedArticles } from '../components/compare/CompareFeaturedArticles';
import { CompareAlternativeRecommendations } from '../components/compare/CompareAlternativeRecommendations';
import { CompareCategoryDiscovery } from '../components/compare/CompareCategoryDiscovery';
import { CompareCatalogSection } from '../components/compare/CompareCatalogSection';

export const ComparisonListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query 参数状态水合
  const initialLeft = searchParams.get('left') || '7zip';
  const initialRight = searchParams.get('right') || 'peazip';

  const [leftSlug, setLeftSlug] = useState<string>(initialLeft);
  const [rightSlug, setRightSlug] = useState<string>(initialRight);

  // 频道数据与矩阵数据
  const [channelData, setChannelData] = useState<CompareChannelData | null>(null);
  const [isLoadingChannel, setIsLoadingChannel] = useState(true);
  const [channelError, setChannelError] = useState<string | null>(null);

  const [matrixData, setMatrixData] = useState<CompareMatrixData | null>(null);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);
  const [matrixError, setMatrixError] = useState<string | null>(null);

  // 页面标题与元数据更新
  useEffect(() => {
    document.title = '软件横向对比与选型指南 - 深度参数功能评测 - 软游部落';
    GrowthService.collectPageView(window.location.pathname, 'COMPARISON_LIST', document.referrer);
  }, []);

  // 加载频道全景数据
  const fetchChannelData = useCallback(async () => {
    setIsLoadingChannel(true);
    setChannelError(null);
    const res = await CompareService.getChannelData();
    if (res.success && res.data) {
      setChannelData(res.data);
    } else {
      setChannelError(res.message || '加载对比评测数据失败');
    }
    setIsLoadingChannel(false);
  }, []);

  useEffect(() => {
    fetchChannelData();
  }, [fetchChannelData]);

  // 加载矩阵数据
  const fetchMatrix = useCallback(async (lSlug: string, rSlug: string) => {
    if (!lSlug || !rSlug || lSlug === rSlug) {
      setMatrixData(null);
      return;
    }
    setIsLoadingMatrix(true);
    setMatrixError(null);
    const res = await CompareService.getMatrix(lSlug, rSlug);
    if (res.success && res.data) {
      setMatrixData(res.data);
    } else {
      setMatrixError(res.message || '无法获取对比矩阵');
      setMatrixData(null);
    }
    setIsLoadingMatrix(false);
  }, []);

  // 当 Left 或 Right 变更时，更新 URL Query 参数并加载矩阵
  useEffect(() => {
    if (leftSlug && rightSlug && leftSlug !== rightSlug) {
      const currentLeft = searchParams.get('left');
      const currentRight = searchParams.get('right');
      if (currentLeft !== leftSlug || currentRight !== rightSlug) {
        setSearchParams({ left: leftSlug, right: rightSlug }, { replace: true });
      }
      fetchMatrix(leftSlug, rightSlug);
    }
  }, [leftSlug, rightSlug, fetchMatrix, searchParams, setSearchParams]);

  // 监听浏览器前进后退时同步 URL 参数到 state
  useEffect(() => {
    const qLeft = searchParams.get('left');
    const qRight = searchParams.get('right');
    if (qLeft && qRight && (qLeft !== leftSlug || qRight !== rightSlug)) {
      setLeftSlug(qLeft);
      setRightSlug(qRight);
    }
  }, [searchParams]);

  // 操作函数
  const handleSelectLeft = (slug: string) => {
    if (slug === rightSlug) {
      setRightSlug(leftSlug);
    }
    setLeftSlug(slug);
  };

  const handleSelectRight = (slug: string) => {
    if (slug === leftSlug) {
      setLeftSlug(rightSlug);
    }
    setRightSlug(slug);
  };

  const handleSwap = () => {
    const oldLeft = leftSlug;
    const oldRight = rightSlug;
    setLeftSlug(oldRight);
    setRightSlug(oldLeft);
  };

  const handleClear = () => {
    setLeftSlug('');
    setRightSlug('');
    setMatrixData(null);
    setSearchParams({}, { replace: true });
  };

  const handleSelectPair = (lSlug: string, rSlug: string) => {
    setLeftSlug(lSlug);
    setRightSlug(rSlug);
  };

  const scrollToMatrix = () => {
    const el = document.getElementById('compare-matrix-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isLoadingChannel) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-8">
        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-6" />
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse mb-10" />
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse mb-10" />
      </div>
    );
  }

  if (channelError || !channelData) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          加载对比评测频道失败
        </h2>
        <p className="text-sm text-slate-500 mb-6">{channelError || '数据异常'}</p>
        <button
          onClick={fetchChannelData}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm cursor-pointer shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
          <span>重新加载</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1320px] mx-auto px-4 py-6 md:py-8 overflow-x-hidden">
      {/* 面包屑导航 */}
      <nav aria-label="面包屑" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6">
        <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          首页
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 dark:text-slate-100 font-medium">
          软件横向评测与选型中心
        </span>
      </nav>

      {/* 顶部 65%/35% 主视觉 Banner */}
      <ComparePortalHero
        slides={channelData.heroSlides}
        onSelectPair={handleSelectPair}
        onScrollToMatrix={scrollToMatrix}
        comparableCount={channelData.meta.totalComparableSoftwares}
        articlesCount={channelData.meta.totalPublishedComparisons}
        alternativesCount={channelData.meta.totalAlternatives}
      />

      {/* 核心双软件交互选择与矩阵 */}
      <CompareSoftwareSelectorAndMatrix
        softwares={channelData.selectableSoftwares}
        quickPairs={channelData.quickPairs}
        leftSlug={leftSlug}
        rightSlug={rightSlug}
        matrixData={matrixData}
        isLoadingMatrix={isLoadingMatrix}
        onSelectLeft={handleSelectLeft}
        onSelectRight={handleSelectRight}
        onSwap={handleSwap}
        onClear={handleClear}
        onSelectQuickPair={handleSelectPair}
      />

      {/* 场景化专业选型建议 */}
      <CompareDecisionGuide
        guides={channelData.decisionGuides}
        onSelectPair={handleSelectPair}
        onScrollToMatrix={scrollToMatrix}
      />

      {/* 精选横向评测深度长文 */}
      <CompareFeaturedArticles
        articles={channelData.featuredArticles}
        onSelectPair={handleSelectPair}
        onScrollToMatrix={scrollToMatrix}
      />

      {/* 认证替代软件推荐 */}
      <CompareAlternativeRecommendations
        alternatives={channelData.alternatives}
        onSelectPair={handleSelectPair}
        onScrollToMatrix={scrollToMatrix}
      />

      {/* 按分类探索 */}
      <CompareCategoryDiscovery
        categories={channelData.categoryShelves}
        onSelectPair={handleSelectPair}
        onScrollToMatrix={scrollToMatrix}
      />

      {/* 全量可比软件目录 */}
      <CompareCatalogSection
        softwares={channelData.selectableSoftwares}
        leftSlug={leftSlug}
        rightSlug={rightSlug}
        onSelectLeft={handleSelectLeft}
        onSelectRight={handleSelectRight}
        onScrollToMatrix={scrollToMatrix}
      />
    </div>
  );
};
