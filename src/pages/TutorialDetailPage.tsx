import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen,
  ChevronRight,
  Clock,
  Eye,
  Calendar,
  Share2,
  Bookmark,
  CheckCircle2,
  ArrowLeft,
  Download,
  AlertTriangle,
  FileText,
  Sparkles,
} from 'lucide-react';
import { getTutorialBySlug } from '../services/resourceService';
import { SoftwareIcon } from '../components/common/SoftwareIcon';

export const TutorialDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [tutorial, setTutorial] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // 滚动监听阅读进度条
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

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    getTutorialBySlug(slug)
      .then((data) => {
        setTutorial(data);
        document.title = `${data.title} - 软件实操教程 - 软游部落`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute('content', data.summary || data.title);
        }
      })
      .catch((err) => {
        console.error('加载教程详情失败:', err);
        setError('未找到该教程或尚未公开。');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 py-16">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mb-4" />
        <div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-8" />
        <div className="space-y-4">
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !tutorial) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-20 text-center">
        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">教程未找到</h1>
        <p className="text-xs text-slate-400 mt-1 mb-6">{error || '该教程可能已被下线或重新归档。'}</p>
        <Link
          to="/tutorials"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1769D2] text-white rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回教程列表</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 顶部阅读进度条 */}
      <div
        className="fixed top-0 left-0 h-1 bg-[#1769D2] z-50 transition-all duration-100"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="max-w-[1100px] mx-auto px-4 py-6">
        {/* 面包屑导航 */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-5">
          <Link to="/" className="hover:text-[#1769D2] transition-colors">首页</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/tutorials" className="hover:text-[#1769D2] transition-colors">软件教程</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 dark:text-slate-100 font-medium truncate max-w-xs">
            {tutorial.title}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 主体文章区域 */}
          <article className="lg:col-span-8 bg-white dark:bg-[#131C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xs">
            <header className="pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-[#1769D2] dark:text-blue-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>实操指导 · 避坑指引</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {tutorial.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-400">
                <span className="text-slate-600 dark:text-slate-300 font-medium">软游技术专家组</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {tutorial.publishedAt ? new Date(tutorial.publishedAt).toLocaleDateString() : '近期更新'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {tutorial.viewCount || 1024} 次阅读
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 人工步骤校验
                </span>
              </div>
            </header>

            {/* 摘要引言框 */}
            {tutorial.summary && (
              <div className="my-6 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border-l-4 border-[#1769D2] text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>核心导读：</strong>{tutorial.summary}
              </div>
            )}

            {/* 核心教程正文 */}
            <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-[#1769D2] text-white flex items-center justify-center text-xs font-bold">1</span>
                  <span>准备工作与环境核验</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                  在开始操作前，请务必确认当前操作系统已安装最新的安全补丁。建议提前将重要数据备份至外接移动硬盘或云盘，避免因操作失误造成不可逆的数据丢失。
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  验证环境：Windows 10 / 11 64位操作系统 | 管理员权限终端
                </div>
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-[#1769D2] text-white flex items-center justify-center text-xs font-bold">2</span>
                  <span>步骤详解与参数配置</span>
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                  下载并校验官方原厂安装包哈希值。进入软件主界面后，重点配置以下核心参数，关闭非必要的后台遥测与自动更新弹窗，确保软件在后台以最低资源占用稳定运行：
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
                  <li>在安装向导中，建议将安装路径设置在非系统盘（例如 D:\Program Files\）。</li>
                  <li>勾选“创建桌面快捷方式”，并取消勾选任何附加的推广或第三方输入法插件。</li>
                  <li>初次启动时，进入设置页面将语言首选项调整为“简体中文”，并启用高 DPI 缩放优化。</li>
                </ul>
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-[#1769D2] text-white flex items-center justify-center text-xs font-bold">3</span>
                  <span>常见故障排除与避坑指南</span>
                </h2>
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                    <strong>安全排障提示：</strong>如果运行过程中出现权限不足或缺少 .NET / VC++ 运行库报错，请切勿从网盘随意下载第三方 dll 替换，应直接前往微软官方支持库下载正版合集安装包。
                  </div>
                </div>
              </div>

              {/* 原始 content 内容 */}
              {tutorial.content && tutorial.content.length > 20 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                    {tutorial.content}
                  </p>
                </div>
              )}
            </div>

            {/* 底部版权与免责 */}
            <footer className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <span>本文由软游部落技术团队原创编写，遵循开源知识共享协议。</span>
              <Link to="/tutorials" className="text-[#1769D2] hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>返回更多教程</span>
              </Link>
            </footer>
          </article>

          {/* 侧边栏：关联软件下载卡片与导航 */}
          <aside className="lg:col-span-4 space-y-6">
            {/* 关联软件下载卡片 */}
            {tutorial.software && (
              <div className="bg-white dark:bg-[#131C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  本教程涉及软件
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <SoftwareIcon
                    iconUrl={tutorial.software.iconUrl}
                    name={tutorial.software.name}
                    slug={tutorial.software.slug}
                    size="md"
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {tutorial.software.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">
                      {tutorial.software.developer || '官方出品'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  通过软游部落官方通道获取正版原厂安装包，支持原厂 SHA-256 哈希比对。
                </p>

                <Link
                  to={`/software/${tutorial.software.slug}`}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#1769D2] hover:bg-[#1258B5] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>获取官方安装包</span>
                </Link>
              </div>
            )}

            {/* 快捷目录卡片 */}
            <div className="bg-white dark:bg-[#131C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#1769D2]" />
                <span>教程导航</span>
              </h3>
              <ul className="space-y-2 text-xs">
                <li className="text-[#1769D2] font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1769D2]" />
                  <span>1. 准备工作与环境核验</span>
                </li>
                <li className="text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span>2. 步骤详解与参数配置</span>
                </li>
                <li className="text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span>3. 常见故障排除与避坑指南</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
