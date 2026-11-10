import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Layers, ExternalLink, Plus, Eye, Download, Check } from 'lucide-react';
import { SelectableSoftware } from '../../services/compareService';
import { SoftwareIcon } from '../common/SoftwareIcon';

interface CompareCatalogSectionProps {
  softwares: SelectableSoftware[];
  leftSlug: string;
  rightSlug: string;
  onSelectLeft: (slug: string) => void;
  onSelectRight: (slug: string) => void;
  onScrollToMatrix: () => void;
}

export const CompareCatalogSection: React.FC<CompareCatalogSectionProps> = ({
  softwares,
  leftSlug,
  rightSlug,
  onSelectLeft,
  onSelectRight,
  onScrollToMatrix,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLicense, setSelectedLicense] = useState('ALL');

  // 获取所有分类
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of softwares) {
      map.set(s.categorySlug, s.categoryName);
    }
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [softwares]);

  // 过滤软件
  const filteredSoftwares = useMemo(() => {
    return softwares.filter((s) => {
      // 关键词搜索
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(query);
        const matchEn = s.englishName?.toLowerCase().includes(query);
        const matchSummary = s.summary.toLowerCase().includes(query);
        if (!matchName && !matchEn && !matchSummary) return false;
      }

      // 分类筛选
      if (selectedCategory !== 'ALL' && s.categorySlug !== selectedCategory) {
        return false;
      }

      // 授权模式筛选
      if (selectedLicense !== 'ALL') {
        if (selectedLicense === 'OPEN_SOURCE' && !s.licenseType.includes('开源')) return false;
        if (selectedLicense === 'FREE' && (!s.licenseType.includes('免费') || s.licenseType.includes('开源'))) return false;
        if (selectedLicense === 'COMMERCIAL' && (s.licenseType.includes('开源') || s.licenseType.includes('免费'))) return false;
      }

      return true;
    });
  }, [softwares, searchTerm, selectedCategory, selectedLicense]);

  return (
    <section className="mb-14">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>全量可比库 · 28 款已发布正版资源</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            对比软件目录索引
          </h2>
          <p className="mt-1 text-xs md:text-sm text-slate-600 dark:text-slate-400">
            可将任意两款软件加入 A/B 对比池，实时生成标准化技术指标差异表。
          </p>
        </div>

        {/* 搜索框 */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索软件名、英文名或特性..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs md:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 筛选条 */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          全部分类 ({softwares.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setSelectedCategory(c.slug)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === c.slug
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {c.name}
          </button>
        ))}

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

        {/* 授权模式筛选 */}
        <button
          onClick={() => setSelectedLicense(selectedLicense === 'OPEN_SOURCE' ? 'ALL' : 'OPEN_SOURCE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            selectedLicense === 'OPEN_SOURCE'
              ? 'bg-emerald-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          开源自由
        </button>
      </div>

      {/* 软件列表卡片网格 */}
      {filteredSoftwares.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500">未检索到匹配的对比软件，请尝试更换关键词或重置筛选</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSoftwares.map((s) => {
            const isLeft = leftSlug === s.slug;
            const isRight = rightSlug === s.slug;

            return (
              <div
                key={s.id}
                className={`flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border transition-all ${
                  isLeft
                    ? 'border-blue-500 ring-2 ring-blue-400/30 shadow-sm'
                    : isRight
                    ? 'border-indigo-500 ring-2 ring-indigo-400/30 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <SoftwareIcon
                        iconUrl={s.iconUrl}
                        name={s.name}
                        slug={s.slug}
                        size="md"
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {s.name}
                        </h3>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {s.englishName || s.categoryName}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                      {s.categoryName}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {s.summary}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {s.licenseType}
                    </span>
                    <span>•</span>
                    <span>{s.latestVersion || '稳定版'}</span>
                    <span>•</span>
                    <span>{s.viewCount} 浏览</span>
                  </div>
                </div>

                {/* 底部加入对比操作按钮 */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* 设为 A */}
                    <button
                      onClick={() => {
                        onSelectLeft(s.slug);
                        onScrollToMatrix();
                      }}
                      disabled={isLeft}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isLeft
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                      }`}
                    >
                      {isLeft ? '✓ 已选为 A' : '+ 设为对比 A'}
                    </button>

                    {/* 设为 B */}
                    <button
                      onClick={() => {
                        onSelectRight(s.slug);
                        onScrollToMatrix();
                      }}
                      disabled={isRight}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isRight
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                      }`}
                    >
                      {isRight ? '✓ 已选为 B' : '+ 设为对比 B'}
                    </button>
                  </div>

                  <Link
                    to={`/software/${s.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-0.5"
                    title="新窗口查看详情"
                  >
                    <span>详情</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
