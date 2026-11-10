import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Key, Activity, Clock, ShieldCheck, Loader2 } from 'lucide-react';

export const AdminApiKeysPage: React.FC = () => {
  const [usageData, setUsageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/admin/api-keys/usage')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setUsageData(json.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AdminLayout title="开放 API 监控与密钥治理">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-purple-600" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">开放 API 监控与密钥治理</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          实时监控公共只读 API 流量、限流触发频率及开发者活跃凭证
        </p>
      </div>

      {/* 统计指标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
          <span className="text-xs text-slate-400">总调用次数 (累积)</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {usageData?.totalCalls?.toLocaleString() || 0}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
          <span className="text-xs text-slate-400">活跃开发者 API Key</span>
          <div className="text-2xl font-black text-purple-600 mt-1 font-mono">
            {usageData?.activeKeysCount || 0}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
          <span className="text-xs text-slate-400">安全防护模式</span>
          <div className="text-base font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>滑动窗口限流生效中</span>
          </div>
        </div>
      </div>

      {/* 实时请求日志 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-500" />
            <span>近期 API 请求流水记录 (最近 50 笔)</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">只读端点审计</span>
        </div>

        <div className="overflow-x-auto text-xs font-mono">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
              <span>加载 API 调用流水中...</span>
            </div>
          ) : !usageData?.recentCalls || usageData.recentCalls.length === 0 ? (
            <div className="p-12 text-center text-slate-400">暂无 API 请求流水记录</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 border-b border-slate-100 dark:border-slate-800 text-[11px]">
                <tr>
                  <th className="p-3">调用时间</th>
                  <th className="p-3">请求方式</th>
                  <th className="p-3">API 端点</th>
                  <th className="p-3">状态码</th>
                  <th className="p-3">耗时</th>
                  <th className="p-3">客户端 IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {usageData.recentCalls.map((call: any) => (
                  <tr key={call.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 text-slate-400">{new Date(call.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3 font-bold text-blue-600">{call.method}</td>
                    <td className="p-3 text-slate-800 dark:text-slate-200">{call.endpoint}</td>
                    <td className="p-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          call.statusCode < 300
                            ? 'bg-emerald-50 text-emerald-600'
                            : call.statusCode === 429
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {call.statusCode}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{call.responseTimeMs}ms</td>
                    <td className="p-3 text-slate-400">{call.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
