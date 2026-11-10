import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Globe,
  Upload,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  RefreshCw,
  Loader2,
  Check,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  parseImportCsv,
  importFromUrl,
  getImportBatches,
  getImportBatchDetail,
  reviewImportItem,
} from '../../services/operationsService';

export const AdminImportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'csv' | 'url' | 'batches'>('csv');
  const [csvText, setCsvText] = useState(
    '软件名称,英文名称,开发商,分类,官方网址,版本,平台,授权类型,软件介绍\nVS Code,Visual Studio Code,Microsoft,开发工具,https://code.visualstudio.com,1.95.0,Windows 10/11,FREE,微软开源全功能代码编辑器与轻量 IDE\nOBS Studio,Open Broadcaster Software,OBS Project,视频制作,https://obsproject.com,30.2.3,Windows 10/11,FREE,免费开源的视频录制与跨平台直播串流工具'
  );
  const [targetUrl, setTargetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 批次与项目列表
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [isBatchLoading, setIsBatchLoading] = useState(false);

  const loadBatches = async () => {
    setIsBatchLoading(true);
    try {
      const res = await getImportBatches();
      if (res.success && res.data) {
        setBatches(res.data.items || []);
        if (res.data.items?.length > 0 && !selectedBatch) {
          handleSelectBatch(res.data.items[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleSelectBatch = async (batchId: string) => {
    setIsBatchLoading(true);
    try {
      const res = await getImportBatchDetail(batchId);
      if (res.success && res.data) {
        setSelectedBatch(res.data);
      }
    } finally {
      setIsBatchLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleCsvSubmit = async () => {
    if (!csvText.trim()) return;
    setIsLoading(true);
    setResultMessage(null);
    try {
      const res = await parseImportCsv(csvText);
      if (res.success && res.data) {
        setResultMessage({
          type: 'success',
          text: `CSV 解析成功！批次 "${res.data.batchName}" 共导入 ${res.data.totalCount} 条，完全匹配 ${res.data.exactMatchCount} 条，全新资源 ${res.data.newCount} 条，待审冲突 ${res.data.conflictCount} 条。`,
        });
        await loadBatches();
        if (res.data.batchId) handleSelectBatch(res.data.batchId);
        setActiveTab('batches');
      } else {
        setResultMessage({ type: 'error', text: res.message || '导入解析失败' });
      }
    } catch (err: any) {
      setResultMessage({ type: 'error', text: err.message || '网络异常' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!targetUrl.trim()) return;
    setIsLoading(true);
    setResultMessage(null);
    try {
      const res = await importFromUrl(targetUrl);
      if (res.success && res.data) {
        setResultMessage({
          type: 'success',
          text: `公开元数据抓取完成！软件 "${res.data.item?.name}" (v${res.data.item?.version})，去重判定为: ${res.data.matchStatus}。已进入审核池。`,
        });
        await loadBatches();
        setActiveTab('batches');
      } else {
        setResultMessage({ type: 'error', text: res.message || 'URL 导入失败' });
      }
    } catch (err: any) {
      setResultMessage({ type: 'error', text: err.message || '网络异常' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (itemId: string, action: 'APPROVE' | 'REJECT' | 'RESOLVE_CONFLICT') => {
    if (!selectedBatch) return;
    try {
      const res = await reviewImportItem(selectedBatch.id, itemId, action);
      if (res.success) {
        await handleSelectBatch(selectedBatch.id);
      } else {
        alert(res.message || '审核处理失败');
      }
    } catch (err: any) {
      alert(err.message || '请求异常');
    }
  };

  return (
    <AdminLayout title="批量收录与去重冲突解决">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            软件批量收录与去重中心
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            支持 RFC 4180 标准 CSV 表格导入、官方项目 URL 元数据探测，严密去重冲突审核流，防止错误覆盖已发布资源
          </p>
        </div>

        {/* 顶部标签切换 */}
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'csv' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            CSV 表格导入
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'url' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            官方项目 URL 导入
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'batches' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            批次审核与解决冲突
          </button>
        </div>
      </div>

      {resultMessage && (
        <div
          className={`p-3.5 rounded-xl mb-6 text-xs flex items-center gap-2 ${
            resultMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          {resultMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{resultMessage.text}</span>
        </div>
      )}

      {/* 选项卡一：CSV 批量导入 */}
      {activeTab === 'csv' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">粘贴或上传标准 CSV 文本</h3>
          <p className="text-xs text-slate-500 mb-4">
            必填表头包含：软件名称, 开发商, 分类, 官方网址, 版本, 平台, 授权类型, 软件介绍。系统会自动根据官方域名、开发者与 Slug 执行去重分析。
          </p>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={8}
            className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="软件名称,英文名称,开发商,分类,官方网址,版本,平台,授权类型,软件介绍..."
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCsvSubmit}
              disabled={isLoading || !csvText.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              开始解析并创建待审批次
            </button>
          </div>
        </div>
      )}

      {/* 选项卡二：URL 自动解析 */}
      {activeTab === 'url' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">官方项目 URL 探测收录</h3>
          <p className="text-xs text-slate-500 mb-4">
            输入开源软件的官方 GitHub / GitLab 仓库（如 https://github.com/obsproject/obs-studio）或已验证的官方网站。系统只抓取公开元数据与发行版信息，内置 SSRF 防护。
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://github.com/owner/repo 或 https://example.com"
              className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleUrlSubmit}
              disabled={isLoading || !targetUrl.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              探测并生成候选
            </button>
          </div>
        </div>
      )}

      {/* 选项卡三：批次审核与解决冲突 */}
      {activeTab === 'batches' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 左侧批次列表 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">导入批次历史</span>
              <button onClick={loadBatches} className="text-slate-400 hover:text-slate-600">
                <RefreshCw className={`w-3.5 h-3.5 ${isBatchLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {batches.map((b) => (
                <div
                  key={b.id}
                  onClick={() => handleSelectBatch(b.id)}
                  className={`p-3 rounded-lg border cursor-pointer text-xs transition-all ${
                    selectedBatch?.id === b.id
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{b.name}</div>
                  <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                    <span>{b.importType} · {b.totalCount} 项</span>
                    <span className="text-blue-600 font-medium">{b.status}</span>
                  </div>
                </div>
              ))}
              {batches.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">暂无导入批次</div>
              )}
            </div>
          </div>

          {/* 右侧批次明细与审核 */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            {selectedBatch ? (
              <div>
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedBatch.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      总数: {selectedBatch.totalCount} | 成功: {selectedBatch.successCount} | 失败: {selectedBatch.failedCount}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    {selectedBatch.status}
                  </span>
                </div>

                {/* 项目表格 */}
                <div className="space-y-3">
                  {selectedBatch.items?.map((it: any) => {
                    const matchBadge = {
                      EXACT_MATCH: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      POSSIBLE_DUPLICATE: 'bg-amber-100 text-amber-800 border-amber-200',
                      CONFLICT: 'bg-rose-100 text-rose-800 border-rose-200',
                      NEW_RESOURCE: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                    }[it.matchStatus as string] || 'bg-slate-100 text-slate-800 border-slate-200';

                    return (
                      <div
                        key={it.id}
                        className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 mr-2">{it.name}</span>
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${matchBadge}`}>
                              {it.matchStatus}
                            </span>
                          </div>
                          <span className="text-[10px] font-medium text-slate-500">
                            审核状态: {it.reviewStatus}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 mb-2">
                          <div>开发商: {it.developer || '未知'}</div>
                          <div>版本: {it.version || '未指定'}</div>
                          <div className="col-span-2 truncate">官网: {it.officialUrl || '-'}</div>
                        </div>

                        {it.matchReason && (
                          <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] mb-3">
                            <strong>去重分析：</strong>{it.matchReason}
                          </div>
                        )}

                        {it.reviewStatus === 'PENDING' && (
                          <div className="flex gap-2 justify-end pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                            <button
                              onClick={() => handleReview(it.id, 'APPROVE')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> 确认入库(草稿)
                            </button>
                            <button
                              onClick={() => handleReview(it.id, 'RESOLVE_CONFLICT')}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-medium flex items-center gap-1"
                            >
                              强制新建(解决冲突)
                            </button>
                            <button
                              onClick={() => handleReview(it.id, 'REJECT')}
                              className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] font-medium flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> 驳回跳过
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {(!selectedBatch.items || selectedBatch.items.length === 0) && (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      该批次无项目记录
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400 text-xs">
                请在左侧选择一个导入批次查看明细
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
