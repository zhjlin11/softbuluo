import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Loader2,
  Layers,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  getJobs,
  triggerJob,
  getJobRuns,
} from '../../services/operationsService';

export const AdminJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [isRunsLoading, setIsRunsLoading] = useState(false);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const res = await getJobs();
      if (res.success && res.data) {
        setJobs(res.data.items || []);
        if (res.data.items?.length > 0 && !selectedJob) {
          handleSelectJob(res.data.items[0]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectJob = async (job: any) => {
    setSelectedJob(job);
    setIsRunsLoading(true);
    try {
      const res = await getJobRuns(job.id);
      if (res.success && res.data) {
        setRuns(res.data.items || []);
      }
    } finally {
      setIsRunsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleTrigger = async (jobId: string) => {
    setTriggeringId(jobId);
    try {
      const res = await triggerJob(jobId);
      if (res.success) {
        await loadJobs();
        if (selectedJob?.id === jobId) {
          await handleSelectJob(selectedJob);
        }
      } else {
        alert(res.message || '触发作业失败');
      }
    } finally {
      setTriggeringId(null);
    }
  };

  return (
    <AdminLayout title="自动化任务调度中心">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            后台自动作业与任务调度中心
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            管理定时版本扫描、全站链接健康巡检、资源完整度打分等异步作业，严格基于数据库租约锁防止重复并发
          </p>
        </div>

        <button
          onClick={loadJobs}
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg border border-slate-200 dark:border-slate-800"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左侧作业定义列表 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm text-xs">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">系统后台任务 ({jobs.length})</h3>
          <div className="space-y-2">
            {jobs.map((j) => (
              <div
                key={j.id}
                onClick={() => handleSelectJob(j)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedJob?.id === j.id
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{j.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      j.status === 'RUNNING'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : j.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {j.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-1">{j.description}</div>
                <div className="text-[10px] text-slate-400 mt-2 flex justify-between items-center">
                  <span>周期: {j.cronExpr || '定时执行'}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTrigger(j.id);
                    }}
                    disabled={triggeringId === j.id}
                    className="px-2 py-0.5 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 flex items-center gap-0.5"
                  >
                    {triggeringId === j.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Play className="w-2.5 h-2.5" />}
                    立即执行
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧执行历史明细 */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm text-xs">
          {selectedJob ? (
            <div>
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedJob.name} - 执行流水记录</h3>
                  <p className="text-slate-500 mt-0.5 text-[11px]">{selectedJob.description}</p>
                </div>
                <button
                  onClick={() => handleSelectJob(selectedJob)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-3">
                {runs.map((r) => {
                  const statusBadge = {
                    SUCCEEDED: 'bg-emerald-100 text-emerald-800',
                    FAILED: 'bg-rose-100 text-rose-800',
                    RUNNING: 'bg-blue-100 text-blue-800 animate-pulse',
                    PENDING: 'bg-amber-100 text-amber-800',
                  }[r.status as string] || 'bg-slate-100 text-slate-800';

                  const duration = r.finishedAt && r.startedAt
                    ? `${Math.round((new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) / 1000)} 秒`
                    : '执行中...';

                  return (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusBadge}`}>
                          {r.status}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          开始时间: {new Date(r.startedAt).toLocaleString()} · 耗时: {duration}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 mb-2">
                        <div>处理成功: <strong className="text-emerald-600">{r.successCount}</strong> 条</div>
                        <div>异常失败: <strong className="text-rose-600">{r.failureCount}</strong> 条</div>
                      </div>

                      {r.logs && (
                        <div className="p-2 rounded bg-slate-900 text-slate-200 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap">
                          {r.logs}
                        </div>
                      )}

                      {r.errorSummary && (
                        <div className="text-rose-500 font-medium text-[11px] mt-1">
                          错误摘要: {r.errorSummary}
                        </div>
                      )}
                    </div>
                  );
                })}

                {runs.length === 0 && !isRunsLoading && (
                  <div className="py-12 text-center text-slate-400">
                    该任务尚未产生执行历史
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400">
              请在左侧选择一个后台任务查看执行记录
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
