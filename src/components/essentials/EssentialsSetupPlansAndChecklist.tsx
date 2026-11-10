import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Gamepad2,
  Palette,
  Code2,
  GraduationCap,
  Wrench,
  Check,
  RotateCcw,
  FileDown,
  FileJson,
  Eye,
  X,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Copy,
  CheckCircle2,
  Layers,
  Info,
} from 'lucide-react';
import { EssentialsPlanSoftwareItem, EssentialsSetupPlanItem } from '../../services/channelService';
import { SoftwareIcon } from '../common/SoftwareIcon';
import { siteConfig } from '../../config/site';
import {
  formatLicenseLabel,
  formatShortPlatform,
  getSimpleSoftwareName,
  getSimpleVersion,
  sanitizeChannelIconUrl,
} from '../software/softwareHelpers';

interface EssentialsSetupPlansAndChecklistProps {
  setupPlans: EssentialsSetupPlanItem[];
  activePlanId: string;
  checklistSecurityNotice: string;
  onSelectPlan: (planId: string) => void;
}

const PLAN_STORAGE_KEY = 'softtribe_essentials_checklist_v1';

const PLAN_ICON_MAP: Record<EssentialsSetupPlanItem['illustrationType'], React.ReactNode> = {
  office: <Briefcase className="w-5 h-5" />,
  gaming: <Gamepad2 className="w-5 h-5" />,
  creative: <Palette className="w-5 h-5" />,
  developer: <Code2 className="w-5 h-5" />,
  student: <GraduationCap className="w-5 h-5" />,
  repair: <Wrench className="w-5 h-5" />,
};

const TONE_STYLES: Record<
  EssentialsSetupPlanItem['accentTone'],
  { topBar: string; iconBg: string; badge: string }
> = {
  blue: {
    topBar: 'border-t-blue-600',
    iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-400',
    badge: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
  },
  emerald: {
    topBar: 'border-t-emerald-600',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
  },
  violet: {
    topBar: 'border-t-violet-600',
    iconBg: 'bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400',
    badge: 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300',
  },
  indigo: {
    topBar: 'border-t-indigo-600',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300',
  },
  sky: {
    topBar: 'border-t-sky-600',
    iconBg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',
    badge: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300',
  },
  amber: {
    topBar: 'border-t-amber-500',
    iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
  },
};

