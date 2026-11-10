import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ExternalLink, ShieldCheck, CheckCircle2, Download, HardDrive, Calendar, User, Cpu, FileText } from 'lucide-react';
import { SoftwareItem } from '../../types/resource';
import { recordDownloadClick } from '../../services/resourceService';
import { SoftwareIcon } from './SoftwareIcon';

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
    recordDownloadClick(software.id, sourceId, 'OFFICIAL_LINK_CLICK');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const primarySource = software.latestVersion?.downloadSources?.[0];

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
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 头部信息 */}
        <div className="flex items-start gap-4 pr-10 mb-6">
          <SoftwareIcon
            iconUrl={software.iconUrl}
            name={software.name}
            slug={software.slug}
            categorySlug={software.categorySlug}
            size="xl"
            className="border border-slate-200 dark:border-slate-800 shrink-0"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 id="modal-software-title" className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {software.name}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {software.englishName}
              </span>
            </div>

            {/* 极简元数据 */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{software.categoryName}</span>
              <span aria-hidden="true">·</span>
              <span>版本 {software.latestVersion?.version}</span>
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
              {software.sourceVerified ? '官方来源已核验 · 原厂分发渠道' : '官方直链待核验'}
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
                {software.latestVersion?.releaseDate}
              </div>
            </div>

            <div>
              <div className="text-slate-400 dark:text-slate-500 mb-0.5 flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" />
                <span>文件体积</span>
              </div>
              <div className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                {software.latestVersion?.fileSize}
              </div>
            </div>

            <div>
              <div className="text-slate-400 dark:text-slate-500 mb-0.5 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" />
                <span>适用环境</span>
              </div>
              <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                {software.latestVersion?.platform?.join(' / ')}
              </div>
            </div>
          </div>

          {/* 更新日志 */}
          {software.latestVersion?.changelog && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                v{software.latestVersion.version} 更新摘要
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800 leading-relaxed font-mono">
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

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              to={`/software/${software.slug}`}
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>独立详情页</span>
            </Link>

            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              关闭
            </button>

            {primarySource && (
              <button
                onClick={() => handleDownloadClick(primarySource.id, primarySource.url)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>前往官方渠道</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
