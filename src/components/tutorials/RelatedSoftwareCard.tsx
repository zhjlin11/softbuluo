import React from 'react';
import { Link } from 'react-router-dom';
import { Download, ShieldCheck, ExternalLink, Box } from 'lucide-react';
import { SoftwareIcon } from '../common/SoftwareIcon';

interface RelatedSoftwareCardProps {
  software: {
    id: string;
    name: string;
    slug: string;
    iconUrl: string | null;
    developer: string | null;
    summary?: string | null;
    category?: string | null;
    latestVersion?: string | null;
    downloadSources?: Array<{
      id: string;
      sourceName: string;
      sourceType: string;
      url: string;
      platform: string;
      verificationStatus: string;
      sha256?: string | null;
    }>;
  } | null;
}

export const RelatedSoftwareCard: React.FC<RelatedSoftwareCardProps> = ({ software }) => {
  if (!software) return null;

  const verifiedSources = software.downloadSources?.filter((s) => s.verificationStatus === 'VERIFIED') || [];
  const primarySource = software.downloadSources?.[0];

  return (
    <div className="bg-white dark:bg-[#131C2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <span className="flex items-center gap-1.5">
          <Box className="w-3.5 h-3.5 text-[#1769D2]" />
          <span>本教程实操软件</span>
        </span>
        {software.category && (
          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]">
            {software.category}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <SoftwareIcon
          iconUrl={software.iconUrl}
          name={software.name}
          slug={software.slug}
          size="md"
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {software.name}
          </h4>
          <p className="text-[11px] text-slate-400 truncate">
            {software.developer || '官方原厂出品'}
            {software.latestVersion ? ` · v${software.latestVersion}` : ''}
          </p>
        </div>
      </div>

      {software.summary && (
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3.5 leading-relaxed">
          {software.summary}
        </p>
      )}

      {/* P8.8 安全核验标记 */}
      <div className="mb-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-[11px] space-y-1">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>已接入软游部落 P8.8 原厂直链体系</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          提供厂商发布源直达，支持 SHA-256 哈希防篡改比对。
        </p>
      </div>

      <div className="space-y-2">
        <Link
          to={`/software/${software.slug}`}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#1769D2] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>前往正版软件详情下载</span>
        </Link>
      </div>
    </div>
  );
};
