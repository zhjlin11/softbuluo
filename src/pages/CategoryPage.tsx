import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Download,
  Calendar,
  Loader2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { SoftwareIcon } from '../components/common/SoftwareIcon';
import { getSimpleSoftwareName, getSimpleVersion } from '../utils/softwareName';
import { setPageSeo } from '../utils/seo';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    // 同时获取分类元数据与对应软件列表
    fetch(`/api/v1/categories`)
      .then((r) => r.json())
      .then((catRes) => {
        if (catRes.success && catRes.data) {
          const matched = catRes.data.find((c: any) => c.slug === slug);
          if (matched) setCategory(matched);
        }
      })
      .catch(console.error);

    fetch(`/api/v1/resources?category=${slug}&page=${page}&limit=32`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setItems(res.data.items || []);
          setTotal(res.data.total || 0);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [slug, page]);

  useEffect(() => {
    if (category) {
      setPageSeo({
        title: `${category.name}软件下载与工具精选 - 软游部落`,
        description: category.description || `软游部落${category.name}软件与工具合集，提供官方纯净下载与版本指引。`,
        path: `/category/${slug}`,
      });
    } else if (slug) {
      setPageSeo({
        title: `分类软件列表 - 软游部落`,
        description: '软游部落分类软件与工具精选列表',
        path: `/category/${slug}`,
      });
    }
  }, [category, slug]);

  return (
    <div className="max-w-[1320px] mx-auto px-4 py-8">
      {/* 面包屑导航 */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6">
        <Link to="/" className="hover:text-blue-600">首页</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 dark:text-slate-100 font-medium">
          {category?.name || slug} 软件库
        </span>
      </nav>

      {/* 分类顶部横幅 */}
      <div className="bg-white dark:bg-[#161F30] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold text-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {category?.name || '实用分类'} 软件大全
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {category?.description || '收录经过官方来源安全核验的正规软件与绿色工具，无捆绑无劫持。'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4">
          <span>收录总数：<strong className="text-slate-700 dark:text-slate-200">{total}</strong> 款</span>
          <span>·</span>
          <span className="flex items-center gap-1 text-emerald-600">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% 官方正版核验
          </span>
        </div>
      </div>

      {/* 软件列表网格 */}
      {isLoading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <span className="text-xs">加载分类资源中...</span>
        </div>
      ) : items.length > 0 ? (
        <div>
          {/* 8 列高密度 App 网格 · 纯净软件名 · 紧凑间距 */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-1.5 sm:gap-2">
            {items.map((item) => {
              const simpleName = getSimpleSoftwareName(item.name, item.englishName);
              return (
                <Link
                  key={item.id}
                  to={`/software/${item.slug}`}
                  title={item.name}
                  className="group bg-white dark:bg-[#161F30] border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/60 rounded-lg p-2 transition-all duration-200 hover:shadow-xs flex flex-col items-center justify-between text-center"
                >
                  <div className="flex flex-col items-center w-full">
                    <div className="mb-1 flex items-center justify-center">
                      <SoftwareIcon
                        name={item.name}
                        iconUrl={item.iconUrl}
                        slug={item.slug}
                        categorySlug={item.categorySlug}
                        size="lg"
                        className="group-hover:scale-106 transition-transform"
                      />
                    </div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors truncate w-full">
                      {simpleName}
                    </h3>
                    <div className="text-[10px] font-mono text-[#1769D2] dark:text-blue-400 mt-0.5 tabular-nums">
                      {getSimpleVersion(item.version) || '最新版'}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* 分页控制 */}
          {total > 32 && (
            <div className="mt-8 flex justify-center items-center gap-3 text-xs">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 cursor-pointer"
              >
                上一页
              </button>
              <span className="text-slate-500">
                第 {page} / {Math.ceil(total / 32)} 页
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / 32)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 cursor-pointer"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 rounded-xl p-16 text-center text-slate-400 text-xs">
          当前分类下暂无已发布资源，敬请期待后续更新。
        </div>
      )}
    </div>
  );
};
