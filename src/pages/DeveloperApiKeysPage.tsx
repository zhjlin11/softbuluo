import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Key,
  Plus,
  ArrowLeft,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Trash2,
  ShieldCheck,
  Layers,
  Loader2
} from 'lucide-react';
import {
  getDeveloperApiKeys,
  createDeveloperApiKey,
  revokeDeveloperApiKey
} from '../services/developerService';

export const DeveloperApiKeysPage: React.FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyName, setKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdResult, setCreatedResult] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadKeys = () => {
    setIsLoading(true);
    getDeveloperApiKeys()
      .then((res) => {
        if (res.success) setKeys(res.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await createDeveloperApiKey(keyName.trim() || '生产集成密钥');
      if (res.success) {
        setCreatedResult(res.data);
        setKeyName('');
        loadKeys();
      } else {
        alert(res.error?.message || '创建密钥失败');
      }
    } catch (err: any) {
      alert(err.message || '网络连接异常');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`确认撤销密钥 "${name}"？撤销后使用该密钥的客户端将立即收到 401 错误且不可恢复。`)) {
      return;
    }
    try {
      const res = await revokeDeveloperApiKey(id);
      if (res.success) {
        setFeedback(`密钥 "${name}" 已成功撤销`);
        loadKeys();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyKey = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      <Link
        to="/developer"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>返回开发者门户</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">开发者 API 密钥管理</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            使用专属 API Key 获得每分钟 300 次调用配额，安全集成软件索引与版本检测
          </p>
        </div>

        <Link
          to="/developers/api"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
        >
          <span>查看开放 API 接口文档</span>
          <span>→</span>
        </Link>
      </div>

      {feedback && (
        <div className="p-3 mb-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)}>×</button>
        </div>
      )}

      {/* 创建成功后的安全展示弹框 */}
      {createdResult && (
        <div className="p-5 mb-6 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>新 API Key 已生成 (仅展示一次，请立即复制保存)</span>
          </div>
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
            为了系统安全，数据库仅保存不可逆哈希，关闭此提示后您将无法再次查看完整密钥！
          </p>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-amber-300 dark:border-amber-800 font-mono text-xs">
            <span className="flex-1 truncate text-slate-800 dark:text-slate-100 font-semibold select-all">
              {createdResult.apiKey}
            </span>
            <button
              onClick={() => copyKey(createdResult.apiKey)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? '已复制' : '复制密钥'}</span>
            </button>
          </div>

          <div className="text-right">
            <button
              onClick={() => setCreatedResult(null)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
            >
              我已妥善保存，关闭提示
            </button>
          </div>
        </div>
      )}

      {/* 创建新 Key 卡片 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-6 shadow-2xs">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-3">生成新的 API 密钥</h3>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="为密钥命名，例如：官方客户端同步、本地构建流水线..."
            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>生成 API Key</span>
          </button>
        </form>
      </div>

      {/* 现有 Key 列表 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>有效 API 密钥清单</span>
          <span className="text-slate-400 font-mono text-[11px]">{keys.length} 个密钥</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
              <span>加载密钥列表...</span>
            </div>
          ) : keys.length === 0 ? (
            <div className="p-8 text-center text-slate-400">暂未生成任何 API 密钥</div>
          ) : (
            keys.map((k) => (
              <div key={k.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{k.name}</span>
                    <span className="font-mono text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                      {k.keyPrefix}...
                    </span>
                    {k.status === 'ACTIVE' ? (
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-[10px] font-semibold rounded">
                        正常活跃
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-[10px] font-semibold rounded">
                        已撤销
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    额度等级: 300 次/分钟 · 创建时间: {new Date(k.createdAt).toLocaleDateString()} ·
                    最后调用: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : '尚未调用'}
                  </div>
                </div>

                <div>
                  {k.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleRevoke(k.id, k.name)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-medium cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>撤销密钥</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 限流规则说明卡片 */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-xs text-slate-600 dark:text-slate-400">
        <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">开放 API 配额与限流规范</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300">匿名公网调用</span>
            <p className="text-[11px] text-slate-400 mt-0.5">限额 60 次/分钟 (基于客户端公网 IP 滑动窗口限流)</p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-purple-600">开发者 API Key</span>
            <p className="text-[11px] text-slate-400 mt-0.5">限额 300 次/分钟 (通过请求头 X-Api-Key 鉴权)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
