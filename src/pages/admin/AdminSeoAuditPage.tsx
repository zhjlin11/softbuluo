import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';
import { GrowthService } from '../../services/growthService';

export const AdminSeoAuditPage: React.FC = () => {
  const [audits, setAudits] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageTypeFilter, setPageTypeFilter] = useState('');
  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);

  useEffect(() => {
    loadData(1);
  }, [pageTypeFilter]);

  const loadData = async (p = 1) => {
    setIsLoading(true);
    try {
      const res = await GrowthService.adminGetSeoAuditList(p, 20, pageTypeFilter || undefined);
      if (res.success && res.data) {
        setAudits(res.data.items || []);
        setStats(res.data.stats || null);
        setPage(p);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchAudit = async () => {
    if (!window.confirm('是否立即启动全站公开页面 SEO 深度评分与质量审计？')) return;
    setIsAuditing(true);
    try {
      const res = await GrowthService.adminBatchAuditAll();
      if (res.success) {
        alert(`审计完成！共扫描 ${res.data.auditedCount} 个公开页面。全站平均得分：${res.data.averageScore} 分`);
        loadData(1);
      }
    } catch (err: any) {
      alert(`审计失败: ${err.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="space-y-6">
      {/* 顶部标题与批量触发 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            全站页面 SEO 质量与合规 0-100 审计大盘
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            实时对核心公开页面（首页、软件库、横向对比、专题）进行 TDK 长度、规范 Canonical、结构化数据与关键词密度自动化评分。
          </p>
        </div>

        <button
          onClick={handleBatchAudit}
          disabled={isAuditing}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
          {isAuditing ? '正在全站深度扫描...' : '执行全站批量审计'}
        </button>
      </div>

      {/* 审计得分大盘卡片 */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">已审计页面</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.totalAudits}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">全站健康平均分</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {stats.averageScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">优秀达标 (90+ 分)</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {stats.score90Plus || 0}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-medium">待整改 (&lt;70 分)</span>
            <div className="text-2xl font-bold text-rose-600 mt-1">
              {stats.scoreBelow70 || 0}
            </div>
          </div>
        </div>
      )}

      {/* 筛选条 */}
      <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <Filter className="w-4 h-4 text-slate-400 ml-1" />
        <span className="font-semibold text-slate-700 dark:text-slate-300">页面类型：</span>
        {['', 'HOME', 'SOFTWARE', 'COMPARISON', 'TOPIC'].map((t) => (
          <button
            key={t}
            onClick={() => setPageTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              pageTypeFilter === t
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t === '' ? '全部' : t === 'HOME' ? '首页' : t === 'SOFTWARE' ? '软件详情' : t === 'COMPARISON' ? '对比评测' : '专题'}
          </button>
        ))}
      </div>

      {/* 审计列表表格 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="p-3.5 font-semibold">页面 URL</th>
                <th className="p-3.5 font-semibold">页面类型</th>
                <th className="p-3.5 font-semibold">综合得分</th>
                <th className="p-3.5 font-semibold">发现问题项</th>
                <th className="p-3.5 font-semibold">审计时间</th>
                <th className="p-3.5 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    正在查询页面审计结果...
                  </td>
                </tr>
              ) : audits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    暂无审计记录，请点击上方“执行全站批量审计”初始化大盘
                  </td>
                </tr>
              ) : (
                audits.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-mono text-slate-800 dark:text-slate-200">
                      {a.pagePath}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {a.pageType}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-md font-bold border ${getScoreColor(a.score)}`}>
                        {a.score} 分
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        {a.issues?.length > 0 ? (
                          <span className="text-amber-600 font-semibold">
                            {a.issues.length} 项需优化
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> 完美合规
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(a.auditedAt).toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => setSelectedAudit(a)}
                        className="text-blue-600 font-semibold hover:underline"
                      >
                        查看详细诊断报告
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 详细诊断报告弹窗 */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  SEO 诊断报告：{selectedAudit.pagePath}
                </h3>
                <span className="text-xs text-slate-400">
                  综合得分：{selectedAudit.score} 分
                </span>
              </div>
              <button
                onClick={() => setSelectedAudit(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                关闭
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">优化诊断清单</h4>
                {selectedAudit.issues && selectedAudit.issues.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAudit.issues.map((it: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                          it.severity === 'HIGH'
                            ? 'bg-rose-50/60 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'bg-amber-50/60 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold">
                            [{it.severity}] {it.message}
                          </div>
                          <div className="text-[11px] opacity-90 mt-0.5">
                            整改建议：{it.suggestion}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-emerald-50 text-emerald-800 font-medium">
                    该页面各项指标表现优异，符合现代搜索引擎收录规范。
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
