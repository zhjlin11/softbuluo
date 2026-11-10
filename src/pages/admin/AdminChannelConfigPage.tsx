import React, { useCallback, useEffect, useState } from 'react';
import {
  Layers,
  Plus,
  ExternalLink,
  Trash2,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  X,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  adminDeleteChannelRecommendation,
  adminGetChannelCandidates,
  adminGetChannelRecommendations,
  adminUpdateChannelRecommendation,
  adminUpsertChannelRecommendation,
  ChannelRecommendationRecord,
} from '../../services/channelService';

const SLOT_LABELS: Record<string, string> = {
  HERO: '焦点主推 Hero',
  WEEKLY_PICK: '本周热推矩阵',
  EDITOR_PICK: '编辑精选',
  TOPIC_PICK: '专题推荐',
  CATEGORY_PICK: '分类优选',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  SOFTWARE: '桌面软件',
  TOPIC: '软件专题',
  COMPARISON: '评测对比',
  TUTORIAL: '实用教程',
  CATEGORY: '软件分类',
};

export const AdminChannelConfigPage: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState<'SOFTWARE' | 'SYSTEM_TOOLS' | 'GAMES' | 'ESSENTIALS'>('SOFTWARE');
  const [items, setItems] = useState<ChannelRecommendationRecord[]>([]);
  const [candidates, setCandidates] = useState<{
    softwares: Array<{ id: string; name: string; slug: string; category?: { name: string } }>;
    topics: Array<{ id: string; title: string; slug: string }>;
    comparisons: Array<{ id: string; title: string; slug: string }>;
    tutorials: Array<{ id: string; title: string; slug: string }>;
  }>({ softwares: [], topics: [], comparisons: [], tutorials: [] });

  const [loading, setLoading] = useState(true);
  const [activeSlotFilter, setActiveSlotFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    slot: 'WEEKLY_PICK',
    targetType: 'SOFTWARE',
    targetId: '',
    title: '',
    subtitle: '',
    badgeText: '',
    coverImage: '',
    sortOrder: 0,
    isActive: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, candRes] = await Promise.all([
        adminGetChannelRecommendations(activeChannel),
        adminGetChannelCandidates(activeChannel),
      ]);
      if (recRes.success && recRes.data) {
        setItems(recRes.data.items || []);
      }
      if (candRes.success && candRes.data) {
        setCandidates(candRes.data);
      }
    } finally {
      setLoading(false);
    }
  }, [activeChannel]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentCandidateOptions = (() => {
    if (formData.targetType === 'SOFTWARE') {
      return candidates.softwares.map((s) => ({
        id: s.id,
        label: `${s.name} (${s.category?.name || s.slug})`,
      }));
    }
    if (formData.targetType === 'TOPIC') {
      return candidates.topics.map((t) => ({ id: t.id, label: t.title }));
    }
    if (formData.targetType === 'COMPARISON') {
      return candidates.comparisons.map((c) => ({ id: c.id, label: c.title }));
    }
    if (formData.targetType === 'TUTORIAL') {
      return candidates.tutorials.map((t) => ({ id: t.id, label: t.title }));
    }
    return [];
  })();

  const handleOpenModal = () => {
    setErrorMsg(null);
    const firstSw = candidates.softwares[0]?.id || '';
    setFormData({
      slot: 'WEEKLY_PICK',
      targetType: 'SOFTWARE',
      targetId: firstSw,
      title: '',
      subtitle: '',
      badgeText: '',
      coverImage: '',
      sortOrder: items.length,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await adminUpsertChannelRecommendation(activeChannel, {
        slot: formData.slot,
        targetType: formData.targetType,
        targetId: formData.targetId,
        title: formData.title || null,
        subtitle: formData.subtitle || null,
        badgeText: formData.badgeText || null,
        coverImage: formData.coverImage || null,
        sortOrder: Number(formData.sortOrder) || 0,
        isActive: formData.isActive,
      });
      if (!res.success) {
        setErrorMsg(res.message || '保存失败');
        return;
      }
      setIsModalOpen(false);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (rec: ChannelRecommendationRecord) => {
    const res = await adminUpdateChannelRecommendation(activeChannel, rec.id, {
      isActive: !rec.isActive,
    });
    if (res.success) await loadData();
    else alert(res.message || '更新状态失败');
  };

  const handleMoveOrder = async (rec: ChannelRecommendationRecord, delta: number) => {
    const nextOrder = Math.max(0, rec.sortOrder + delta);
    const res = await adminUpdateChannelRecommendation(activeChannel, rec.id, {
      sortOrder: nextOrder,
    });
    if (res.success) await loadData();
  };

  const handleDelete = async (rec: ChannelRecommendationRecord) => {
    if (!window.confirm(`确认从「${SLOT_LABELS[rec.slot] || rec.slot}」移除「${rec.targetLabel}」吗？`)) return;
    const res = await adminDeleteChannelRecommendation(activeChannel, rec.id);
    if (res.success) await loadData();
  };

  const visibleItems =
    activeSlotFilter === 'ALL'
      ? items
      : items.filter((it) => it.slot === activeSlotFilter);

  const previewPath =
    activeChannel === 'SYSTEM_TOOLS'
      ? '/system-tools'
      : activeChannel === 'GAMES'
        ? '/games'
        : activeChannel === 'ESSENTIALS'
          ? '/essentials'
          : '/software';
  const channelTitle =
    activeChannel === 'SYSTEM_TOOLS'
      ? '系统工具频道'
      : activeChannel === 'GAMES'
        ? '游戏中心频道'
        : activeChannel === 'ESSENTIALS'
          ? '装机必备频道'
          : '电脑软件频道';

  return (
    <AdminLayout title="频道展位运营配置">
      <div className="space-y-5">
        {/* 频道切换Tab（完全隔离 SOFTWARE、SYSTEM_TOOLS、GAMES 与 ESSENTIALS） */}
        <div className="inline-flex flex-wrap p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs gap-1">
          {[
            { key: 'SOFTWARE' as const, label: '电脑软件频道 (/software)' },
            { key: 'SYSTEM_TOOLS' as const, label: '系统工具频道 (/system-tools)' },
            { key: 'GAMES' as const, label: '游戏中心频道 (/games)' },
            { key: 'ESSENTIALS' as const, label: '装机必备频道 (/essentials)' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveChannel(tab.key);
                setActiveSlotFilter('ALL');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeChannel === tab.key
                  ? 'bg-[#1769D2] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 顶部工具栏与合规提醒 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#1769D2]" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {previewPath} 焦点与编辑推荐配置（{activeChannel}）
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              安全约束：仅可推荐已发布 (PUBLISHED) 且非测试数据 (isTestData=false) 的合法资源，无法绕过审核。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={previewPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              前台预览 {previewPath}
            </a>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              刷新
            </button>
            <button
              type="button"
              onClick={handleOpenModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1769D2] hover:bg-blue-700 text-white text-xs font-medium shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              新增运营推荐
            </button>
          </div>
        </div>

        {/* 展位筛选 */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'HERO', 'WEEKLY_PICK', 'EDITOR_PICK', 'TOPIC_PICK', 'CATEGORY_PICK'].map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setActiveSlotFilter(slot)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                activeSlotFilter === slot
                  ? 'bg-[#1769D2] text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {slot === 'ALL' ? `全部展位 (${items.length})` : SLOT_LABELS[slot]}
            </button>
          ))}
        </div>

        {/* 推荐配置表 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-400">正在加载频道配置...</div>
          ) : visibleItems.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                当前展位尚未配置手动覆盖推荐（前台正自动按官方精选与真实热度有序展示）
              </p>
              <p className="text-xs text-slate-400">
                点击右上角「新增运营推荐」即可精确置顶焦点大图、本周热推、编辑精选或主题推荐
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">展位</th>
                    <th className="px-4 py-3 font-semibold">关联资源</th>
                    <th className="px-4 py-3 font-semibold">自定义标题/角标</th>
                    <th className="px-4 py-3 font-semibold">排序权重</th>
                    <th className="px-4 py-3 font-semibold">状态</th>
                    <th className="px-4 py-3 font-semibold text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visibleItems.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#1769D2] dark:text-blue-300 font-medium">
                          {SLOT_LABELS[rec.slot] || rec.slot}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {rec.targetLabel || rec.targetId}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {TARGET_TYPE_LABELS[rec.targetType] || rec.targetType}
                          {!rec.targetValid && (
                            <span className="ml-2 inline-flex items-center gap-1 text-red-500 font-medium">
                              <AlertTriangle className="w-3 h-3" />
                              {rec.targetInvalidReason || '目标未发布'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="truncate text-slate-700 dark:text-slate-300">
                          {rec.title || <span className="text-slate-400">使用原资源标题</span>}
                        </div>
                        {rec.badgeText && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px]">
                            {rec.badgeText}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="font-mono font-semibold tabular-nums">{rec.sortOrder}</span>
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(rec, -1)}
                            title="优先级提前"
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(rec, 1)}
                            title="优先级延后"
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(rec)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium cursor-pointer ${
                            rec.isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {rec.isActive ? '展示中' : '已停用'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDelete(rec)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-medium cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          移除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 新增运营推荐弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">新增{channelTitle}推荐</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    推荐展位
                  </label>
                  <select
                    value={formData.slot}
                    onChange={(e) => {
                      const nextSlot = e.target.value;
                      const defaultTargetType = nextSlot === 'TOPIC_PICK' ? 'TOPIC' : 'SOFTWARE';
                      const firstId =
                        defaultTargetType === 'TOPIC'
                          ? candidates.topics[0]?.id || ''
                          : candidates.softwares[0]?.id || '';
                      setFormData((prev) => ({
                        ...prev,
                        slot: nextSlot,
                        targetType: defaultTargetType,
                        targetId: firstId,
                      }));
                    }}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {Object.entries(SLOT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    目标类型
                  </label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => {
                      const t = e.target.value;
                      const list =
                        t === 'TOPIC'
                          ? candidates.topics
                          : t === 'COMPARISON'
                            ? candidates.comparisons
                            : t === 'TUTORIAL'
                              ? candidates.tutorials
                              : candidates.softwares;
                      setFormData((prev) => ({
                        ...prev,
                        targetType: t,
                        targetId: list[0]?.id || '',
                      }));
                    }}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="SOFTWARE">桌面软件</option>
                    <option value="TOPIC">软件专题</option>
                    <option value="COMPARISON">对比评测</option>
                    <option value="TUTORIAL">实用教程</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  选择已发布合法资源
                </label>
                <select
                  required
                  value={formData.targetId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetId: e.target.value }))}
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {currentCandidateOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    编辑覆盖标题（可选）
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="留空则使用默认标题"
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    角标标签（可选）
                  </label>
                  <input
                    type="text"
                    value={formData.badgeText}
                    onChange={(e) => setFormData((prev) => ({ ...prev, badgeText: e.target.value }))}
                    placeholder="如：官方原版 / 装机必选"
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  编辑推荐语（可选）
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="仅展位覆盖显示，不超过 120 字"
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    排序权重（越小越靠前）
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value, 10) || 0 }))
                    }
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <label className="flex items-center gap-2 h-9 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <span>立即生效展示</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 font-medium cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#1769D2] hover:bg-blue-700 text-white font-medium disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? '保存中...' : '保存推荐配置'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
