import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen,
  ChevronRight,
  Clock,
  Eye,
  Calendar,
  Share2,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Laptop,
  AlertTriangle,
  FileCheck2,
} from 'lucide-react';
import {
  fetchTutorialDetail,
  TutorialDetailData,
} from '../services/tutorialService';
import { TutorialPreflight } from '../components/tutorials/TutorialPreflight';
import { TutorialRiskBanner } from '../components/tutorials/TutorialRiskBanner';
import { TutorialMarkdownRenderer } from '../components/tutorials/TutorialMarkdownRenderer';
import { TutorialTOC } from '../components/tutorials/TutorialTOC';
import { RelatedSoftwareCard } from '../components/tutorials/RelatedSoftwareCard';
import { RelatedTutorials } from '../components/tutorials/RelatedTutorials';

export const TutorialDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [tutorial, setTutorial] = useState<TutorialDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // 滚动监听阅读进度百分比
  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (window.scrollY / total) * 100)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 加载教程详情
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    fetchTutorialDetail(slug)
      .then((data) => {
        setTutorial(data);
        document.title = `${data.seoTitle || data.title} - 电脑软件与系统实操技术指南 - 软游部落`;

        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', data.seoDescription || data.summary);

        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
          canonical = document.createElement('link');
          canonical.setAttribute('rel', 'canonical');
          document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', `https://softtribe.top/tutorials/${data.slug}`);
      })
      .catch((err) => {
        console.error('加载教程详情失败:', err);
        setError('未找到该教程或已归档下线。');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-12">
        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
            <div className="h-6 w-3/4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse mt-6" />
            <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !tutorial) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-24 text-center">
        <BookOpen className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          教程未找到或已下线
        </h1>
        <p className="text-xs text-slate-400 mt-2 mb-6 max-w-sm mx-auto">
          {error || '您访问的技术教程可能已被重新归档或 URL 标识已变更。'}
        </p>
        <Link
          to="/tutorials"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1769D2] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回软件教程频道</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      {/* 顶部悬浮阅读进度条 */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-sky-500 z-50 transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        {/* 面包屑导航 */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-5">
          <Link to="/" className="hover:text-[#1769D2] transition-colors">软游部落首页</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/tutorials" className="hover:text-[#1769D2] transition-colors">软件教程</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 dark:text-slate-100 font-semibold truncate max-w-xs sm:max-w-md">
            {tutorial.title}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 主文章阅读区（8 列） */}
          <article className="lg:col-span-8 bg-white dark:bg-[#131C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-9 shadow-2xs">
            {/* 文章头部元数据 */}
            <header className="pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-[#1769D2] dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-900">
                  <Sparkles className="w-3 h-3" />
                  <span>{tutorial.categoryName}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
                  {tutorial.difficultyLabel}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs">
                  <Laptop className="w-3 h-3" />
                  <span>{tutorial.platform}</span>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {tutorial.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-400">
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  软游部落技术专家组
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  发布：{tutorial.publishedAt ? new Date(tutorial.publishedAt).toLocaleDateString() : '近期更新'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-500" />
                  最后复核：{new Date(tutorial.updatedAt).toLocaleDateString()}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  预计用时：约 {tutorial.readingMinutes} 分钟
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {tutorial.viewCount} 次阅读
                </span>
              </div>
            </header>

            {/* 核心导读摘要框 */}
            {tutorial.summary && (
              <div className="my-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 border-l-4 border-[#1769D2] text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed shadow-2xs">
                <strong className="text-[#1769D2] dark:text-blue-400 font-bold block mb-1">
                  实操导读与目标：
                </strong>
                {tutorial.summary}
              </div>
            )}

            {/* 高风险警告横幅（若操作涉及格式化/引导/分区/注册表） */}
            <TutorialRiskBanner
              isHighRisk={tutorial.isHighRisk}
              category={tutorial.category}
            />

            {/* 操作前检查清单（可勾选自检） */}
            <TutorialPreflight checklist={tutorial.preflightChecklist} />

            {/* 移动端目录折叠条 */}
            <TutorialTOC headings={tutorial.headings} variant="mobile" />

            {/* 核心正文：完整 Markdown 解析渲染 */}
            <div className="mt-8 pt-4">
              <TutorialMarkdownRenderer content={tutorial.content} />
            </div>

            {/* 版本适用性与环境提示 */}
            <div className="mt-10 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>实操复核声明</span>
              </div>
              <p className="leading-relaxed">
                本文已在 <strong>{tutorial.platform}</strong> 真实测试环境完成实操复核。如果后续软件发布大版本更新或微软调整了系统设置菜单位置，界面可能存在细微差异。如发现任何失效命令或步骤疑问，欢迎通过下方正版渠道核实最新文档。
              </p>
            </div>

            {/* 底部版权与免责 */}
            <footer className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <span>本文由软游部落技术团队原创编制 · 遵循知识共享 CC-BY-NC-SA 4.0 规范</span>
              <Link to="/tutorials" className="text-[#1769D2] hover:underline font-semibold flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>返回软件教程首页</span>
              </Link>
            </footer>

            {/* 上下篇切换与同类推荐 */}
            <div className="mt-8">
              <RelatedTutorials
                relatedTutorials={tutorial.relatedTutorials}
                prevTutorial={tutorial.prevTutorial}
                nextTutorial={tutorial.nextTutorial}
              />
            </div>
          </article>

          {/* 右侧边栏：关联软件下载卡片 + 目录导航 + 更多推荐（4 列） */}
          <aside className="lg:col-span-4 space-y-6">
            {/* P8.8 关联正版软件下载卡片 */}
            <RelatedSoftwareCard software={tutorial.software} />

            {/* 桌面端目录导航（吸顶显示） */}
            <div className="hidden lg:block">
              <TutorialTOC headings={tutorial.headings} variant="desktop" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
