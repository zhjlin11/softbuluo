import React, { useState, useEffect } from 'react';
import {
  Link2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Loader2,
  XCircle,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { adminGetDownloadSources, adminCheckDownloadSource } from '../../services/resourceService';

export const AdminSourcesPage: React.FC = () => {
  const [sources, setSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  // 单独手动测试 URL
  const [manualUrl, setManualUrl] = useState('');
  const [isManualChecking, setIsManualChecking] = useState(false);
  const [manualResult, setManualResult] = useState<any>(null);

  const loadSources = async () => {
    setIsLoading(true);
    try {
      const res = await adminGetDownloadSources();
      if (res.success) {
        setSources(res.data || []);
      }
    } catch (err) {
      console.error('加载下载源失败', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleCheckSource = async (source: any) => {
    setTestingId(source.id);
    setTestResult(null);
    try {
      const res = await adminCheckDownloadSource(source.url, source.id);
      if (res.success) {
        setTestResult({
          sourceName: source.sourceName,
          ...res.data,
        });
        loadSources();
      } else {
        alert(res.error?.message || '检测失败');
      }
    } catch (err: any) {
      alert('网络异常: ' + err.message);
    } finally {
      setTestingId(null);
    }
  };

  const handleManualCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    setIsManualChecking(true);
    setManualResult(null);
    try {
      const res = await adminCheckDownloadSource(manualUrl.trim());
      setManualResult(res.success ? res.data : { error: res.error?.message });
    } catch (err: any) {
      setManualResult({ error: err.message });
    } finally {
      setIsManualChecking(false);
    }
  };

  const handleReviewSource = async (id: string, action: 'APPROVE' | 'DISABLE') => {
    try {
      const res = await fetch(`/api/v1/admin/download-sources/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      }).then((r) => r.json());
      if (res.success) {
        loadSources();
      } else {
        alert(res.error?.message || '审核操作失败');
      }
    } catch (err: any) {
      alert('网络异常: ' + err.message);
    }
  };

  return (
    <AdminLayout title="官方下载地址与安全检测">
      {/* 顶部介绍与反 SSRF 机制说明 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>官方下载源有效性与反 SSRF 检测引擎</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              系统集成了自动化逐跳 IP 安全校验。严禁探测内网私网地址 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 云元数据 169.254.169.254)，全面阻断 SSRF 攻击。
            </p>
          </div>

          <button
            onClick={loadSources}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>刷新列表</span>
          </button>
        </div>

        {/* 手动 URL 安全探测测试工具 */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={handleManualCheck} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="输入待检测的链接 (例如: https://code.visualstudio.com 或测试探测 http://127.0.0.1)"
              className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isManualChecking}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              {isManualChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>安全合规检测</span>
            </button>
          </form>

          {manualResult && (
            <div className={`mt-3 p-3.5 rounded-xl border text-xs ${
              manualResult.verificationStatus === 'VERIFIED'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 border-rose-200'
            }`}>
              <div className="font-semibold mb-1">
                检测结论: {manualResult.verificationStatus === 'VERIFIED' ? '✅ 安全可达 (Verified)' : '❌ 拦截或不可达 (Blocked / Failed)'}
              </div>
              <div className="text-[11px] font-mono space-y-0.5">
                <div>目标 URL: {manualResult.url || manualUrl}</div>
                <div>HTTP 状态码: {manualResult.httpStatus || 'N/A'}</div>
                <div>响应耗时: {manualResult.responseTimeMs ? `${manualResult.responseTimeMs} ms` : 'N/A'}</div>
                {manualResult.error && <div className="text-rose-600 font-semibold">原因: {manualResult.error}</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 实时单项检测反馈卡片 */}
      {testResult && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs flex items-center justify-between">
          <div>
            <span className="font-bold text-blue-900 dark:text-blue-200 block mb-1">
              下载源 [{testResult.sourceName}] 实时检测完成
            </span>
            <span className="font-mono text-slate-600 dark:text-slate-400">
              状态: {testResult.verificationStatus} | HTTP: {testResult.httpStatus || '无'} | 耗时: {testResult.responseTimeMs}ms
              {testResult.error && ` | 提示: ${testResult.error}`}
            </span>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-xs text-blue-600 hover:underline cursor-pointer"
          >
            关闭反馈
          </button>
        </div>
      )}

      {/* 下载源数据表格 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">下载源通道名称</th>
                <th className="py-3 px-4">所属软件与版本</th>
                <th className="py-3 px-4">目标下载地址</th>
                <th className="py-3 px-4">最近 HTTP 状态</th>
                <th className="py-3 px-4">来源验证状态</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    正在加载下载源列表...
                  </td>
                </tr>
              ) : sources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    暂无下载源记录
                  </td>
                </tr>
              ) : (
                sources.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{s.sourceName}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                        <span className="px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold">
                          {s.sourceType}
                        </span>
                        <span className="font-mono text-slate-400">
                          {(s.platform || 'windows').toUpperCase()}/{(s.architecture || 'x64').toUpperCase()}
                        </span>
                        <span className="text-slate-400">P{s.priority ?? 10}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{s.softwareName}</span>
                      <span className="ml-1 text-[11px] font-mono text-slate-400">v{s.version}</span>
                      {s.fileName && <div className="text-[10px] font-mono text-slate-500 mt-0.5">{s.fileName}</div>}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      <a href={s.directFileUrl || s.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline inline-flex items-center gap-1">
                        <span className="truncate">{s.directFileUrl || s.url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {s.lastHttpStatus ? (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          s.lastHttpStatus >= 200 && s.lastHttpStatus < 400
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                        }`}>
                          {s.lastHttpStatus}
                        </span>
                      ) : (
                        <span className="text-slate-400">未检测</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {s.verificationStatus === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>已核验通过</span>
                        </span>
                      ) : s.verificationStatus === 'DISABLED' ? (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-semibold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>已停用</span>
                        </span>
                      ) : s.verificationStatus === 'FAILED' ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>异常失效</span>
                        </span>
                      ) : (
                        <span className="text-amber-600 text-[11px] font-medium">待检测</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleCheckSource(s)}
                        disabled={testingId === s.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {testingId === s.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>检测</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3 h-3" />
                            <span>巡检</span>
                          </>
                        )}
                      </button>
                      {s.isActive ? (
                        <button
                          onClick={() => handleReviewSource(s.id, 'DISABLE')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          停用
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReviewSource(s.id, 'APPROVE')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          启用
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
