import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Code2,
  Key,
  ShieldCheck,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

export const ApiDocsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'software' | 'games' | 'categories' | 'search' | 'compare'>('software');
  const [copiedCurl, setCopiedCurl] = useState<string | null>(null);

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCurl(id);
    setTimeout(() => setCopiedCurl(null), 2000);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 sm:py-12">
      {/* 头部标题与简介 */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800 rounded-full text-xs font-semibold mb-3">
          <Code2 className="w-3.5 h-3.5" />
          <span>OpenAPI 3.1 开放数据规范 · 只读公共接口</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          软游部落开放平台 API 文档 (v1)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-3xl leading-relaxed">
          软游部落为广大开发者、极客及第三方客户端提供高性能、只读的公开 API。可直接获取已发布的官方正版软件元数据、最新版本检测、软件分类索引以及横向评测数据。
        </p>
      </div>

      {/* 鉴权与规范说明横幅 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">基准调用路径</span>
          <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 select-all">
            /api/public/v1/
          </div>
          <p className="text-[11px] text-slate-400 mt-1">支持 HTTPS 全程加密与 ETag 缓存优化</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">调用鉴权请求头</span>
          <div className="font-mono text-xs font-bold text-purple-600 mt-1 select-all">
            X-Api-Key: sb_live_...
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            匿名调用免 Header；开发者传入 Key 可享 300 次/分高配额
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">限流响应头</span>
          <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
            X-RateLimit-Remaining
          </div>
          <p className="text-[11px] text-slate-400 mt-1">超限时自动返回 429 Too Many Requests</p>
        </div>
      </div>

      {/* 接口分类切换 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
        <button
          onClick={() => setActiveTab('software')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            activeTab === 'software'
              ? 'bg-[#1769D2] text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          软件资源 (/software)
        </button>
        <button
          onClick={() => setActiveTab('games')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            activeTab === 'games'
              ? 'bg-[#1769D2] text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          游戏专区 (/games)
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            activeTab === 'categories'
              ? 'bg-[#1769D2] text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          分类索引 (/categories)
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            activeTab === 'search'
              ? 'bg-[#1769D2] text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          全库检索 (/search)
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            activeTab === 'compare'
              ? 'bg-[#1769D2] text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          横向评测 (/compare)
        </button>
      </div>

      {/* 接口文档主体 */}
      <div className="space-y-8">
        {activeTab === 'software' && (
          <div className="space-y-6">
            {/* 1. 软件列表 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold rounded">
                  GET
                </span>
                <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                  /api/public/v1/software
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">分页获取已发布的正式软件列表（支持按分类筛选）</p>

              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">查询参数 (Query Parameters)</h4>
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-xs font-mono space-y-1 text-slate-600 dark:text-slate-300 mb-4">
                <div>category: string (可选，分类 Slug，例如 developer-tools)</div>
                <div>page: integer (可选，默认 1)</div>
                <div>pageSize: integer (可选，默认 20，上限 50)</div>
              </div>

              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">调用示例 (cURL)</span>
                <button
                  onClick={() =>
                    copyCode(
                      'curl -H "X-Api-Key: sb_live_your_key" "http://localhost:3001/api/public/v1/software?page=1"',
                      'curl-software'
                    )
                  }
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline cursor-pointer"
                >
                  {copiedCurl === 'curl-software' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCurl === 'curl-software' ? '已复制' : '复制命令'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto">
                curl -H "X-Api-Key: sb_live_your_key" "http://localhost:3001/api/public/v1/software?page=1"
              </pre>
            </div>

            {/* 2. 软件详情 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold rounded">
                  GET
                </span>
                <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                  /api/public/v1/software/:slug
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">获取指定软件的完整公开元数据、官方来源与历史版本</p>

              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">调用示例</span>
                <button
                  onClick={() =>
                    copyCode(
                      'curl "http://localhost:3001/api/public/v1/software/vscode"',
                      'curl-software-detail'
                    )
                  }
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline cursor-pointer"
                >
                  {copiedCurl === 'curl-software-detail' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>复制</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto">
                curl "http://localhost:3001/api/public/v1/software/vscode"
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'games' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold rounded">
                GET
              </span>
              <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                /api/public/v1/games
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">获取正版开源单机与独立游戏推荐列表</p>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto">
              curl "http://localhost:3001/api/public/v1/games?page=1&pageSize=10"
            </pre>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold rounded">
                GET
              </span>
              <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                /api/public/v1/categories
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">获取全站 10 大分类字典与对应已发布资源总数</p>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto">
              curl "http://localhost:3001/api/public/v1/categories"
            </pre>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold rounded">
                GET
              </span>
              <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                /api/public/v1/search?q=:keyword
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              跨软件名称、英文名、开发方与简介的快速全库模糊搜索 (返回匹配度最高的前 15 条)
            </p>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto">
              curl "http://localhost:3001/api/public/v1/search?q=editor"
            </pre>
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold rounded">
                GET
              </span>
              <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                /api/public/v1/compare/:slug
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              获取两款软件的深度评测参数矩阵、官方凭证与编辑部实测指标 (如 vscode-vs-sublime)
            </p>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto">
              curl "http://localhost:3001/api/public/v1/compare/vscode-vs-sublime"
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
