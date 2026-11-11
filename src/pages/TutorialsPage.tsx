import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Laptop,
  Flame,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  fetchTutorialsChannel,
  TutorialChannelData,
} from '../services/tutorialService';
import { TutorialsHero } from '../components/tutorials/TutorialsHero';
import { TutorialsFilterBar } from '../components/tutorials/TutorialsFilterBar';
import { TutorialCard } from '../components/tutorials/TutorialCard';

export const TutorialsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [channelData, setChannelData] = useState<TutorialChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从 URL 读取筛选参数
  const activeCategory = searchParams.get('cat') || 'all';
  const searchQuery = searchParams.get('q') || '';
  const difficulty = searchParams.get('diff') || 'ALL';
  const platform = searchParams.get('plat') || 'ALL';
  const sort = searchParams.get('sort') || 'latest';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 12;

  // SEO 标题与 Description 设置
  useEffect(() => {
    document.title = '电脑软件教程与实用技术指南 - Windows系统安装、排障与办公实操 - 软游部落';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      '从 Windows 系统安装、电脑维修到软件使用与网络排障，软游部落为您提供清晰、可靠、循序渐进的技术操作指南。已收录 27 篇深度实操图文教程，拒绝水文与虚假套路。'
    );

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://softtribe.top/tutorials');
  }, []);

  // 加载频道数据
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchTutorialsChannel({
      category: activeCategory,
      difficulty,
      platform,
      q: searchQuery,
      sort,
      page: currentPage,
      limit: pageSize,
    })
      .then((data) => {
        setChannelData(data);
      })
      .catch((err) => {
        console.error('加载教程频道数据失败:', err);
        setError('教程数据加载失败，请检查网络连接后重试。');
      })
      .finally(() => setLoading(false));
  }, [activeCategory, searchQuery, difficulty, platform, sort, currentPage]);

  // URL 状态更新帮助函数
  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '' || val === 'all' || val === 'ALL') {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    });
    // 重置分页
    if (!updates.page) {
      next.delete('page');
    }
    setSearchParams(next);
  };

  const handleCategoryChange = (catId: string) => {
    updateParams({ cat: catId });
  };

  const handleSearchChange = (q: string) => {
    updateParams({ q: q.trim() ? q : null });
  };

  const handleDifficultyChange = (diff: string) => {
    updateParams({ diff });
  };

  const handlePlatformChange = (plat: string) => {
    updateParams({ plat });
  };

  const handleSortChange = (newSort: string) => {
    updateParams({ sort: newSort });
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const items = channelData?.items || [];
  const total = channelData?.pagination.total || 0;
  const totalPages = channelData?.pagination.totalPages || 1;

  // 专题精选分块：当用户处于 "all" 且无关键词搜索时展示专题推荐
  const isDefaultView = activeCategory === 'all' && !searchQuery.trim() && difficulty === 'ALL' && platform === 'ALL';

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 min-h-screen">
      {/* 顶部面包屑与全站统计 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-5">
        <nav className="flex items-center gap-1.5">
          <Link to="/" className="hover:text-[#1769D2] transition-colors">软游部落首页</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 dark:text-slate-100 font-semibold">软件教程</span>
        </nav>

        {channelData && (
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span>已收录 <strong>{channelData.stats.totalTutorials}</strong> 篇技术指南</span>
            <span>•</span>
            <span><strong>{channelData.stats.totalCategories}</strong> 大专业分类</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-sans font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              100% 真实实操复核
            </span>
          </div>
        )}
      </div>

      {/* 门户主标题区 */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-300 text-xs font-bold mb-2.5 border border-blue-200/60 dark:border-blue-900/40">
          <BookOpen className="w-3.5 h-3.5" />
          <span>UI 3.0 独立门户 · 拒绝水文与虚假套路</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          电脑软件教程与实用技术指南
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          从 Windows 系统安装、电脑维修到软件使用与网络排障，提供清晰、可靠、循序渐进的技术操作指南。每篇实操均包含准备清单、安全风险提示与正版软件直达。
        </p>
      </div>

      {/* 顶部 Hero：65% 焦点教程 + 35% 热门排障 */}
      {channelData && (
        <TutorialsHero
          hero={channelData.hero}
          quickTroubleshooting={channelData.quickTroubleshooting}
        />
      )}

      {/* 多维检索与分类筛选栏 */}
      {channelData && (
        <TutorialsFilterBar
          categories={channelData.categories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          difficulty={difficulty}
          onDifficultyChange={handleDifficultyChange}
          platform={platform}
          onPlatformChange={handlePlatformChange}
          sort={sort}
          onSortChange={handleSortChange}
          onResetFilters={handleResetFilters}
          totalFiltered={total}
        />
      )}

      {/* 教程列表卡片区 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"
            />
          ))}
        </div>
      ) : error ? (
        <div className="py-16 text-center bg-white dark:bg-[#131C2E] rounded-2xl border border-rose-200 dark:border-rose-900/40 p-6">
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{error}</p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 bg-[#1769D2] text-white rounded-xl text-xs font-semibold"
          >
            重置筛选条件
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-[#131C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            暂未找到匹配的教程内容
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            建议您尝试更换检索关键词、选择全部操作系统，或点击下方按钮清空筛选条件。
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-5 px-4 py-2 bg-[#1769D2] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors"
          >
            清空所有筛选条件
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <TutorialCard key={item.id} item={item} />
            ))}
          </div>

          {/* 分页控制栏 */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => updateParams({ page: String(currentPage - 1) })}
                className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131C2E] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-slate-700 dark:text-slate-200"
              >
                上一页
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400 px-3 font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => updateParams({ page: String(currentPage + 1) })}
                className="px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131C2E] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-slate-700 dark:text-slate-200"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {/* 默认首页专题亮点板块（仅在全部视图下展示，避免干扰筛选） */}
      {isDefaultView && (
        <div className="mt-14 pt-10 border-t border-slate-200 dark:border-slate-800 space-y-10">
          {/* 专题板块 1：Windows 原版装机与系统维护 */}
          <section className="bg-slate-50 dark:bg-[#131C2E]/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-4 rounded bg-[#1769D2]" />
                  <span>Windows 原版纯净装机与启动维护专题</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  避开流氓 PE 植入与全家桶捆绑，掌握 Rufus、Ventoy 与官方原厂 ISO 镜像校验。
                </p>
              </div>
              <button
                onClick={() => handleCategoryChange('windows')}
                className="text-xs font-semibold text-[#1769D2] hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                <span>查看该分类全量指南</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/tutorials/clean-install-win11-guide"
                className="p-3.5 rounded-xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-all block group"
              >
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block mb-1">系统重装</span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1769D2] line-clamp-2">
                  Windows 11 原版纯净装机指南：避开流氓 PE 与捆绑陷阱
                </h4>
              </Link>
              <Link
                to="/tutorials/rufus-win11-bypass-tpm-guide"
                className="p-3.5 rounded-xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-all block group"
              >
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block mb-1">启动制作</span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1769D2] line-clamp-2">
                  使用 Rufus 制作绕过 TPM 2.0 与在线微软账户启动盘
                </h4>
              </Link>
              <Link
                to="/tutorials/ventoy-custom-multiboot-usb"
                className="p-3.5 rounded-xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-all block group"
              >
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block mb-1">多系统维护</span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1769D2] line-clamp-2">
                  Ventoy 进阶玩法：个性化主题定制与多系统启动菜单
                </h4>
              </Link>
              <Link
                to="/tutorials/how-to-verify-genuine-iso-checksums"
                className="p-3.5 rounded-xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-all block group"
              >
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block mb-1">安全核验</span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1769D2] line-clamp-2">
                  如何使用系统工具验证 Windows 与 Office 安装文件完整性
                </h4>
              </Link>
            </div>
          </section>

          {/* 专题板块 2：电脑故障排查与硬件健康检测 */}
          <section className="bg-slate-50 dark:bg-[#131C2E]/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-4 rounded bg-amber-500" />
                  <span>电脑故障排查与硬件健康检测专题</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  从固态硬盘寿命分析、自启流氓项地毯清理到强力无残留卸载。
                </p>
              </div>
              <button
                onClick={() => handleCategoryChange('troubleshoot')}
                className="text-xs font-semibold text-[#1769D2] hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                <span>查看排障分类全量指南</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/tutorials/crystaldiskinfo-smart-health-check"
                className="p-3.5 rounded-xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-all block group"
              >
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mb-1">磁盘检测</span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1769D2] line-clamp-2">
                  SSD 固态硬盘寿命与 S.M.A.R.T. 关键故障指标解读指南
                </h4>
              </Link>
              <Link
                to="/tutorials/sysinternals-autoruns-clean-startup"
                className="p-3.5 rounded-xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-all block group"
              >
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mb-1">开机加速</span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1769D2] line-clamp-2">
                  使用 Sysinternals Autoruns 地毯式清理 Windows 开机自启项
                </h4>
              </Link>
              <Link
                to="/tutorials/geek-uninstaller-clean-remnants"
                className="p-3.5 rounded-xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-all block group"
              >
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mb-1">强力卸载</span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1769D2] line-clamp-2">
                  使用 Geek Uninstaller 彻底卸载软件与残留文件/注册表清理
                </h4>
              </Link>
              <Link
                to="/tutorials/bleachbit-windows-deep-clean-privacy"
                className="p-3.5 rounded-xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-all block group"
              >
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mb-1">隐私清理</span>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1769D2] line-clamp-2">
                  BleachBit 开源深度清理实战：彻底清除软件残留与浏览器隐私
                </h4>
              </Link>
            </div>
          </section>
        </div>
      )}

      {/* 底部免责声明 */}
      <footer className="mt-14 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        <p>软游部落技术实操教程库 · 专注计算机系统维护、网络技术与办公生产力实操指导 · 遵循知识共享准则</p>
      </footer>
    </div>
  );
};
