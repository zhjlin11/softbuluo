import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  HardDrive,
  Wifi,
  Cpu,
  Usb,
  Trash2,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Bookmark,
  ShieldCheck,
  X,
} from 'lucide-react';
import { ToolScenarioItem } from '../../services/channelService';
import { SoftwareIcon } from '../common/SoftwareIcon';
import { formatLicenseLabel, getSimpleSoftwareName, sanitizeChannelIconUrl } from '../software/softwareHelpers';

interface SystemToolsScenarioNavigatorProps {
  sectionRef?: React.RefObject<HTMLElement | null>;
  scenarios: ToolScenarioItem[];
  onFilterDomain: (domainSlug: string) => void;
}

const SCENARIO_ICON_MAP: Record<string, React.ReactNode> = {
  slow_pc: <Activity className="w-4 h-4" />,
  disk_health: <HardDrive className="w-4 h-4" />,
  network_diag: <Wifi className="w-4 h-4" />,
  bsod_hardware: <Cpu className="w-4 h-4" />,
  boot_install: <Usb className="w-4 h-4" />,
  uninstall_clean: <Trash2 className="w-4 h-4" />,
};

const TONE_CLASSES: Record<ToolScenarioItem['accentTone'], { iconBox: string; badge: string; border: string }> = {
  blue: {
    iconBox: 'bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-300',
    badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
    border: 'border-t-2 border-t-[#1769D2]',
  },
  amber: {
    iconBox: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300',
    badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300',
    border: 'border-t-2 border-t-amber-500',
  },
  indigo: {
    iconBox: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300',
    badge: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300',
    border: 'border-t-2 border-t-indigo-500',
  },
  rose: {
    iconBox: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300',
    badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300',
    border: 'border-t-2 border-t-rose-500',
  },
  emerald: {
    iconBox: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300',
    badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
    border: 'border-t-2 border-t-emerald-500',
  },
  slate: {
    iconBox: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    border: 'border-t-2 border-t-slate-500',
  },
};

