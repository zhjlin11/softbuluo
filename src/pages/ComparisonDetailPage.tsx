import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Scale,
  ChevronRight,
  Eye,
  CheckCircle2,
  Sparkles,
  Download,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { GrowthService, ComparisonItem } from '../services/growthService';
import { SoftwareIcon } from '../components/common/SoftwareIcon';

export const ComparisonDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [comparison, setComparison] = useState<ComparisonItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);

    // 页面浏览量上报
    GrowthService.collectPageView(window.location.pathname, 'COMPARISON_DETAIL', document.referrer);

    GrowthService.getComparisonDetail(slug)
      .then((res) => {
        if (res.success && res.data) {
          setComparison(res.data);
          document.title = `${res.data.title} - 软游部落`;
        } else {
          setError(res.error || '未找到该对比评测');
        }
      })
      .catch((err) => {
        setError(err.message || '网络加载失败');
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-12">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-6" />
        <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse mb-8" />
        <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">对比评测不存在或已下架</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{error || '抱歉，您访问的软件对比评测未能找到。'}</p>
        <Link
          to="/compare"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          返回对比列表
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 py-8">
      {/* 面包屑导航 */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6">
        <Link to="/" className="hover:text-blue-600">首页</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/compare" className="hover:text-blue-600">软件横向评测</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 dark:text-slate-100 font-medium truncate max-w-xs md:max-w-md">
          {comparison.title}
        </span>
      </nav>

      {/* 头部摘要 */}
      <header className="mb-8 p-6 md:p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              深度参数评测
            </span>
            <span className="text-xs text-slate-400">
              发布于 {comparison.publishedAt ? new Date(comparison.publishedAt).toLocaleDateString() : '近期'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Eye className="w-3.5 h-3.5" />
            <span>{comparison.viewCount} 次客观查阅</span>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {comparison.title}
        </h1>

        <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border-l-4 border-blue-600 text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
          <strong className="text-slate-900 dark:text-white">评测导读：</strong>
          {comparison.summary}
        </div>
      </header>

      {/* 对比软件卡片栏 */}
      <section className="mb-8">
        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(comparison.items.length, 3)} gap-6`}>
          {comparison.items.map((it) => (
            <div
              key={it.id}
              className={`relative p-5 rounded-xl bg-white dark:bg-slate-900 border transition-all ${
                it.isRecommended
                  ? 'border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/10 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 shadow-sm'
              }`}
            >
              {it.isRecommended && (
                <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" /> 编辑推荐
                </div>
              )}

              <div className="flex items-center gap-3.5 mb-3">
                <SoftwareIcon
                  iconUrl={it.software.iconUrl}
                  name={it.software.name}
                  slug={it.software.slug}
                  size="lg"
                />
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {it.software.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {it.software.developer || '知名软件开发商'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[36px] mb-4">
                {it.editorNotes || '该软件具备成熟的工作流支持与广泛的用户群体。'}
              </p>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {it.software.licenseType || '官方正版'}
                </span>

                <Link
                  to={`/software/${it.software.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  查看详情与下载
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 核心横向参数矩阵表格 */}
      <section className="mb-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            核心功能与性能矩阵横向对比
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 w-44 font-semibold text-slate-700 dark:text-slate-300">对比维度</th>
                {comparison.items.map((it) => (
                  <th key={it.id} className="p-4 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span>{it.software.name}</span>
                      {it.isRecommended && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded">
                          首选
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {comparison.attributes && comparison.attributes.length > 0 ? (
                comparison.attributes.map((attr) => (
                  <tr
                    key={attr.id}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                      attr.isHighlighted ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span>{attr.attributeName}</span>
                        {attr.isHighlighted && (
                          <span className="text-amber-500 text-xs" title="核心差异维度">★</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-normal">
                        {attr.evidenceStatus === 'OFFICIAL_DOCUMENTATION' && (
                          <span className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-[10px]" title={attr.sourceUrl || '官方文档记录'}>
                            官方文档
                          </span>
                        )}
                        {attr.evidenceStatus === 'MEASURED' && (
                          <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded text-[10px]" title={attr.testEnvironment || '基准实验室实测'}>
                            实测数据
                          </span>
                        )}
                        {attr.evidenceStatus === 'EDITORIAL_JUDGMENT' && (
                          <span className="inline-flex items-center gap-0.5 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded text-[10px]" title="软游编辑部综合体验评估">
                            编辑评测
                          </span>
                        )}
                        {(!attr.evidenceStatus || attr.evidenceStatus === 'UNVERIFIED') && (
                          <span className="inline-flex items-center gap-0.5 text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                            未实测
                          </span>
                        )}
                      </div>
                    </td>
                    {comparison.items.map((it) => {
                      const val = attr.values[it.softwareId] || '—';
                      return (
                        <td key={it.id} className="p-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={comparison.items.length + 1} className="p-8 text-center text-slate-400">
                    暂未配置具体属性参数
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 适合人群与场景建议 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">适合人群分析</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {comparison.targetAudience || '适合注重操作响应效率与功能完备度的技术人员及日常进阶办公用户。'}
          </p>
        </div>

        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">典型工作流与场景建议</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {comparison.scenarioGuide || '根据硬件配置高低、是否需要复杂第三方生态协同以及系统便携性按需配置。'}
          </p>
        </div>
      </section>

      {/* 编辑综合选型建议 */}
      <section className="p-6 md:p-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-3">
          <Sparkles className="w-6 h-6 text-amber-300" />
          编辑综合选型与安装建议
        </h3>
        <p className="text-blue-50 text-sm md:text-base leading-relaxed mb-6 whitespace-pre-line">
          {comparison.conclusion}
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-blue-400/30">
          {comparison.items.map((it) => (
            <Link
              key={it.id}
              to={`/software/${it.software.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-blue-700 font-semibold text-xs hover:bg-blue-50 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              获取 {it.software.name} 官方正版入口
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
