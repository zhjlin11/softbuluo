import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  CheckCircle,
  XCircle,
  FileText,
  Cpu,
  Layers,
  Coins,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { GrowthService } from '../../services/growthService';

export const AdminAiAssistantPage: React.FC = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [allSoftware, setAllSoftware] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 生成工作台表单
  const [taskType, setTaskType] = useState('SOFTWARE_INTRO_DRAFT');
  const [targetSoftwareId, setTargetSoftwareId] = useState('');
  const [inputContext, setInputContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateFeedback, setGenerateFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
    fetch('/api/v1/resources?limit=100')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) setAllSoftware(res.data.items || []);
      })
      .catch(console.error);
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [provRes, taskRes, usageRes] = await Promise.all([
        GrowthService.adminGetAiProviders(),
        GrowthService.adminGetAiTasks(1, 15),
        GrowthService.adminGetAiUsage(),
      ]);

      if (provRes.success) setProviders(provRes.data || []);
      if (taskRes.success) setTasks(taskRes.data?.items || []);
      if (usageRes.success) setUsage(usageRes.data || null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContext.trim()) {
      alert('请提供事实背景或软件更新要点');
      return;
    }
    setIsGenerating(true);
    setGenerateFeedback(null);

    let softwareName = '';
    if (targetSoftwareId) {
      const s = allSoftware.find((item) => item.id === targetSoftwareId);
      if (s) softwareName = s.name;
    }

    const payloadContext = JSON.stringify({
      softwareName,
      rawFacts: inputContext,
    });

    try {
      const res = await GrowthService.adminGenerateAiDraft({
        taskType,
        targetType: 'SOFTWARE',
        targetId: targetSoftwareId || undefined,
        inputContext: payloadContext,
      });

      if (res.success) {
        setGenerateFeedback('AI 草稿已成功生成！当前状态为【待人工审核草稿】，绝未对外发布。');
        setInputContext('');
        loadAll();
      } else {
        setGenerateFeedback(res.error || '生成失败');
      }
    } catch (err: any) {
      setGenerateFeedback(err.message || '请求错误');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReviewTask = async (taskId: string, action: 'APPROVE' | 'REJECT', applyChanges = false) => {
    const feedback = action === 'REJECT' ? window.prompt('请输入驳回原因或修改意见（选填）：') || undefined : undefined;
    try {
      const res = await GrowthService.adminReviewAiTask(taskId, action, {
        applyChanges,
        feedback,
      });
      if (res.success) {
        alert(action === 'APPROVE' ? '已采纳该草稿内容！' : '已驳回该草稿。');
        loadAll();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const taskTypeLabels: Record<string, string> = {
    RELEASE_NOTES_SUMMARY: '更新日志要点速览',
    SOFTWARE_INTRO_DRAFT: '软件客观概览初稿',
    SEO_META_SUGGESTION: 'SEO Meta 客观提炼',
    COMPARISON_DRAFT: '对比评测结论建议',
    TUTORIAL_OUTLINE: '新手教程操作大纲',
  };

  return (
    <div className="space-y-6">
      {/* 顶部标题与原则警示 */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          AI 辅助运营与客观内容初稿工作台
        </h1>
        <div className="mt-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            <strong>核心运营纪律：</strong>AI 仅用于辅助生成初稿（AI_DRAFT）。所有生成内容严禁未经人工审核自动发布或覆盖正式资源，确保资源介绍客观真实、杜绝夸大宣传。
          </span>
        </div>
      </div>

      {/* Token 消耗与成本看板 */}
      {usage && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">累计辅助生成</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {usage.totalRequests} 次
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">累计消耗 Tokens</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {usage.totalTokens}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">预估商业 API 成本</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
              ¥ {usage.estimatedCostRmb}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">已激活模型 Provider</span>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {providers.length} 个
            </div>
          </div>
        </div>
      )}

      {/* 工作台左右两栏：左侧生成，右侧待审任务 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左侧：触发生成初稿 */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-600" />
            生成新的客观运营草案
          </h2>

          {generateFeedback && (
            <div className="p-3 mb-4 rounded-lg bg-blue-50 text-blue-700 text-xs">
              {generateFeedback}
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold mb-1">选择生成任务类型</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {Object.entries(taskTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">关联软件实体 (可选)</label>
              <select
                value={targetSoftwareId}
                onChange={(e) => setTargetSoftwareId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="">不关联具体软件 / 通用草案</option>
                {allSoftware.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.slug})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">
                原始事实与技术背景上下文 (输入真实信息以防止 AI 幻觉)
              </label>
              <textarea
                required
                rows={5}
                placeholder="例如粘贴官方 GitHub Release Notes、开发商公告要点、核心架构改变或已知缺陷修复..."
                value={inputContext}
                onChange={(e) => setInputContext(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 leading-relaxed font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'AI 正在分析并起草中...' : '生成待审核草案 (存入 AI_DRAFT)'}
            </button>
          </form>
        </div>

        {/* 右侧：待审核与已审核任务流 */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-purple-600" />
            AI 成果人工审核与同步流水线
          </h2>

          <div className="space-y-3 max-h-[520px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-10 text-slate-400 text-xs">加载中...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                暂无生成任务，请在左侧触发一次生成体验
              </div>
            ) : (
              tasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {taskTypeLabels[t.taskType] || t.taskType}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        t.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : t.status === 'AI_DRAFT'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {t.status === 'AI_DRAFT' ? '待审核草稿' : t.status === 'APPROVED' ? '已采纳' : '已驳回'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                    {t.generatedOutput}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span>模型: {t.modelUsed}</span>
                    <span>{new Date(t.createdAt).toLocaleTimeString()}</span>
                  </div>

                  {t.status === 'AI_DRAFT' && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleReviewTask(t.id, 'REJECT')}
                        className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                      >
                        驳回草稿
                      </button>
                      <button
                        onClick={() => handleReviewTask(t.id, 'APPROVE', true)}
                        className="px-3 py-1 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                      >
                        人工采纳并应用
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