function readStoredSelections(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export const EssentialsSetupPlansAndChecklist: React.FC<EssentialsSetupPlansAndChecklistProps> = ({
  setupPlans,
  activePlanId,
  checklistSecurityNotice,
  onSelectPlan,
}) => {
  const activePlan =
    setupPlans.find((p) => p.id === activePlanId) || setupPlans[0] || null;

  const [storedSelections, setStoredSelections] = useState<Record<string, string[]>>(() =>
    readStoredSelections()
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const selectedSlugSet = useMemo(() => {
    if (!activePlan) return new Set<string>();
    const saved = storedSelections[activePlan.id];
    if (Array.isArray(saved)) {
      const validSlugs = new Set(activePlan.items.map((it) => it.slug));
      return new Set(saved.filter((s) => validSlugs.has(s)));
    }
    // 默认勾选当前场景的推荐软件
    return new Set(activePlan.items.map((it) => it.slug));
  }, [activePlan, storedSelections]);

  useEffect(() => {
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(storedSelections));
    } catch {
      // 忽略无痕浏览器持久化受限
    }
  }, [storedSelections]);

  if (!activePlan) return null;

  const setActivePlanSlugs = (nextSlugs: string[]) => {
    setStoredSelections((prev) => ({
      ...prev,
      [activePlan.id]: nextSlugs,
    }));
  };

  const toggleItem = (slug: string) => {
    const next = new Set(selectedSlugSet);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setActivePlanSlugs(Array.from(next));
  };

  const handleSelectAll = () => {
    setActivePlanSlugs(activePlan.items.map((it) => it.slug));
  };

  const handleClearAll = () => {
    setActivePlanSlugs([]);
  };

  const handleResetPlan = () => {
    setActivePlanSlugs(activePlan.items.map((it) => it.slug));
  };

  const toggleGroup = (groupName: string) => {
    const groupItems = activePlan.items.filter((it) => it.groupName === groupName);
    const allChecked = groupItems.every((it) => selectedSlugSet.has(it.slug));
    const next = new Set(selectedSlugSet);
    for (const it of groupItems) {
      if (allChecked) next.delete(it.slug);
      else next.add(it.slug);
    }
    setActivePlanSlugs(Array.from(next));
  };

  const selectedItems = activePlan.items.filter((it) => selectedSlugSet.has(it.slug));
  const selectedCount = selectedItems.length;

  const getPublicOrigin = () => {
    const envUrl = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.trim();
    const configuredUrl = siteConfig.url?.trim();
    const fallback = 'https://softtribe.top';
    const raw = envUrl || configuredUrl || fallback;
    return raw.replace(/\/+$/, '');
  };

  const getSourceLabel = (item: EssentialsPlanSoftwareItem) =>
    item.hasVerifiedSource
      ? `含已审核可用官方来源（共登记 ${item.registeredSourcesCount || 1} 条）`
      : item.registeredSourcesCount && item.registeredSourcesCount > 0
        ? `已登记 ${item.registeredSourcesCount} 条官方渠道指引（尚未全部附带文件哈希）`
        : '官方官网发布指引';

  const buildTextContent = () => {
    const origin = getPublicOrigin();
    const today = new Date().toISOString().slice(0, 10);
    return [
      `============================================================`,
      `软游部落（SoftTribe）· ${activePlan.title} 个人装机清单`,
      `============================================================`,
      `所选方案：${activePlan.title} (${activePlan.id})`,
      `适用人群：${activePlan.targetUsers}`,
      `导出日期：${today}`,
      `已选软件：${selectedCount} / ${activePlan.items.length} 款`,
      ``,
      ...selectedItems.map((it, i) => {
        const ver = it.latestVersion ? getSimpleVersion(it.latestVersion) : '以官网最新为准';
        return [
          `${i + 1}. [步骤 #${it.installOrder} · ${it.groupName}] ${it.name}`,
          `   版本信息：${ver} | 许可：${formatLicenseLabel(it.licenseType).label} | 平台：${formatShortPlatform(it.platform)}`,
          `   用途作用：${it.rolePurpose}`,
          `   安装提示：${it.installTip}`,
          `   来源说明：${getSourceLabel(it)}`,
          `   官方详情与安全渠道：${origin}/software/${encodeURIComponent(it.slug)}`,
        ].join('\n');
      }),
      ``,
      `------------------------------------------------------------`,
      `安全合规提醒：`,
      `- 本清单仅作装机规划文本导出，不代表自动下载或已完成完整性扫描；`,
      `- 请逐项点击上方官方详情页获取原厂下载通道，切勿使用第三方高速下载器或绕过激活工具。`,
    ].join('\n');
  };

  const buildJsonPayload = () => {
    const origin = getPublicOrigin();
    return {
      generator: 'SoftTribe Essentials Checklist 3.0',
      planId: activePlan.id,
      planTitle: activePlan.title,
      targetUsers: activePlan.targetUsers,
      exportedAt: new Date().toISOString(),
      selectedCount,
      securityDisclaimer: checklistSecurityNotice,
      items: selectedItems.map((it) => ({
        installOrder: it.installOrder,
        groupName: it.groupName,
        slug: it.slug,
        name: it.name,
        version: it.latestVersion || null,
        license: formatLicenseLabel(it.licenseType).label,
        platform: it.platform || 'Windows 10/11',
        sourceStatus: getSourceLabel(it),
        hasApprovedHealthySource: it.hasVerifiedSource,
        detailUrl: `${origin}/software/${encodeURIComponent(it.slug)}`,
        rolePurpose: it.rolePurpose,
        installTip: it.installTip,
      })),
    };
  };

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportTxt = () => {
    if (selectedCount === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    triggerDownload(buildTextContent(), `softtribe-essentials-${activePlan.id}-${today}.txt`, 'text/plain;charset=utf-8');
  };

  const handleExportJson = () => {
    if (selectedCount === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    triggerDownload(
      JSON.stringify(buildJsonPayload(), null, 2),
      `softtribe-essentials-${activePlan.id}-${today}.json`,
      'application/json;charset=utf-8'
    );
  };

  const handleCopyText = () => {
    if (selectedCount === 0 || !navigator.clipboard) return;
    navigator.clipboard.writeText(buildTextContent()).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  };

  const handleChoosePlanCard = (planId: string) => {
    onSelectPlan(planId);
    const checklistEl = document.getElementById('essentials-checklist');
    if (checklistEl && typeof window !== 'undefined' && window.innerWidth < 768) {
      checklistEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-8">
      {/* 模块一：根据用途选择装机方案 (6 场景卡片) */}
      <section id="essentials-plans" aria-labelledby="setup-plans-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="setup-plans-heading" className="text-xl font-bold text-slate-900 dark:text-white">
              你准备装什么类型的电脑？
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              点击任一装机用途卡片，下方自动切换并加载经过真实发布核验的推荐装机清单（免登录即可勾选导出）
            </p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            共 {setupPlans.length} 套真实场景配置方案
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {setupPlans.map((plan) => {
            const isSelected = plan.id === activePlan.id;
            const tone = TONE_STYLES[plan.accentTone] || TONE_STYLES.blue;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => handleChoosePlanCard(plan.id)}
                aria-pressed={isSelected}
                data-plan-card={plan.id}
                className={`text-left bg-white dark:bg-slate-900 rounded-xl border border-t-3 ${tone.topBar} p-5 transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-[#1769D2] ring-2 ring-[#1769D2]/20 shadow-sm'
                    : 'border-[#E6ECF5] dark:border-slate-800 hover:border-[#93B8F8] dark:hover:border-blue-800 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone.iconBg}`}>
                      {PLAN_ICON_MAP[plan.illustrationType]}
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full tabular-nums ${tone.badge}`}>
                      真实绑定 {plan.recommendedCount} 款
                    </span>
                  </div>

                  <h3 className="mt-3.5 text-base font-bold text-slate-900 dark:text-white">
                    {plan.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {plan.tagline}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    适用：{plan.targetUsers}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                  <span className={isSelected ? 'text-[#1769D2] dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}>
                    {isSelected ? '当前已选中方案 ✓' : '点击切换此配置方案'}
                  </span>
                  <span className="text-[#1769D2] dark:text-blue-400">查看方案 →</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 模块二：可交互分组装机软件清单与安全导出 */}
      <section
        id="essentials-checklist"
        aria-labelledby="checklist-heading"
        className="bg-white dark:bg-slate-900 rounded-xl border border-[#DCE6F5] dark:border-slate-800 p-4 sm:p-6 shadow-2xs space-y-5"
      >
        {/* 头部信息与批量控制条 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="checklist-heading" className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {activePlan.title} · 必装软件清单
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-300 font-semibold tabular-nums">
                已选 <span data-testid="selected-count">{selectedCount}</span> / {activePlan.recommendedCount} 款
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {activePlan.installAdvice}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              全部选择
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              取消选择
            </button>
            <button
              type="button"
              onClick={handleResetPlan}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置推荐
            </button>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#1769D2]" />
              查看已选 ({selectedCount})
            </button>
          </div>
        </div>

        {/* 安全合规提示条 */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>安全与许可提示：</strong>
            {checklistSecurityNotice} 驱动更新建议：{activePlan.driverAdvice}
          </div>
        </div>

        {/* 按分组呈现勾选清单 */}
        <div className="space-y-5">
          {activePlan.groups.map((groupName) => {
            const groupItems = activePlan.items.filter((it) => it.groupName === groupName);
            const groupCheckedCount = groupItems.filter((it) => selectedSlugSet.has(it.slug)).length;
            const groupAllChecked = groupItems.length > 0 && groupCheckedCount === groupItems.length;

            return (
              <div
                key={groupName}
                className="rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden"
              >
                <div className="bg-slate-50/90 dark:bg-slate-800/60 px-4 py-2.5 flex items-center justify-between gap-2 border-b border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#1769D2] dark:text-blue-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{groupName}</h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      ({groupCheckedCount}/{groupItems.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleGroup(groupName)}
                    className="text-xs font-medium text-[#1769D2] dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {groupAllChecked ? '取消全选本组' : '全选本组'}
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {groupItems.map((item) => {
                    const checked = selectedSlugSet.has(item.slug);
                    return (
                      <div
                        key={item.slug}
                        data-checklist-item={item.slug}
                        className={`p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          checked ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/40 dark:bg-slate-900/50 opacity-70'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={checked}
                            aria-label={`勾选 ${item.name}`}
                            onClick={() => toggleItem(item.slug)}
                            className={`w-5 h-5 mt-1 rounded-md flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                              checked
                                ? 'bg-[#1769D2] text-white'
                                : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            }`}
                          >
                            {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>

                          <span className="w-7 h-7 mt-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                            #{item.installOrder}
                          </span>

                          <SoftwareIcon
                            iconUrl={sanitizeChannelIconUrl(item.iconUrl)}
                            name={item.name}
                            slug={item.slug}
                            categorySlug={item.categorySlug}
                            size="md"
                            className="w-10 h-10! rounded-lg!"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Link
                                to={`/software/${item.slug}`}
                                className="text-sm font-bold text-slate-900 dark:text-white hover:text-[#1769D2] dark:hover:text-blue-400 hover:underline"
                              >
                                {getSimpleSoftwareName(item.name, item.englishName || undefined)}
                              </Link>
                              {item.latestVersion && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                                  {getSimpleVersion(item.latestVersion)}
                                </span>
                              )}
                              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[#1769D2] dark:text-blue-300 font-medium">
                                {formatLicenseLabel(item.licenseType).label}
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {formatShortPlatform(item.platform)}
                              </span>
                              {item.hasVerifiedSource ? (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium">
                                  <CheckCircle2 className="w-3 h-3" />
                                  已审核可用来源
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                  官方渠道登记
                                </span>
                              )}
                              {item.riskLevel === 'HIGH' && (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold">
                                  <AlertTriangle className="w-3 h-3" />
                                  操作高风险 · 需备份
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                              <strong className="text-slate-700 dark:text-slate-200">用途：</strong>
                              {item.rolePurpose}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              安装建议：{item.installTip}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                          <Link
                            to={`/software/${item.slug}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#1769D2] dark:hover:bg-[#1769D2] text-slate-700 dark:text-slate-200 hover:text-white text-xs font-semibold transition-colors"
                          >
                            <span>查看详情与官方源</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 官方外部渠道提示（如显卡官网、游戏中心） */}
        {activePlan.externalChannelHints.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {activePlan.externalChannelHints.map((hint, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#1769D2] shrink-0" />
                    <span className="text-[11px] font-semibold text-[#1769D2] dark:text-blue-400">
                      {hint.channelLabel}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{hint.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{hint.description}</p>
                </div>
                {hint.internalRoute ? (
                  <Link
                    to={hint.internalRoute}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-[#1769D2] hover:border-[#1769D2]"
                  >
                    查看指引 →
                  </Link>
                ) : hint.url ? (
                  <a
                    href={hint.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-[#1769D2] hover:border-[#1769D2]"
                  >
                    官网入口 ↗
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* 底部安全清单导出操作条 */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            已为您保留当前选择状态（无需登录）。导出仅生成装机文本/JSON 目录，不触发任何自动下载程序。
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copySuccess ? '已复制文本清单' : '复制文本'}</span>
            </button>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleExportTxt}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1769D2] hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold shadow-2xs cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>导出 TXT 清单 ({selectedCount})</span>
            </button>
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 disabled:opacity-40 text-white text-xs font-semibold shadow-2xs cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>导出 JSON 清单</span>
            </button>
          </div>
        </div>
      </section>

      {/* 查看已选软件弹窗 */}
      {previewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="已选装机软件清单预览"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {activePlan.title} · 已选装机清单 ({selectedCount} 款)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  按推荐安装顺序排列，点击名称可直接跳转对应软件官方下载页
                </p>
              </div>
              <button
                type="button"
                aria-label="关闭预览弹窗"
                onClick={() => setPreviewOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
              {selectedCount === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  当前未勾选任何软件，请返回列表勾选用到的装机软件。
                </div>
              ) : (
                selectedItems.map((it, idx) => (
                  <div
                    key={it.slug}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded bg-blue-50 dark:bg-blue-950 text-[#1769D2] text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <Link
                          to={`/software/${it.slug}`}
                          onClick={() => setPreviewOpen(false)}
                          className="text-sm font-semibold text-slate-900 dark:text-white hover:text-[#1769D2]"
                        >
                          {it.name}
                        </Link>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {it.groupName} · {it.latestVersion ? getSimpleVersion(it.latestVersion) : '最新版'} · {getSourceLabel(it)}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/software/${it.slug}`}
                      onClick={() => setPreviewOpen(false)}
                      className="text-xs font-semibold text-[#1769D2] shrink-0 hover:underline"
                    >
                      详情 →
                    </Link>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={handleExportTxt}
                className="px-3.5 py-1.5 rounded-lg bg-[#1769D2] hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
              >
                导出 TXT 清单
              </button>
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={handleExportJson}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
              >
                导出 JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
