import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  RotateCcw,
  Share2,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Filter,
  Layers,
  ChevronDown,
  Info,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import {
  CompareSoftwareItemDto,
  QuickPairItem,
  CompareMatrixData,
  MatrixRowItem,
} from '../../services/compareService';
import { SoftwareIcon } from '../common/SoftwareIcon';

interface CompareSoftwareSelectorAndMatrixProps {
  softwares: CompareSoftwareItemDto[];
  quickPairs: QuickPairItem[];
  leftSlug: string;
  rightSlug: string;
  matrixData: CompareMatrixData | null;
  isLoadingMatrix: boolean;
  onSelectLeft: (slug: string) => void;
  onSelectRight: (slug: string) => void;
  onSwap: () => void;
  onClear: () => void;
  onSelectQuickPair: (leftSlug: string, rightSlug: string) => void;
}

const CATEGORY_NAMES: Record<MatrixRowItem['category'], string> = {
  BASIC: '基本信息',
  LICENSE: '开源与商业许可',
  PLATFORM: '平台与兼容性',
  FEATURE: '核心功能与规格',
  INSTALL: '安装包与便携性',
  SOURCE: '安全与哈希校验',
  EDITORIAL: '编辑部实测指标',
};

const CATEGORY_ORDER: MatrixRowItem['category'][] = [
  'BASIC',
  'LICENSE',
  'PLATFORM',
  'FEATURE',
  'INSTALL',
  'SOURCE',
  'EDITORIAL',
];

