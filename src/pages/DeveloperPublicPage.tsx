import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Github,
  Globe,
  Package,
  Layers,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { getPublicDeveloperProfile } from '../services/developerService';

export const DeveloperPublicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [developer, setDeveloper] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    getPublicDeveloperProfile(slug)
      .then((res) => {
        if (res.success && res.data) {
          setDeveloper(res.data);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 py-24 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#1769D2] mb-3" />
        <span className="text-xs">加载开发者公开主页...</span>
      </div>
    );
  }

  if (notFound || !developer) {
    return (
      <div className="max-w-[600px] mx-auto px-4 py-24 text-center">
        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-lg font-bold mb-2">未找到该认证开发者</h1>
        <p className="text-xs text-slate-500 mb-6">该开发者可能尚未完成官方归属核验或未对外公开。</p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#1769D2] hover:bg-[#1258B5] text-white rounded-md text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回软游部落首页</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-10">
      {/* 开发者个人资料卡片 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
              {developer.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {developer.displayName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-[#1769D2] dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40 rounded-full text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>软游部落认证作者</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {developer.organizationName ? `${developer.organizationName} · ` : ''}官方项目归属已核验 · 认证于 {developer.verifiedAt ? new Date(developer.verifiedAt).toLocaleDateString() : '2026年'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {developer.website && (
              <a
                href={developer.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>官方网站</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
            {developer.githubUsername && (
              <a
                href={`https://github.com/${developer.githubUsername}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold transition-all"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
            )}
          </div>
        </div>

        {/* 简介 */}
        {developer.bio && (
          <div className="pt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {developer.bio}
          </div>
        )}
      </div>

      {/* 认领已认证软件列表 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              已认证维护的软件与工具 ({developer.verifiedSoftware?.length || 0})
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {developer.verifiedSoftware && developer.verifiedSoftware.length > 0 ? (
            developer.verifiedSoftware.map((sw: any) => (
              <Link
                key={sw.id}
                to={`/software/${sw.slug}`}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-blue-500/50 hover:shadow-md transition-all flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  {sw.iconUrl ? (
                    <img src={sw.iconUrl} alt={sw.name} className="w-7 h-7 object-contain" />
                  ) : (
                    <Package className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    {sw.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{sw.summary}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px]">
                    <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded">
                      {sw.category?.name || '软件'}
                    </span>
                    <span className="text-emerald-600 font-semibold">官方直链核验</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-8 col-span-full text-center">该开发者暂未认领公开软件</p>
          )}
        </div>
      </div>
    </div>
  );
};
