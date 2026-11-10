import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Layers,
  ChevronRight,
  Search,
  Sparkles,
  ArrowRight,
  Package,
  CheckCircle2,
  Bookmark,
  Flame,
  Grid,
} from 'lucide-react';
import { getTopicsList } from '../services/resourceService';

const TOPIC_CATEGORIES = [
  { id: 'all', name: '全部软件专题' },
  { id: 'essential', name: '装机与必备' },
  { id: 'system', name: '系统维护与排障' },
  { id: 'office', name: '办公与生产力' },
  { id: 'media', name: '媒体影音与录屏' },
  { id: 'network', name: '网络运维与诊断' },
];

export const TopicsIndexPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const activeCategory = searchParams.get('cat') || 'all';
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    document.title = '软件专题合集中心 - 华军软件园架构精选专题大全 - 软游部落';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        '软游部落软件专题中心参考成熟软件门户架构，系统聚合装机必备、系统维护、开源办公、网络排障、录屏剪辑等29大深度软件专题与选型方案。'
      );
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    getTopicsList()
      .then((data) => {
        setTopics(data || []);
      })
      .catch((err) => {
        console.error('加载专题列表失败:', err);
        setTopics([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredTopics = topics.filter((t) => {
    if (activeCategory !== 'all') {
      const text = `${t.title} ${t.description || ''}`.toLowerCase();
      if (activeCategory === 'essential') return text.includes('装机') || text.includes('必备') || text.includes('win11');
      if (activeCategory === 'system') return text.includes('系统') || text.includes('硬盘') || text.includes('卸载') || text.includes('排障');
      if (activeCategory === 'office') return text.includes('办公') || text.includes('生产力') || text.includes('文档') || text.includes('远控');
      if (activeCategory === 'media') return text.includes('视频') || text.includes('录屏') || text.includes('剪辑') || text.includes('影音');
      if (activeCategory === 'network') return text.includes('网络') || text.includes('局域网') || text.includes('抓包') || text.includes('打印机');
    }
    if (searchQuery) {
      return `${t.title} ${t.description || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const featuredTopics = topics.filter((t) => t.isFeatured);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.currentTarget as HTMLFormElement).elements.namedItem('q') as HTMLInputElement;
    const p = new URLSearchParams(searchParams);
    if (input.value.trim()) p.set('q', input.value.trim());
    else p.delete('q');
    setSearchParams(p);
  };

  return (
    <div className="max-w-[1320px] mx-auto px-4 py-6">
      {/* 面包屑导航 */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-5">
        <Link to="/" className="hover:text-[#1769D2] transition-colors">首页</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 dark:text-slate-100 font-medium">软件专题中心</span>
      </nav>

      {/* 顶部标题横幅 (参考华军软件园 /zt/) */}
      <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/20">
              <Grid className="w-3.5 h-3.5 text-blue-400" />
              <span>成熟软件门户架构 · 场景聚合 · 深度选型合集</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              软件专题聚合中心
            </h1>
            <p className="mt-2 text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              针对不同办公场景、维护痛点与系统环境，由资深编辑精编的软件合辑。系统化整理同类工具优劣，助您一次性配齐所需神器。
            </p>
          </div>

          <form onSubmit={handleSearch} className="relative w-full md:w-72 shrink-0">
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="搜索软件专题合集..."
              className="w-full pl-9 pr-4 py-2 bg-white/10 text-white placeholder-slate-300 border border-white/20 rounded-xl text-xs focus:outline-none focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 transition-all"
            />
            <Search className="w-4 h-4 text-slate-300 absolute left-3 top-2.5" />
          </form>
        </div>
      </div>

      {/* 精选推荐专题横幅 */}
      {featuredTopics.length > 0 && activeCategory === 'all' && !searchQuery && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3.5 px-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">热门精编专题推荐</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredTopics.slice(0, 3).map((f) => (
              <Link
                key={f.id}
                to={`/topics/${f.slug}`}
                className="group p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-900 dark:to-blue-950/40 border border-blue-100 dark:border-slate-800 hover:border-[#1769D2] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1769D2] text-white font-semibold">
                      编辑精选
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      收录 {f._count?.resources || 0} 款
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#1769D2] transition-colors line-clamp-1">
                    {f.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                    {f.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-blue-100/80 dark:border-slate-800 flex items-center justify-between text-xs text-[#1769D2] font-semibold">
                  <span>查看专题方案</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 分类切换 Tab */}
      <div className="mb-6 flex flex-wrap items-center gap-2 bg-white dark:bg-[#131C2E] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        {TOPIC_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              const p = new URLSearchParams(searchParams);
              if (cat.id === 'all') p.delete('cat');
              else p.set('cat', cat.id);
              setSearchParams(p);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-[#1769D2] text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 专题列表头部统计 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          共找到相关软件专题 <strong className="text-slate-800 dark:text-slate-200">{filteredTopics.length}</strong> 个
        </span>
      </div>

      {/* 专题卡片网格 */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-44 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"
            />
          ))}
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-[#131C2E] rounded-2xl border border-slate-200 dark:border-slate-800">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">未找到符合该分类的专题</p>
          <p className="text-xs text-slate-400 mt-1">请尝试切换分类或重置搜索词。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTopics.map((topic) => (
            <Link
              key={topic.id}
              to={`/topics/${topic.slug}`}
              className="group bg-white dark:bg-[#131C2E] rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#1769D2] flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    {topic.isFeatured && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-300 font-semibold">
                        精选
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    收录 {topic._count?.resources || 0} 款
                  </span>
                </div>

                <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white group-hover:text-[#1769D2] transition-colors line-clamp-1">
                  {topic.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed min-h-[34px]">
                  {topic.description || '精心筛选整理的纯净软件合集。'}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 group-hover:text-[#1769D2]">
                <span className="text-[11px] text-slate-400">已核验原厂来源</span>
                <span className="font-semibold flex items-center gap-1">
                  <span>浏览专题软件</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
