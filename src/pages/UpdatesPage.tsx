import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  History,
  ChevronRight,
  Download,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Laptop,
  CheckCircle2,
  FileCode2,
  ArrowRight,
  Clock,
  PackagePlus,
  SlidersHorizontal,
} from 'lucide-react';
import { getVersionUpdatesList, getResourcesList } from '../services/resourceService';
import { SoftwareIcon } from '../components/common/SoftwareIcon';

export const UpdatesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'versions' | 'cataloged'>('versions');
  const [versionUpdates, setVersionUpdates] = useState<any[]>([]);
  const [newlyCataloged, setNewlyCataloged] = useState<any[]>([]);
  const [totalVersions, setTotalVersions] = useState(0);
  const [loading, setLoading] = useState(true);

  const activePlatform = searchParams.get('platform') || 'all';

  useEffect(() => {
    document.title = '最新版本更新日志与动态 - 软件官方版本升级与新版发布 - 软游部落';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        '软游部落最新更新频道严格区分新收录软件与软件版本升级日志，第一时间呈现 Visual Studio Code, Chrome, 7-Zip, PotPlayer 等桌面软件的官方新版 Changelog 与安全补丁。'
      );
    }
  }, []);

  // 加载版本升级流水
  useEffect(() => {
    setLoading(true);
    if (activeTab === 'versions') {
      getVersionUpdatesList({
        limit: 30,
        platform: activePlatform,
      })
        .then((res) => {
          setVersionUpdates(res.items || []);
          setTotalVersions(res.total || 0);
        })
        .catch((err) => {
          console.error('加载版本流水失败:', err);
          setVersionUpdates([]);
        })
        .finally(() => setLoading(false));
    } else {
      getResourcesList({
        sort: 'latest',
        platform: activePlatform,
        limit: 30,
      })
        .then((res) => {
          setNewlyCataloged(res.items || []);
        })
        .catch((err) => {
          console.error('加载新收录软件失败:', err);
          setNewlyCataloged([]);
        })
        .finally(() => setLoading(false));
    }
  }, [activeTab, activePlatform]);

  const updatePlatform = (p: string) => {
    const params = new URLSearchParams(searchParams);
    if (p === 'all') params.delete('platform');
    else params.set('platform', p);
    setSearchParams(params);
  };

  return (
    <div className="max-w-[1320px] mx-auto px-4 py-6">
      {/* 面包屑导航 */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-5">
        <Link to="/" className="hover:text-[#1769D2] transition-colors">首页</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 dark:text-slate-100 font-medium">最新更新动态</span>
      </nav>

      {/* 顶部标题横幅 */}
      <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/20">
              <History className="w-3.5 h-3.5 text-blue-400" />
              <span>版本更新日志 · 严格区分收录与发版 · 原厂直达</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              软件版本更新与发布动态
            </h1>
            <p className="mt-2 text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              实时追踪主流桌面软件的官方新版本迭代、功能特性、CVE 漏洞安全补丁与更新日志 (Changelog)，支持原厂安全哈希比对。
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs text-blue-200 bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>全库累计监测 <strong>{totalVersions || 68}</strong> 次版本演进</span>
            </span>
          </div>
        </div>
      </div>

      {/* 核心双重视角 Tab 切换：严格区分版本更新与新收录 */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#131C2E] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('versions')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'versions'
                ? 'bg-[#1769D2] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>版本更新动态 (Changelog)</span>
          </button>
          <button
            onClick={() => setActiveTab('cataloged')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'cataloged'
                ? 'bg-[#1769D2] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>最新收录入库 (Newly Added)</span>
          </button>
        </div>

        {/* 操作系统平台过滤 */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">平台:</span>
          {[
            { label: '全部', value: 'all' },
            { label: 'Windows', value: 'windows' },
            { label: 'macOS', value: 'macos' },
            { label: 'Linux', value: 'linux' },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => updatePlatform(p.value)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activePlatform === p.value
                  ? 'bg-blue-50 dark:bg-blue-950 text-[#1769D2] font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 列表渲染 */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"
            />
          ))}
        </div>
      ) : activeTab === 'versions' ? (
        /* 视角 1: 软件版本更新时间线 */
        <div className="space-y-3.5">
          {versionUpdates.length === 0 ? (
            <div className="py-20 text-center bg-white dark:bg-[#131C2E] rounded-xl border border-slate-200 dark:border-slate-800">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">暂无相关版本更新数据</p>
            </div>
          ) : (
            versionUpdates.map((item) => (
              <div
                key={item.versionId}
                className="bg-white dark:bg-[#131C2E] rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  <SoftwareIcon
                    iconUrl={item.software.iconUrl}
                    name={item.software.name}
                    slug={item.software.slug}
                    categorySlug={item.software.categorySlug}
                    size="md"
                    className="shrink-0 mt-0.5"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        <Link to={`/software/${item.software.slug}`} className="hover:text-[#1769D2] hover:underline">
                          {item.software.name}
                        </Link>
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#1769D2] dark:text-blue-300 font-mono font-bold">
                        v{item.version}
                      </span>
                      {item.isLatest && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
                          最新稳定版
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono">
                        {item.platform}
                      </span>
                    </div>

                    {/* 更新日志 */}
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      <strong className="text-slate-800 dark:text-slate-200">更新日志：</strong>
                      {item.changelog}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-400">
                      <span>发布日期：<strong className="text-slate-600 dark:text-slate-300 font-mono">{item.releaseDate}</strong></span>
                      <span>安装包体积：<strong className="text-slate-600 dark:text-slate-300 font-mono">{item.fileSize}</strong></span>
                      <span>开发者：{item.software.developer || '原厂发行'}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <Link
                    to={`/software/${item.software.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1769D2] hover:bg-[#1258B5] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>升级与下载</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* 视角 2: 全站最新收录入库软件 */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {newlyCataloged.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#131C2E] rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3">
                  <SoftwareIcon
                    iconUrl={item.iconUrl}
                    name={item.name}
                    slug={item.slug}
                    categorySlug={item.categorySlug}
                    size="md"
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      <Link to={`/software/${item.slug}`} className="hover:text-[#1769D2] hover:underline">
                        {item.name}
                      </Link>
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-[#1769D2] font-medium">
                        新收录
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                        v{item.latestVersion?.version || '1.0.0'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-3 leading-relaxed">
                  {item.summary || '经软游部落人工安全核验，全新收录上线。'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">已核验官方来源</span>
                <Link
                  to={`/software/${item.slug}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-[#1769D2] text-slate-700 hover:text-white dark:bg-slate-800 dark:hover:bg-[#1769D2] dark:text-slate-200 rounded-md font-medium text-xs transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>查看收录</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
