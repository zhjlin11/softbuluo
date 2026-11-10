import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Eye, ChevronRight, Sparkles, SplitSquareVertical } from 'lucide-react';
import { FeaturedComparisonArticle } from '../../services/compareService';
import { SoftwareIcon } from '../common/SoftwareIcon';

interface CompareFeaturedArticlesProps {
  articles: FeaturedComparisonArticle[];
  onSelectPair: (leftSlug: string, rightSlug: string) => void;
  onScrollToMatrix: () => void;
}

export const CompareFeaturedArticles: React.FC<CompareFeaturedArticlesProps> = ({
  articles,
  onSelectPair,
  onScrollToMatrix,
}) => {
  if (!articles || articles.length === 0) return null;

  return (
    <section id="featured-articles" className="mb-14 scroll-mt-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>真实测试数据 · 深度万字长文</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            精选软件横向深度评测长文
          </h2>
          <p className="mt-1 text-xs md:text-sm text-slate-600 dark:text-slate-400">
            涵盖实机跑分、冷热启动耗时、大文件压力测试与二要素安全攻防实录。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((art) => {
          const leftItem = art.items[0];
          const rightItem = art.items[1];

          return (
            <article
              key={art.id}
              className="flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
            >
              <div>
                {/* 顶部对决软件图标栏 */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    {art.items.map((it, idx) => (
                      <React.Fragment key={it.slug}>
                        {idx > 0 && (
                          <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase px-1">
                            vs
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <SoftwareIcon
                            iconUrl={it.iconUrl}
                            name={it.name}
                            slug={it.slug}
                            size="md"
                          />
                          <span className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {it.name}
                          </span>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{art.viewCount} 次阅读</span>
                  </div>
                </div>

                {/* 标题 */}
                <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                  <Link to={`/compare/${art.slug}`}>{art.title}</Link>
                </h3>

                {/* 摘要导读 */}
                <p className="mt-2.5 text-xs md:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {art.summary}
                </p>

                {/* 核心结论摘要 */}
                {art.conclusion && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white font-medium">结论导读：</strong>{' '}
                    <span className="line-clamp-2">{art.conclusion}</span>
                  </div>
                )}
              </div>

              {/* 底部信息与操作按钮 */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/50">
                    <Sparkles className="w-3 h-3" /> 编辑部精选实测
                  </span>
                  <span className="text-xs text-slate-400">
                    {art.publishedAt ? new Date(art.publishedAt).toLocaleDateString() : '近期'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {leftItem && rightItem && (
                    <button
                      onClick={() => {
                        onSelectPair(leftItem.slug, rightItem.slug);
                        onScrollToMatrix();
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      title="载入交互式对比矩阵"
                    >
                      <SplitSquareVertical className="w-3.5 h-3.5" />
                      <span>载入矩阵</span>
                    </button>
                  )}

                  <Link
                    to={`/compare/${art.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>阅读完整长文</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
