import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Plus,
  Upload,
  Search,
  CheckCircle,
  AlertCircle,
  Layers,
  ArrowUpRight,
  TrendingUp,
  X,
} from 'lucide-react';
import { GrowthService } from '../../services/growthService';

export const AdminKeywordsPage: React.FC = () => {
  const [keywords, setKeywords] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [intentFilter, setIntentFilter] = useState('');
  const [searchTopic, setSearchTopic] = useState('');

  // 弹窗状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newIntent, setNewIntent] = useState('SOFTWARE_DOWNLOAD');
  const [newTopic, setNewTopic] = useState('开发工具');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newTargetType, setNewTargetType] = useState('SOFTWARE');
  const [batchText, setBatchText] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadData(1);
  }, [intentFilter]);

  const loadData = async (p = 1) => {
    setIsLoading(true);
    try {
      const res = await GrowthService.adminGetKeywords(p, 20, intentFilter || undefined, searchTopic || undefined);
      if (res.success && res.data) {
        setKeywords(res.data.items || []);
        setStats(res.data.stats || null);
        setTotalPages(res.data.totalPages || 1);
        setPage(p);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionFeedback(null);
    try {
      const res = await GrowthService.adminCreateKeyword({
        keyword: newKeyword,
        intent: newIntent,
        topic: newTopic,
        priority: newPriority,
        targetPageType: newTargetType,
      });
      if (res.success) {
        setActionFeedback('关键词已成功收录！');
        setNewKeyword('');
        setTimeout(() => {
          setShowAddModal(false);
          setActionFeedback(null);
          loadData(1);
        }, 1000);
      } else {
        setActionFeedback(res.error || '录入失败');
      }
    } catch (err: any) {
      setActionFeedback(err.message || '请求错误');
    }
  };

  const handleBatchImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionFeedback(null);
    const lines = batchText.split('\n').map((l) => l.trim()).filter(Boolean);
    const items = lines.map((l) => {
      const parts = l.split(',');
      return {
        keyword: parts[0]?.trim(),
        intent: parts[1]?.trim() || 'SOFTWARE_DOWNLOAD',
        topic: parts[2]?.trim() || '通用工具',
      };
    });

    try {
      const res = await GrowthService.adminImportKeywords(items);
      if (res.success) {
        setActionFeedback(`成功导入 ${res.data.importedCount} 个词，跳过/重复 ${res.data.skippedCount} 个`);
        setBatchText('');
        setTimeout(() => {
          setShowBatchModal(false);
          setActionFeedback(null);
          loadData(1);
        }, 1500);
      } else {
        setActionFeedback(res.error || '导入失败');
      }
    } catch (err: any) {
      setActionFeedback(err.message || '请求错误');
    }
  };

  const intentLabels: Record<string, string> = {
    SOFTWARE_DOWNLOAD: '软件下载',
    GAME_DISCOVERY: '游戏获取',
    COMPARISON_SELECTION: '选型对比',
    ALTERNATIVE_SEARCH: '替代方案',
    TUTORIAL_GUIDE: '教程指南',
    GENERAL_INFO: '通用信息',
  };

  return (
    <div className="space-y-6">
      {/* 顶部标题与统计大盘 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-600" />
            SEO 核心关键词与内容增长库
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            监控搜索引擎长尾词、用户检索意图与未覆盖的内容缺口，驱动精细化页面生产。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBatchModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50"
          >
            <Upload className="w-3.5 h-3.5" />
            批量导入 CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-3.5 h-3.5" />
            录入核心词
          </button>
        </div>
      </div>

      {/* 意图与指标概览 */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">总监控词量</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.totalKeywords}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">软件下载意图</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {stats.byIntent?.SOFTWARE_DOWNLOAD || 0}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">选型对比与替代</span>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {(stats.byIntent?.COMPARISON_SELECTION || 0) + (stats.byIntent?.ALTERNATIVE_SEARCH || 0)}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">待覆盖内容缺口</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {stats.gapCount || 0}
            </div>
          </div>
        </div>
      )}

      {/* 过滤栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setIntentFilter('')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              intentFilter === ''
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            全部意图
          </button>
          {Object.entries(intentLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setIntentFilter(key)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                intentFilter === key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="按分类/领域过滤..."
            value={searchTopic}
            onChange={(e) => setSearchTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData(1)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs w-40"
          />
          <button
            onClick={() => loadData(1)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs"
          >
            筛选
          </button>
        </div>
      </div>

      {/* 关键词表格 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="p-3.5 font-semibold">关键词</th>
                <th className="p-3.5 font-semibold">检索意图</th>
                <th className="p-3.5 font-semibold">所属领域</th>
                <th className="p-3.5 font-semibold">优先级</th>
                <th className="p-3.5 font-semibold">目标承载页</th>
                <th className="p-3.5 font-semibold">收录时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    正在查询关键词库...
                  </td>
                </tr>
              ) : keywords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    暂无符合条件的关键词记录
                  </td>
                </tr>
              ) : (
                keywords.map((kw) => (
                  <tr key={kw.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                      {kw.keyword}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        {intentLabels[kw.intent] || kw.intent}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {kw.topic || '通用'}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`font-semibold ${
                          kw.priority === 'HIGH'
                            ? 'text-rose-600'
                            : kw.priority === 'MEDIUM'
                            ? 'text-blue-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {kw.priority}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {kw.targetPageType || '软件详情页'}
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(kw.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 录入新词弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              录入 SEO 核心关键词
            </h3>
            {actionFeedback && (
              <div className="p-3 mb-4 rounded-lg bg-blue-50 text-blue-700 text-xs">
                {actionFeedback}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  关键词 (唯一)
                </label>
                <input
                  type="text"
                  required
                  placeholder="如：potplayer 官方下载"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    检索意图
                  </label>
                  <select
                    value={newIntent}
                    onChange={(e) => setNewIntent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {Object.entries(intentLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    所属主题/分类
                  </label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold"
                >
                  确认保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 批量导入弹窗 */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setShowBatchModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              批量导入关键词 (CSV / 多行文本)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              格式：<code>关键词,检索意图(选填),领域分类(选填)</code>，每行一条记录。
            </p>
            {actionFeedback && (
              <div className="p-3 mb-4 rounded-lg bg-blue-50 text-blue-700 text-xs">
                {actionFeedback}
              </div>
            )}
            <form onSubmit={handleBatchImport} className="space-y-3.5 text-xs">
              <textarea
                required
                rows={6}
                placeholder="git 官方安装包,SOFTWARE_DOWNLOAD,开发工具&#10;vscode 和 sublime,COMPARISON_SELECTION,代码编辑"
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold"
                >
                  执行批量导入
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
