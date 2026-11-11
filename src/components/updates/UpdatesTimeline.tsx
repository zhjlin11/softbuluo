import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  History,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Info,
  Clock,
  Sparkles,
  FileText,
  ChevronLeft,
} from 'lucide-react';
import { TimelineUpdateItemDto } from '../../services/updatesService';
import { SoftwareIcon } from '../common/SoftwareIcon';

interface UpdatesTimelineProps {
  items: TimelineUpdateItemDto[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onOpenHistory: (softwareId: string) => void;
  onResetFilters: () => void;
}

export const UpdatesTimeline: React.FC<UpdatesTimelineProps> = ({
  items,
  total,
  page,
  totalPages,
  onPageChange,
  onOpenHistory,
  onResetFilters,
}) => {
  // 维护展开的更新日志 ID 集合
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (items.length === 0) {
    return (
      <div className="py-16 px-6 text-center bg-white dark:bg-[#131C2E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#1769D2]">
          <History className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
          当前筛选条件下暂无已核验版本更新记录
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
          软游部落严格依照官方真实发版日期（releaseDate）归档，不伪造版本事件。建议您切换至「全部历史」周期，或查看下方的「最近加入软游部落」新收录专区。
        </p>
        <button
          onClick={onResetFilters}
          className="px-4 py-2 rounded-xl bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
        >
          查看全部历史更新
        </button>
      </div>
    );
  }

  // 按日期进行视觉聚类
  const dateGroupLabels: Record<string, string> = {
    TODAY: '今日已确认更新',
    YESTERDAY: '昨日更新',
    THIS_WEEK: '本周更新',
    THIS_MONTH: '本月更新',
    EARLIER: '历史版本演进归档',
  };

  // 分组聚类
  const groupedItems: { groupKey: string; label: string; list: TimelineUpdateItemDto[] }[] = [];
  let currentGroup = '';
  let currentList: TimelineUpdateItemDto[] = [];

  items.forEach((item) => {
    const key = item.dateGroup;
    if (key !== currentGroup) {
      if (currentList.length > 0) {
        groupedItems.push({
          groupKey: currentGroup,
          label: dateGroupLabels[currentGroup] || '历史更新',
          list: currentList,
        });
      }
      currentGroup = key;
      currentList = [item];
    } else {
      currentList.push(item);
    }
  });
  if (currentList.length > 0) {
    groupedItems.push({
      groupKey: currentGroup,
      label: dateGroupLabels[currentGroup] || '历史更新',
      list: currentList,
    });
  }

  return (
    <div className="space-y-6">
      {groupedItems.map((group) => (
        <div key={group.groupKey} className="space-y-3">
          {/* 分组标题 */}
          <div className="flex items-center gap-2 px-1">
            <span className="w-2 h-2 rounded-full bg-[#1769D2]" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
              {group.label}
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">({group.list.length} 条)</span>
          </div>

          {/* 更新列表项 */}
          <div className="space-y-3">
            {group.list.map((item) => {
              const isExpanded = Boolean(expandedIds[item.versionId]);

              return (
                <div
                  key={item.versionId}
                  className="bg-white dark:bg-[#131C2E] rounded-xl border border-slate-200 dark:border-slate-800 p-4 md:p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* 左侧：图标与基本版本信息 */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <SoftwareIcon
                        iconUrl={item.softwareIconUrl}
                        name={item.softwareName}
                        slug={item.softwareSlug}
                        categorySlug={item.categorySlug}
                        size="md"
                        className="shrink-0 rounded-xl mt-0.5"
                      />

                      <div className="min-w-0 flex-1">
                        {/* 软件标题与版本胶囊 */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            <Link
                              to={`/software/${item.softwareSlug}`}
                              className="hover:text-[#1769D2] hover:underline"
                            >
                              {item.softwareName}
                            </Link>
                          </h4>

                          {/* 版本变迁胶囊：若有前版则显示 A -> B，若无则仅显示当前版本 */}
                          {item.previousVersion ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-300 text-xs font-mono font-bold border border-blue-200 dark:border-blue-800/60">
                              <span className="text-slate-400 dark:text-slate-500 font-normal">v{item.previousVersion}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-blue-400" />
                              <span>v{item.version}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-300 text-xs font-mono font-bold border border-blue-200 dark:border-blue-800/60">
                              v{item.version}
                            </span>
                          )}

                          {item.isLatest && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                              最新稳定版
                            </span>
                          )}

                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {item.categoryName}
                          </span>
                        </div>

                        {/* 元数据标签行 */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>官方发版：{item.formattedDate}</span>
                          </span>
                          <span>平台：{item.platform} ({item.architecture})</span>
                          <span>包体积：{item.fileSize}</span>
                          <span>发行：{item.developer}</span>
                        </div>

                        {/* 更新说明展开区 */}
                        <div className="mt-3">
                          {item.hasChangelog ? (
                            <div>
                              <button
                                onClick={() => toggleExpand(item.versionId)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1769D2] hover:text-blue-700 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>{isExpanded ? '收起官方更新说明' : '查看官方更新日志 (Changelog)'}</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {isExpanded && (
                                <div className="mt-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-200 leading-relaxed space-y-1.5 animate-in fade-in duration-150">
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 pb-1.5 border-b border-slate-200 dark:border-slate-700">
                                    <Sparkles className="w-3 h-3 text-blue-500" />
                                    <span>官方核验更新说明</span>
                                  </div>
                                  <p className="whitespace-pre-line text-xs font-mono">{item.changelog}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-400 border border-slate-100 dark:border-slate-800">
                              <Info className="w-3 h-3 text-slate-400" />
                              <span>官方更新说明暂未收录</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 右侧：操作区与来源认证 */}
                    <div className="shrink-0 flex flex-col md:items-end justify-between gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>已核验原厂来源</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenHistory(item.softwareId)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-semibold transition-colors flex items-center gap-1"
                        >
                          <History className="w-3 h-3" />
                          <span>演进历史</span>
                        </button>

                        <Link
                          to={`/software/${item.softwareSlug}`}
                          className="px-3.5 py-1.5 rounded-lg bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                        >
                          <Download className="w-3 h-3" />
                          <span>获取新版</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* 分页控制栏 */}
      {totalPages > 1 && (
        <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          <div>
            共 <strong>{total}</strong> 条真实版本演进记录，当前第 <strong>{page}</strong> / {totalPages} 页
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>上一页</span>
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <span>下一页</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
