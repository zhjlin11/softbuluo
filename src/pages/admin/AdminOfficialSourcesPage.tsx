import React, { useState, useEffect } from 'react';
import {
  Globe2,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Edit,
  Trash2,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  getSources,
  createSource,
  updateSource,
  checkSource,
  testSourceUrl,
} from '../../services/operationsService';

export const AdminOfficialSourcesPage: React.FC = () => {
  const [sources, setSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [checkingId, setCheckingId] = useState<string | null>(null);

  // 弹窗状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sourceType: 'OFFICIAL_WEBSITE',
    baseUrl: '',
    officialDomain: '',
    developerName: '',
    discoveryMethod: 'SCRAPE_HTML',
    checkInterval: 1440,
  });
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSources = async () => {
    setIsLoading(true);
    try {
      const res = await getSources(1, search);
      if (res.success && res.data) {
        setSources(res.data.items || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, [search]);

  const handleTestUrl = async () => {
    if (!formData.baseUrl) return;
    setIsTestingUrl(true);
    setTestResult(null);
    try {
      const res = await testSourceUrl(formData.baseUrl);
      setTestResult(res);
      if (res.success && res.data?.verifiedDomain) {
        setFormData((prev) => ({ ...prev, officialDomain: res.data.verifiedDomain }));
      }
    } finally {
      setIsTestingUrl(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await createSource(formData);
      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          name: '',
          sourceType: 'OFFICIAL_WEBSITE',
          baseUrl: '',
          officialDomain: '',
          developerName: '',
          discoveryMethod: 'SCRAPE_HTML',
          checkInterval: 1440,
        });
        setTestResult(null);
        await loadSources();
      } else {
        alert(res.message || '创建来源失败');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckNow = async (id: string) => {
    setCheckingId(id);
    try {
      const res = await checkSource(id);
      if (res.success) {
        await loadSources();
      } else {
        alert(res.message || '检测失败');
      }
    } finally {
      setCheckingId(null);
    }
  };

  return (
    <AdminLayout title="官方资源来源管理">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-blue-600" />
            官方软件来源管理
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            配置官方网站、GitHub Releases、GitLab 等数据源，内置 SSRF 防护与域名归属核查
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadSources}
            className="p-2 text-slate-500 hover:text-slate-700 rounded-lg border border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> 新增官方来源
          </button>
        </div>
      </div>

      {/* 来源列表表格 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            <tr>
              <th className="py-3 px-4 font-semibold">来源名称与归属</th>
              <th className="py-3 px-4 font-semibold">类型 / 探测方式</th>
              <th className="py-3 px-4 font-semibold">信任状态</th>
              <th className="py-3 px-4 font-semibold">巡检周期</th>
              <th className="py-3 px-4 font-semibold">上次检测</th>
              <th className="py-3 px-4 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sources.map((s) => {
              const trustBadge = {
                VERIFIED: 'bg-emerald-100 text-emerald-800',
                PENDING: 'bg-amber-100 text-amber-800',
                REJECTED: 'bg-rose-100 text-rose-800',
                DISABLED: 'bg-slate-100 text-slate-600',
              }[s.trustStatus as string] || 'bg-slate-100 text-slate-600';

              return (
                <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>{s.developerName || '未知开发者'}</span> ·
                      <a href={s.baseUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 flex items-center gap-0.5 truncate max-w-[200px]">
                        {s.officialDomain || s.baseUrl} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{s.sourceType}</span>
                    <div className="text-[10px] text-slate-400">{s.discoveryMethod}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${trustBadge}`}>
                      {s.trustStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {Math.round(s.checkInterval / 60)} 小时
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {s.lastCheckedAt ? new Date(s.lastCheckedAt).toLocaleString() : '未检测'}
                    {s.lastError && (
                      <div className="text-rose-500 text-[10px] truncate max-w-[150px]" title={s.lastError}>
                        错误: {s.lastError}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleCheckNow(s.id)}
                      disabled={checkingId === s.id}
                      className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded transition-colors inline-flex items-center gap-1"
                    >
                      {checkingId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      立即检测
                    </button>
                  </td>
                </tr>
              );
            })}
            {sources.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  暂无已配置的官方来源记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 新增来源弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-xl text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4">
              注册官方资源来源
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">来源名称</label>
                <input
                  type="text"
                  required
                  placeholder="例如：Visual Studio Code 官方发布"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">来源类型</label>
                  <select
                    value={formData.sourceType}
                    onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="OFFICIAL_WEBSITE">官方主站</option>
                    <option value="GITHUB_RELEASES">GitHub Releases</option>
                    <option value="GITLAB_RELEASES">GitLab Releases</option>
                    <option value="OFFICIAL_RSS">官方 RSS/Feed</option>
                    <option value="OFFICIAL_API">官方 API</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">开发者/厂商名称</label>
                  <input
                    type="text"
                    required
                    placeholder="例如：Microsoft"
                    value={formData.developerName}
                    onChange={(e) => setFormData({ ...formData, developerName: e.target.value })}
                    className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  官方基准 URL (支持 SSRF 连通性测试)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    className="flex-1 p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleTestUrl}
                    disabled={isTestingUrl || !formData.baseUrl}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded font-medium shrink-0 flex items-center gap-1"
                  >
                    {isTestingUrl && <Loader2 className="w-3 h-3 animate-spin" />}
                    测试连接
                  </button>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded text-[11px] ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <div>✓ URL 安全连通，提取域名: <strong>{testResult.data?.verifiedDomain}</strong> (HTTP {testResult.data?.httpStatus})</div>
                  ) : (
                    <div>✗ 连通失败或存在安全风险: {testResult.message}</div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium flex items-center gap-1"
                >
                  {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  确认添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
