import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  ChevronRight,
  Search,
  Clock,
  Eye,
  Calendar,
  Sparkles,
  ArrowRight,
  Download,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import { getTutorialsList } from '../services/resourceService';

const TUTORIAL_CATEGORIES = [
  { id: 'all', name: '全部实操教程' },
  { id: 'system', name: '系统运维与装机' },
  { id: 'office', name: '办公与效率技巧' },
  { id: 'troubleshoot', name: '故障诊断与排障' },
  { id: 'dev', name: '环境配置与编程' },
  { id: 'security', name: '安全防护与加密' },
];

export const TutorialsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const activeCat = searchParams.get('cat') || 'all';
  const searchQuery = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 12;

  useEffect(() => {
    document.title = '软件教程与电脑实用技巧库 - 官方纯净软件配置与排障实操 - 软游部落';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        '软游部落软件教程频道提供 Windows 原版装机、避开流氓 PE、Everything 语法、Wireshark 抓包、SSD 验机等深度实操图文教程与避坑指南。'
      );
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    getTutorialsList({
      page: currentPage,
      limit: pageSize,
    })
      .then((res) => {
        let items = res.items || [];
        // 本地分类过滤
        if (activeCat !== 'all') {
          items = items.filter((it: any) => {
            const text = `${it.title} ${it.summary}`.toLowerCase();
            if (activeCat === 'system') return text.includes('win') || text.includes('装机') || text.includes('系统') || text.includes('pe');
            if (activeCat === 'office') return text.includes('办公') || text.includes('搜索') || text.includes('everything') || text.includes('gif');
            if (activeCat === 'troubleshoot') return text.includes('故障') || text.includes('排障') || text.includes('卸载') || text.includes('修复');
            if (activeCat === 'dev') return text.includes('开发') || text.includes('代码') || text.includes('git') || text.includes('环境');
            if (activeCat === 'security') return text.includes('安全') || text.includes('加密') || text.includes('抓包') || text.includes('aes');
            return true;
          });
        }
        if (searchQuery) {
          items = items.filter((it: any) =>
            `${it.title} ${it.summary}`.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setTutorials(items);
        setTotalCount(res.total || items.length);
        setTotalPages(res.totalPages || Math.ceil(items.length / pageSize) || 1);
      })
      .catch((err) => {
        console.error('加载教程列表失败:', err);
        setTutorials([]);
      })
      .finally(() => setLoading(false));
  }, [activeCat, searchQuery, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.currentTarget as HTMLFormElement).elements.namedItem('q') as HTMLInputElement;
    const p = new URLSearchParams(searchParams);
    if (input.value.trim()) p.set('q', input.value.trim());
    else p.delete('q');
    p.delete('page');
    setSearchParams(p);
  };

  return (
    <div className="max-w-[1320px] mx-auto px-4 py-6">
      {/* 面包屑导航 */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-5">
        <Link to="/" className="hover:text-[#1769D2] transition-colors">首页</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 dark:text-slate-100 font-medium">软件教程</span>
      </nav>

      {/* 顶部标题横幅 */}
      <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-sky-900 to-indigo-900 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/20">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>工程师级实操经验 · 步骤详尽 · 真实避坑</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              软件教程与实用技巧中心
            </h1>
            <p className="mt-2 text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              拒绝水文与虚假套路。软游部落技术团队为您提供从原版纯净装机、高强度加密、网络排障到大文件检索的专业级保姆级教程。
            </p>
          </div>

          <form onSubmit={handleSearch} className="relative w-full md:w-72 shrink-0">
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="搜索软件教程或排障技巧..."
              className="w-full pl-9 pr-4 py-2 bg-white/10 text-white placeholder-slate-300 border border-white/20 rounded-xl text-xs focus:outline-none focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 transition-all"
            />
            <Search className="w-4 h-4 text-slate-300 absolute left-3 top-2.5" />
          </form>
        </div>
      </div>

      {/* 分类切换 Tab */}
      <div className="mb-6 flex flex-wrap items-center gap-2 bg-white dark:bg-[#131C2E] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        {TUTORIAL_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              const p = new URLSearchParams(searchParams);
              if (cat.id === 'all') p.delete('cat');
              else p.set('cat', cat.id);
              p.delete('page');
              setSearchParams(p);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCat === cat.id
                ? 'bg-[#1769D2] text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 教程列表卡片 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-56 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"
            />
          ))}
        </div>
      ) : tutorials.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-[#131C2E] rounded-2xl border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">暂无匹配的教程内容</p>
          <p className="text-xs text-slate-400 mt-1">请尝试更换检索关键词或选择全部教程。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tutorials.map((item) => (
            <article
              key={item.id}
              className="bg-white dark:bg-[#131C2E] rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
                  <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-[#1769D2] dark:text-blue-300 font-medium text-[11px]">
                    深度实操
                  </span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 5分钟
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {item.viewCount || 820}
                    </span>
                  </div>
                </div>

                <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-[#1769D2] transition-colors leading-snug">
                  <Link to={`/tutorials/${item.slug}`}>
                    {item.title}
                  </Link>
                </h2>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mt-2.5 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  软游技术组 · {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : '近期更新'}
                </span>
                <Link
                  to={`/tutorials/${item.slug}`}
                  className="inline-flex items-center gap-1 text-[#1769D2] hover:text-[#1258B5] font-semibold group-hover:translate-x-0.5 transition-transform"
                >
                  <span>阅读全文</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 分页控制 */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => {
              const p = new URLSearchParams(searchParams);
              p.set('page', String(currentPage - 1));
              setSearchParams(p);
            }}
            className="px-3.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131C2E] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
          >
            上一页
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400 px-2 font-mono">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => {
              const p = new URLSearchParams(searchParams);
              p.set('page', String(currentPage + 1));
              setSearchParams(p);
            }}
            className="px-3.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131C2E] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};
