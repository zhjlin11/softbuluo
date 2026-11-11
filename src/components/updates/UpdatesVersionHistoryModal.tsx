import React, { useEffect, useState } from 'react';
import { X, History, Calendar, Download, ShieldCheck, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { fetchSoftwareVersionHistory, SoftwareVersionHistoryData } from '../../services/updatesService';
import { SoftwareIcon } from '../common/SoftwareIcon';

interface UpdatesVersionHistoryModalProps {
  softwareId: string | null;
  onClose: () => void;
}

export const UpdatesVersionHistoryModal: React.FC<UpdatesVersionHistoryModalProps> = ({
  softwareId,
  onClose,
}) => {
  const [data, setData] = useState<SoftwareVersionHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!softwareId) return;
    setLoading(true);
    setError(null);

    fetchSoftwareVersionHistory(softwareId)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error('加载版本历史失败:', err);
        setError('无法加载该软件的历史版本信息');
      })
      .finally(() => setLoading(false));
  }, [softwareId]);

  if (!softwareId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#131C2E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 弹窗顶栏 */}
        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <History className="w-4 h-4 text-[#1769D2]" />
            <span>软件版本演进历史</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 弹窗内容区 */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#1769D2] mb-2" />
              <p className="text-xs">正在查询官方版本档案...</p>
            </div>
          ) : error || !data ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-xs text-rose-500 font-semibold mb-2">{error || '未找到版本历史'}</p>
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium"
              >
                关闭
              </button>
            </div>
          ) : (
            <>
              {/* 软件主体概要 */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80">
                <SoftwareIcon
                  iconUrl={data.software.iconUrl}
                  name={data.software.name}
                  slug={data.software.slug}
                  categorySlug="software"
                  size="md"
                  className="shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {data.software.name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    发行方：{data.software.developer} · 累计归档 {data.versions.length} 个已审核版本
                  </p>
                </div>
              </div>

              {/* 版本时间轴 */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {data.versions.map((ver, idx) => (
                  <div key={ver.id} className="relative">
                    {/* 时间轴圆点 */}
                    <div
                      className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white dark:bg-[#131C2E] flex items-center justify-center ${
                        ver.isLatest
                          ? 'border-[#1769D2] text-[#1769D2]'
                          : 'border-slate-300 dark:border-slate-600 text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          ver.isLatest ? 'bg-[#1769D2]' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                    </div>

                    {/* 版本内容卡片 */}
                    <div className="p-4 rounded-xl bg-white dark:bg-[#131C2E] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                            v{ver.version}
                          </span>
                          {ver.isLatest && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                              最新稳定版
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-mono">
                            {ver.platform} ({ver.architecture})
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          发布于 {ver.releaseDate}
                        </span>
                      </div>

                      {/* 更新说明 */}
                      {ver.hasChangelog ? (
                        <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 leading-relaxed font-mono whitespace-pre-line">
                          {ver.changelog}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">官方更新说明暂未收录</p>
                      )}

                      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>安装包体积：{ver.fileSize}</span>
                        {ver.isLatest && (
                          <a
                            href={`/software/${data.software.slug}`}
                            className="text-[#1769D2] hover:underline font-semibold flex items-center gap-1"
                          >
                            <span>前往下载</span>
                            <ArrowRight className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 弹窗底栏 */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
