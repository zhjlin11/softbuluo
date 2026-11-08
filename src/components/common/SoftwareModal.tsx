import React, { useEffect } from 'react';
import { X, ExternalLink, ShieldCheck, CheckCircle2, Download, HardDrive, Calendar, User, Cpu } from 'lucide-react';
import { SoftwareItem } from '../../types/resource';
import { recordDownloadClick } from '../../services/resourceService';

interface SoftwareModalProps {
  software: SoftwareItem | null;
  onClose: () => void;
}

export const SoftwareModal: React.FC<SoftwareModalProps> = ({ software, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (software) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [software, onClose]);

  if (!software) return null;

  const handleDownloadClick = (sourceId: string, url: string) => {
    recordDownloadClick(software.id, sourceId);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const primarySource = software.latestVersion.downloadSources[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-software-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          aria-label="关闭窗口"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 头部信息 */}
        <div className="flex items-start gap-4 pr-10 mb-6">
          <div className="w-16 h-16 shrink-0 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/20 dark:from-blue-500/20 dark:to-indigo-500/30 border border-blue-200/50 dark:border-blue-700/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl select-none">
            {software.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 id="modal-software-title" className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {software.name}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {software.englishName}
              </span>
            </div>

            {/* 极简元数据（无药丸胶囊） */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{software.categoryName}</span>
              <span aria-hidden="true">·</span>
              <span>版本 {software.latestVersion.version}</span>
              <span aria-hidden="true">·</span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">{software.licenseLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">累计获取 {software.downloadCount.toLocaleString()} 次</span>
            </div>
          </div>
        </div>

        {/* 安全与来源保障横幅 */}
        <div className="mb-6 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">
              {software.safetyScanned ? (software.scanEngine || "官方数字签名核验通过，未检出有害特征") : "官方正版原包渠道"}
            </span>
          </div>
          <a
            href={software.officialSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            <span>访问官方开发主页</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 软件介绍 */}
        <div className="space-y-4 mb-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              功能概览
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {software.description}
            </p>
          </div>

          {/* 规格参数表 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <div className="text-slate-400 dark:text-slate-500 mb-0.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>开发方</span>
              </div>
              <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                {software.developer}
              </div>
            </div>

            <div>
              <div className="text-slate-400 dark:text-slate-500 mb-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>更新日期</span>
              </div>
              <div className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                {software.latestVersion.releaseDate}
              </div>
            </div>

            <div>
              <div className="text-slate-400 dark:text-slate-500 mb-0.5 flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" />
                <span>文件体积</span>
              </div>
              <div className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                {software.latestVersion.fileSize}
              </div>
            </div>

            <div>
              <div className="text-slate-400 dark:text-slate-500 mb-0.5 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" />
                <span>适用环境</span>
              </div>
              <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                {software.latestVersion.platform.join(' / ')}
              </div>
            </div>
          </div>

          {/* 更新日志 */}
          {software.latestVersion.changelog && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                v{software.latestVersion.version} 更新摘要
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800 leading-relaxed">
                {software.latestVersion.changelog}
              </p>
            </div>
          )}

          {/* 校验哈希（安全透明） */}
          {primarySource?.fileSha256 && (
            <div className="text-[11px] text-slate-500 dark:text-slate-500">
              <span className="font-medium text-slate-600 dark:text-slate-400">官方发布 SHA-256 哈希值：</span>
              <code className="block mt-1 p-2 bg-slate-100 dark:bg-slate-800/80 rounded font-mono break-all select-all text-slate-700 dark:text-slate-300">
                {primarySource.fileSha256}
              </code>
            </div>
          )}
        </div>

        {/* 底部操作区 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>无流氓捆绑 · 杜绝虚假全网认证</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              返回首页
            </button>
            {primarySource && (
              <button
                onClick={() => handleDownloadClick(primarySource.id, primarySource.url)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <Download className="w-4 h-4" />
                <span>前往官方正版渠道</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
