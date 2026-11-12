import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Bookmark,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { SoftwareIcon } from '../components/common/SoftwareIcon';
import { setPageSeo } from '../utils/seo';

export const TopicDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [topic, setTopic] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    fetch(`/api/v1/topics/${slug}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setTopic(res.data);
          setPageSeo({
            title: `${res.data.title} - 精选专题 - 软游部落`,
            description: res.data.description || '软游部落精选装机与系统维护专题',
            path: `/topics/${slug}`,
            ogType: 'article',
          });
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <span className="text-xs">加载专题内容中...</span>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 py-16 text-center text-slate-400">
        <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">精选专题未找到</h2>
        <p className="text-xs mb-4">该专题可能已被归档或尚未正式发布</p>
        <Link to="/" className="text-xs text-blue-600 hover:underline">返回首页</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 py-8">
      {/* 面包屑 */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6">
        <Link to="/" className="hover:text-blue-600">首页</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 dark:text-slate-100 font-medium">{topic.title}</span>
      </nav>

      {/* 专题顶部横幅 */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-8 sm:p-12 mb-8 shadow-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-200 uppercase tracking-wider mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          软游部落编辑部精选专题
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold mb-4 leading-tight">
          {topic.title}
        </h1>
        <p className="text-slate-200 text-sm sm:text-base max-w-3xl leading-relaxed">
          {topic.description}
        </p>
      </div>

      {/* 收录软件资源卡片 */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-blue-600" />
          专题收录清单 ({topic.resources?.length || 0} 款)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topic.resources?.map((tr: any) => {
            const sw = tr.software;
            if (!sw) return null;
            return (
              <div
                key={tr.id}
                className="bg-white dark:bg-[#161F30] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-3">
                    <SoftwareIcon
                      name={sw.name}
                      iconUrl={sw.iconUrl}
                      slug={sw.slug}
                      categorySlug={sw.categorySlug}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {sw.name}
                        </h3>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-mono">
                          v{sw.version || '最新版'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{sw.developer || '官方开发者'}</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3 line-clamp-1">
                    {sw.summary}
                  </p>

                  {tr.customNote && (
                    <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-300 text-xs mb-3">
                      <strong>编辑推荐理由：</strong>{tr.customNote}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-emerald-600 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" /> 官方来源核验
                  </span>
                  <Link
                    to={`/software/${sw.slug}`}
                    className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    查看详情与下载 <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