export const CompareSoftwareSelectorAndMatrix: React.FC<CompareSoftwareSelectorAndMatrixProps> = ({
  softwares,
  quickPairs,
  leftSlug,
  rightSlug,
  matrixData,
  isLoadingMatrix,
  onSelectLeft,
  onSelectRight,
  onSwap,
  onClear,
  onSelectQuickPair,
}) => {
  const [onlyDifferences, setOnlyDifferences] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // 处理复制分享链接
  const handleCopyShareLink = async () => {
    if (!leftSlug || !rightSlug) return;
    const shareUrl = `${window.location.origin}/compare?left=${leftSlug}&right=${rightSlug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
    }
  };

  // 过滤后的对比行
  const filteredRows = useMemo(() => {
    if (!matrixData || !matrixData.rows) return [];
    if (!onlyDifferences) return matrixData.rows;
    return matrixData.rows.filter((r) => r.isDifferent);
  }, [matrixData, onlyDifferences]);

  // 按分类对行分组
  const groupedRows = useMemo(() => {
    const groups: { [cat: string]: MatrixRowItem[] } = {};
    for (const r of filteredRows) {
      if (!groups[r.category]) {
        groups[r.category] = [];
      }
      groups[r.category].push(r);
    }
    return groups;
  }, [filteredRows]);

  return (
    <section id="compare-matrix-section" className="mb-14 scroll-mt-20 w-full max-w-full min-w-0">
      {/* 模块标题与介绍 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>自由 A/B 双软件深度对比引擎</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            交互式双软件参数对比矩阵
          </h2>
          <p className="mt-1 text-xs md:text-sm text-slate-600 dark:text-slate-400">
            支持 28 款已收录软件跨场景或同类对决。所有参数均基于官方文档、许可证合规与真实安装包校验。
          </p>
        </div>

        {/* 顶部操作条：复制链接、重置对比 */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={handleCopyShareLink}
            disabled={!leftSlug || !rightSlug}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              copiedShareLink
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
            title="复制带当前对比参数的专属分享链接"
          >
            {copiedShareLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedShareLink ? '已复制分享链接' : '分享此对比'}</span>
          </button>

          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="清空当前对比选择"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置</span>
          </button>
        </div>
      </div>

      {/* 热门对比快捷入口快速切换芯片 */}
      <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>热门对比推荐对（点击直接载入）：</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickPairs.map((pair) => {
            const isSelected =
              (leftSlug === pair.leftSlug && rightSlug === pair.rightSlug) ||
              (leftSlug === pair.rightSlug && rightSlug === pair.leftSlug);
            return (
              <button
                key={`${pair.leftSlug}-vs-${pair.rightSlug}`}
                onClick={() => onSelectQuickPair(pair.leftSlug, pair.rightSlug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
              >
                <span>{pair.leftName} vs {pair.rightName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    isSelected
                      ? 'bg-blue-700/80 text-blue-100'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {pair.categoryName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* A/B 软件交互选择卡片 */}
      <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* 左侧软件选择框 */}
          <div className="md:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>软件 A（对比基准）</span>
              </label>
              {matrixData?.softwareA && (
                <Link
                  to={`/software/${matrixData.softwareA.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
                >
                  <span>查看详情</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            <div className="relative">
              <select
                aria-label="软件 A（对比基准）"
                value={leftSlug}
                onChange={(e) => onSelectLeft(e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  请选择对比软件 A...
                </option>
                {softwares.map((s) => (
                  <option
                    key={s.slug}
                    value={s.slug}
                    disabled={s.slug === rightSlug}
                  >
                    {s.name} ({s.categoryName} · {s.licenseType})
                    {s.slug === rightSlug ? ' [已选为右侧]' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* 当前选中左侧软件简要信息 */}
            {matrixData?.softwareA && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                <SoftwareIcon
                  iconUrl={matrixData.softwareA.iconUrl}
                  name={matrixData.softwareA.name}
                  slug={matrixData.softwareA.slug}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs md:text-sm text-slate-900 dark:text-white truncate">
                    {matrixData.softwareA.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{matrixData.softwareA.categoryName}</span>
                    <span>•</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {matrixData.softwareA.licenseType}
                    </span>
                    <span>•</span>
                    <span>{matrixData.softwareA.latestVersion || '最新稳定版'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 中间互换按钮与 VS 徽章 */}
          <div className="md:col-span-1 flex flex-row md:flex-col items-center justify-center gap-2 py-2">
            <button
              onClick={onSwap}
              disabled={!leftSlug || !rightSlug}
              aria-label="交换左右对比软件"
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-transform hover:rotate-180 active:scale-95 disabled:opacity-40 disabled:hover:rotate-0 cursor-pointer shadow-sm"
              title="交换左右两款软件位置"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 tracking-wider">
              VS
            </span>
          </div>

          {/* 右侧软件选择框 */}
          <div className="md:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>软件 B（对比目标）</span>
              </label>
              {matrixData?.softwareB && (
                <Link
                  to={`/software/${matrixData.softwareB.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                >
                  <span>查看详情</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            <div className="relative">
              <select
                aria-label="软件 B（对比目标）"
                value={rightSlug}
                onChange={(e) => onSelectRight(e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>
                  请选择对比软件 B...
                </option>
                {softwares.map((s) => (
                  <option
                    key={s.slug}
                    value={s.slug}
                    disabled={s.slug === leftSlug}
                  >
                    {s.name} ({s.categoryName} · {s.licenseType})
                    {s.slug === leftSlug ? ' [已选为左侧]' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* 当前选中右侧软件简要信息 */}
            {matrixData?.softwareB && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                <SoftwareIcon
                  iconUrl={matrixData.softwareB.iconUrl}
                  name={matrixData.softwareB.name}
                  slug={matrixData.softwareB.slug}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs md:text-sm text-slate-900 dark:text-white truncate">
                    {matrixData.softwareB.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{matrixData.softwareB.categoryName}</span>
                    <span>•</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {matrixData.softwareB.licenseType}
                    </span>
                    <span>•</span>
                    <span>{matrixData.softwareB.latestVersion || '最新稳定版'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 跨品类对比友好提示 */}
        {matrixData && !matrixData.isSameCategory && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">跨品类选型提示：</span>
              当前对比的两款软件属于不同分类（{matrixData.softwareA.name} 属于「
              {matrixData.softwareA.categoryName}」，{matrixData.softwareB.name} 属于「
              {matrixData.softwareB.categoryName}
              」）。矩阵主要横向比对它们的许可证、便携性、安全哈希与系统兼容表现。
            </div>
          </div>
        )}
      </div>

      {/* 矩阵过滤与控制条 */}
      {matrixData && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-2">
          {/* 差异项过滤切换器 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOnlyDifferences(!onlyDifferences)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                onlyDifferences
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>仅显示差异项</span>
              {onlyDifferences && <Check className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            <span className="text-xs text-slate-500 dark:text-slate-400">
              共对比 <strong className="text-slate-900 dark:text-white">{matrixData.totalRowCount}</strong> 项参数，
              存在 <strong className="text-amber-600 dark:text-amber-400">{matrixData.differenceCount}</strong> 项差异
              {onlyDifferences && `（已过滤仅显示 ${filteredRows.length} 项差异）`}
            </span>
          </div>

          {/* 如果有关联的已发布精选长文评测 */}
          {matrixData.curatedArticle && (
            <Link
              to={`/compare/${matrixData.curatedArticle.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-900/60"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>阅读本组专属深度长文评测（含多维跑分与场景拆解）</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* 参数对比矩阵表格 */}
      {isLoadingMatrix ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-400">正在严格对齐两款软件参数与证据记录...</p>
        </div>
      ) : !matrixData ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <HelpCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            请在上方选择两款软件以展开对比，或点击上方推荐对比对快速查看。
          </p>
        </div>
      ) : (
        <div className="w-full max-w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-w-0">
          <div className="w-full max-w-full overflow-x-auto min-w-0">
            <table className="w-full text-left text-xs md:text-sm border-collapse min-w-[640px]">
              {/* 吸顶表头 */}
              <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300 w-1/4">
                    对比维度与指标项
                  </th>
                  <th className="py-3.5 px-4 font-bold text-blue-700 dark:text-blue-400 w-[37.5%] border-l border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <SoftwareIcon
                        iconUrl={matrixData.softwareA.iconUrl}
                        name={matrixData.softwareA.name}
                        slug={matrixData.softwareA.slug}
                        size="sm"
                      />
                      <span className="truncate">{matrixData.softwareA.name}</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-bold text-indigo-700 dark:text-indigo-400 w-[37.5%] border-l border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <SoftwareIcon
                        iconUrl={matrixData.softwareB.iconUrl}
                        name={matrixData.softwareB.name}
                        slug={matrixData.softwareB.slug}
                        size="sm"
                      />
                      <span className="truncate">{matrixData.softwareB.name}</span>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* 表体：按分类分组渲染 */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {CATEGORY_ORDER.map((category) => {
                  const rows = groupedRows[category];
                  if (!rows || rows.length === 0) return null;

                  return (
                    <React.Fragment key={category}>
                      {/* 分类子标题行 */}
                      <tr className="bg-slate-100/70 dark:bg-slate-800/60 font-semibold">
                        <td
                          colSpan={3}
                          className="py-2.5 px-4 text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide uppercase bg-slate-100 dark:bg-slate-800"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-3.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                            <span>{CATEGORY_NAMES[category]}</span>
                            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                              ({rows.length} 项)
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* 各指标参数行 */}
                      {rows.map((row) => {
                        const isDiff = row.isDifferent;
                        return (
                          <tr
                            key={row.id}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                              isDiff ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                            }`}
                          >
                            {/* 指标名称 */}
                            <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 align-top">
                              <div className="flex items-center gap-1.5">
                                <span>{row.label}</span>
                                {isDiff && (
                                  <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                                    差异
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 软件 A 参数值 */}
                            <td
                              className={`py-3 px-4 text-slate-800 dark:text-slate-200 border-l border-slate-100 dark:border-slate-800 align-top leading-relaxed ${
                                isDiff ? 'font-medium' : ''
                              }`}
                            >
                              {row.valueA === '暂无可靠数据' ? (
                                <span className="text-slate-400 dark:text-slate-500 italic text-xs">
                                  暂无可靠数据
                                </span>
                              ) : row.valueA === '支持' || row.valueA === '已校验' ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{row.valueA}</span>
                                </span>
                              ) : (
                                <span>{row.valueA}</span>
                              )}
                            </td>

                            {/* 软件 B 参数值 */}
                            <td
                              className={`py-3 px-4 text-slate-800 dark:text-slate-200 border-l border-slate-100 dark:border-slate-800 align-top leading-relaxed ${
                                isDiff ? 'font-medium' : ''
                              }`}
                            >
                              {row.valueB === '暂无可靠数据' ? (
                                <span className="text-slate-400 dark:text-slate-500 italic text-xs">
                                  暂无可靠数据
                                </span>
                              ) : row.valueB === '支持' || row.valueB === '已校验' ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{row.valueB}</span>
                                </span>
                              ) : (
                                <span>{row.valueB}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 矩阵底部场景化选型结论建议卡片 */}
          <div className="p-5 md:p-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                软游部落编辑部 · 场景化客观选型指南
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* 推荐左侧的情形 */}
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                <div className="font-semibold text-xs md:text-sm text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>更适合选择 {matrixData.softwareA.name} 的场景：</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {matrixData.scenarioAdvice.chooseSoftwareAIf.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-blue-600 dark:text-blue-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 推荐右侧的情形 */}
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40">
                <div className="font-semibold text-xs md:text-sm text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span>更适合选择 {matrixData.softwareB.name} 的场景：</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {matrixData.scenarioAdvice.chooseSoftwareBIf.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-indigo-600 dark:text-indigo-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 总体描述 */}
            <div className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed">
              <strong className="text-slate-900 dark:text-slate-200">综合决策建议：</strong>{' '}
              {matrixData.scenarioAdvice.description}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
