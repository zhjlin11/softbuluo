import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  HardDrive,
  Download,
  Usb,
  MonitorCheck,
  Wrench,
  PackageCheck,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { EssentialsInstallStepItem, EssentialsToolboxGroupItem } from '../../services/channelService';
import { SoftwareIcon } from '../common/SoftwareIcon';
import {
  formatLicenseLabel,
  getSimpleSoftwareName,
  getSimpleVersion,
  sanitizeChannelIconUrl,
} from '../software/softwareHelpers';

interface EssentialsWorkflowAndToolboxProps {
  installWorkflow: EssentialsInstallStepItem[];
  toolboxGroups: EssentialsToolboxGroupItem[];
  onJumpToChecklist: () => void;
}

const STEP_ICONS = [
  <Cpu key="1" className="w-4 h-4" />,
  <HardDrive key="2" className="w-4 h-4" />,
  <Download key="3" className="w-4 h-4" />,
  <Usb key="4" className="w-4 h-4" />,
  <MonitorCheck key="5" className="w-4 h-4" />,
  <Wrench key="6" className="w-4 h-4" />,
  <PackageCheck key="7" className="w-4 h-4" />,
  <ShieldCheck key="8" className="w-4 h-4" />,
];

export const EssentialsWorkflowAndToolbox: React.FC<EssentialsWorkflowAndToolboxProps> = ({
  installWorkflow,
  toolboxGroups,
  onJumpToChecklist,
}) => {
  const [activeStepNum, setActiveStepNum] = useState<number>(installWorkflow[0]?.step || 1);
  const currentStep =
    installWorkflow.find((s) => s.step === activeStepNum) || installWorkflow[0] || null;

  return (
    <div className="space-y-8">
      {/* 1. 系统安装与驱动配置 8 步流程 */}
      <section
        id="essentials-workflow"
        aria-labelledby="workflow-heading"
        className="bg-white dark:bg-slate-900 rounded-xl border border-[#E6ECF5] dark:border-slate-800 p-4 sm:p-6 shadow-2xs space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="workflow-heading" className="text-xl font-bold text-slate-900 dark:text-white">
              从零开始完成新电脑配置
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              严谨遵循「硬件核查 → 数据备份 → 原版镜像校验 → 制作 U 盘 → 安装与官方驱动 → 安全基线」8 步规范流程
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-300 font-medium">
            合规装机指引 · 共 {installWorkflow.length} 步
          </span>
        </div>

        {/* 横向步骤切换条 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2" role="tablist" aria-label="系统安装配置流程步骤">
          {installWorkflow.map((st, idx) => {
            const isSelected = currentStep?.step === st.step;
            return (
              <button
                key={st.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveStepNum(st.step)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/90 dark:bg-blue-950/70 border-[#1769D2] ring-1 ring-[#1769D2]/30'
                    : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center ${
                      isSelected
                        ? 'bg-[#1769D2] text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {STEP_ICONS[idx % STEP_ICONS.length]}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                    STEP {st.step}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold leading-tight truncate ${
                    isSelected ? 'text-[#1769D2] dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {st.shortLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* 当前步骤详情展开 */}
        {currentStep && (
          <div className="p-4 sm:p-5 rounded-xl bg-[#F8FAFD] dark:bg-slate-800/40 border border-[#E2EBF8] dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#1769D2] text-white text-xs font-bold tabular-nums">
                  步骤 {currentStep.step} / {installWorkflow.length}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {currentStep.title}
                </h3>
              </div>

              {currentStep.step === 7 && (
                <button
                  type="button"
                  onClick={onJumpToChecklist}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1769D2] dark:text-blue-400 hover:underline cursor-pointer"
                >
                  前往勾选装机软件清单 →
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {currentStep.summary}
            </p>

            <ul className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {currentStep.checklist.map((item, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200 leading-relaxed"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {currentStep.complianceWarning && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{currentStep.complianceWarning}</span>
              </div>
            )}

            {(currentStep.relatedSoftwares.length > 0 || currentStep.relatedTutorials.length > 0) && (
              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center gap-2">
                {currentStep.relatedSoftwares.map((sw) => (
                  <Link
                    key={sw.slug}
                    to={`/software/${sw.slug}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#1769D2] text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    <span>工具：{getSimpleSoftwareName(sw.name)}</span>
                    <ChevronRight className="w-3 h-3 text-[#1769D2]" />
                  </Link>
                ))}
                {currentStep.relatedTutorials.map((tut) => (
                  <Link
                    key={tut.slug}
                    to={`/tutorials/${tut.slug}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800/60 hover:bg-blue-100 text-xs font-medium text-[#1769D2] dark:text-blue-300"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>教程：{tut.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. 专业装机与维修工具箱 */}
      <section id="essentials-toolbox" aria-labelledby="toolbox-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="toolbox-heading" className="text-xl font-bold text-slate-900 dark:text-white">
              装机与维修工具箱
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              围绕启动盘制作、磁盘分区救援、硬件体检、网络排查与清理维护组织专业已发布工具；涉及写盘、分区与深层清理均附风险警示
            </p>
          </div>
          <Link
            to="/system-tools"
            className="text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline shrink-0"
          >
            前往系统工具频道故障排查 →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {toolboxGroups.map((group) => (
            <article
              key={group.id}
              data-toolbox-group={group.id}
              className={`bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-2xs flex flex-col justify-between space-y-3 ${
                group.isHighRisk
                  ? 'border-amber-200/90 dark:border-amber-900/60'
                  : 'border-[#E6ECF5] dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{group.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {group.description}
                    </p>
                  </div>
                  {group.isHighRisk && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-semibold shrink-0">
                      <AlertTriangle className="w-3 h-3" />
                      高风险工具箱
                    </span>
                  )}
                </div>

                {/* 风险提醒 */}
                <div
                  className={`p-2.5 rounded-lg text-[11px] leading-relaxed flex items-start gap-2 ${
                    group.isHighRisk
                      ? 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200/70 dark:border-amber-900/40'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {group.isHighRisk ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <span>{group.safetyNotice}</span>
                </div>

                {/* 分组下真实工具条目 */}
                <div className="space-y-2">
                  {group.tools.map((tool) => (
                    <Link
                      key={tool.id}
                      to={`/software/${tool.slug}`}
                      className="group flex items-center justify-between gap-2.5 p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-[#B7CEFA] dark:hover:border-blue-800 hover:bg-[#F5F8FC] dark:hover:bg-slate-800/70 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SoftwareIcon
                          iconUrl={sanitizeChannelIconUrl(tool.iconUrl)}
                          name={tool.name}
                          slug={tool.slug}
                          categorySlug={tool.categorySlug}
                          size="sm"
                          className="w-8 h-8! rounded-lg!"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#1769D2] truncate">
                              {getSimpleSoftwareName(tool.name, tool.englishName || undefined)}
                            </span>
                            {tool.riskLevel === 'HIGH' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold shrink-0">
                                需备份
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {formatLicenseLabel(tool.licenseType).label}
                            {tool.latestVersion ? ` · ${getSimpleVersion(tool.latestVersion)}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-[#1769D2] dark:text-blue-400 shrink-0">
                        详情 →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