export const SystemToolsScenarioNavigator: React.FC<SystemToolsScenarioNavigatorProps> = ({
  sectionRef,
  scenarios,
  onFilterDomain,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(scenarios[0]?.id || null);
  const activeScenario = scenarios.find((s) => s.id === selectedId) || null;

  return (
    <section ref={sectionRef} aria-labelledby="scenarios-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="scenarios-heading" className="text-xl font-bold text-slate-900 dark:text-white">
            电脑遇到问题？按场景找工具
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            围绕真实维护需求构建「故障问题 → 排查步骤 → 对口工具 → 操作教程 → 安全提醒」完整排障路径
          </p>
        </div>
        {activeScenario && (
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            收起方案详情
          </button>
        )}
      </div>

      {/* 6 大电脑故障场景矩阵卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((sc) => {
          const isSelected = sc.id === selectedId;
          const tone = TONE_CLASSES[sc.accentTone] || TONE_CLASSES.blue;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => setSelectedId(isSelected ? null : sc.id)}
              aria-expanded={isSelected}
              className={`text-left bg-white dark:bg-slate-900 rounded-xl border p-5 transition-colors flex flex-col justify-between cursor-pointer ${
                tone.border
              } ${
                isSelected
                  ? 'border-[#1769D2] ring-2 ring-[#1769D2]/20 bg-blue-50/30 dark:bg-blue-950/20'
                  : 'border-[#E6ECF5] dark:border-slate-800 hover:border-[#93B8F8] dark:hover:border-blue-700/70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tone.iconBox}`}>
                    {SCENARIO_ICON_MAP[sc.id] || <Activity className="w-4 h-4" />}
                  </span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${tone.badge}`}>
                    {sc.badge}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {sc.title}
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {sc.summary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                  实有 <strong className="text-slate-800 dark:text-slate-200">{sc.tools.length}</strong> 款工具
                  {sc.tutorials.length > 0 && ` · ${sc.tutorials.length} 篇教程`}
                </span>
                <span className="inline-flex items-center gap-0.5 font-semibold text-[#1769D2] dark:text-blue-400">
                  {isSelected ? '当前方案' : '进入场景'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 场景深度排障方案面板（故障步骤 -> 对口工具 -> 教程 -> 安全提醒） */}
      {activeScenario && (
        <div
          aria-label={`${activeScenario.title} 排障方案详情`}
          className="bg-white dark:bg-slate-900 rounded-xl border border-[#B7CEFA] dark:border-blue-900/70 p-5 sm:p-6 shadow-xs space-y-5"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-300">
                  场景排障路径
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {activeScenario.title}
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{activeScenario.summary}</p>
            </div>
            <button
              type="button"
              onClick={() => onFilterDomain(activeScenario.recommendedDomainSlug)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-medium shrink-0 cursor-pointer"
            >
              在工具分类区定位对应类别
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 高风险/安全提示 */}
          <div className="p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">安全操作提示：</strong>
              {activeScenario.safetyWarning}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 左：推荐排查步骤与关联教程专题 */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  建议排查顺序
                </h4>
                <ol className="space-y-2">
                  {activeScenario.steps.map((step, i) => (
                    <li key={step} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {(activeScenario.tutorials.length > 0 || activeScenario.relatedTopic) && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">配套图文教程与专题</h4>
                  {activeScenario.relatedTopic && (
                    <Link
                      to={`/topics/${activeScenario.relatedTopic.slug}`}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#F5F8FC] dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-800 text-xs transition-colors"
                    >
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#1769D2] dark:text-blue-400 truncate">
                        <Bookmark className="w-3.5 h-3.5 shrink-0" />
                        专题：{activeScenario.relatedTopic.title}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </Link>
                  )}
                  {activeScenario.tutorials.map((tut) => (
                    <Link
                      key={tut.id}
                      to={`/tutorials/${tut.slug}`}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 text-xs transition-colors"
                    >
                      <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 truncate">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        {tut.title}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 右：匹配到的真实对口系统工具卡片 */}
            <div className="lg:col-span-7 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                场景对口已发布工具 ({activeScenario.tools.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeScenario.tools.map((tool) => {
                  const lic = formatLicenseLabel(tool.licenseType);
                  return (
                    <div
                      key={tool.id}
                      className="p-3.5 rounded-xl border border-[#E6ECF5] dark:border-slate-800 bg-[#F9FBFE] dark:bg-slate-800/40 flex flex-col justify-between gap-2.5"
                    >
                      <div>
                        <div className="flex items-start gap-2.5">
                          <SoftwareIcon
                            iconUrl={sanitizeChannelIconUrl(tool.iconUrl)}
                            name={tool.name}
                            slug={tool.slug}
                            categorySlug={tool.categorySlug}
                            size="sm"
                            className="w-10! h-10! rounded-lg! shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <Link
                                to={`/software/${tool.slug}`}
                                className="text-sm font-bold text-slate-900 dark:text-white hover:text-[#1769D2] truncate"
                              >
                                {getSimpleSoftwareName(tool.name)}
                              </Link>
                              {tool.hasVerifiedSource ? (
                                <span title="含已审核健康直连来源" className="inline-flex shrink-0">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-300 shrink-0">
                                  登记渠道
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {lic.label}
                              </span>
                              {tool.riskLevel === 'HIGH' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium">
                                  高风险 · 需备份
                                </span>
                              )}
                              {tool.requireAdmin && tool.riskLevel !== 'HIGH' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                  需管理员权限
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {tool.summary}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-slate-400" />
                          {tool.platform ? tool.platform.split(' ')[0] : 'Windows'}
                        </span>
                        <Link
                          to={`/software/${tool.slug}`}
                          className="font-semibold text-[#1769D2] dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          下载与校验说明
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
