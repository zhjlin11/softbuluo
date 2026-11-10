import React, { useState } from 'react';
import {
  Code2,
  Settings,
  Wifi,
  Cpu,
  Palette,
  PlaySquare,
  Layers,
  Gamepad2,
  ShieldCheck,
  FileText,
  Package,
} from 'lucide-react';
import { getOfficialSoftwareLogo } from './officialLogos';

interface SoftwareIconProps {
  iconUrl?: string | null;
  name: string;
  slug?: string;
  categorySlug?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const SoftwareIcon: React.FC<SoftwareIconProps> = ({
  iconUrl,
  name,
  slug = '',
  categorySlug = '',
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const containerSizes = {
    sm: 'w-9 h-9 rounded-lg',
    md: 'w-11 h-11 rounded-xl',
    lg: 'w-14 h-14 rounded-xl',
    xl: 'w-18 h-18 rounded-2xl',
    '2xl': 'w-22 h-22 rounded-2xl',
  }[size];

  const svgSizes = {
    sm: 'w-6 h-6',
    md: 'w-8.5 h-8.5',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
    '2xl': 'w-18 h-18',
  }[size];

  // 过滤抽象占位头像 (如 Dicebear identicon 像素块)，优先使用高精度正版官方矢量 Logo
  const isDicebear = iconUrl && (iconUrl.includes('dicebear.com') || iconUrl.includes('identicon'));

  // 优先级 1: 如果提供了真实图片且非抽象占位图，展示真实图片
  if (iconUrl && !imgError && !isDicebear) {
    return (
      <div
        className={`shrink-0 overflow-hidden bg-white dark:bg-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 shadow-2xs ${containerSizes} ${className}`}
        title={name}
      >
        <img
          src={iconUrl}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // 优先级 2: 平台官方权威高精度矢量 Logo 库（涵盖全站全部 93 款软硬件与游戏）
  const officialLogo = getOfficialSoftwareLogo(slug, name, svgSizes, size);
  if (officialLogo) {
    return (
      <div
        className={`shrink-0 overflow-hidden shadow-2xs ${containerSizes} ${className}`}
        title={name}
      >
        {officialLogo}
      </div>
    );
  }

  // 优先级 3: 兜底真实图片（如果只有占位图且没有官方矢量）
  if (iconUrl && !imgError) {
    return (
      <div
        className={`shrink-0 overflow-hidden bg-white dark:bg-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 shadow-2xs ${containerSizes} ${className}`}
        title={name}
      >
        <img
          src={iconUrl}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // 优先级 4: 中性分类占位符
  const getNeutralCategoryIcon = () => {
    switch (categorySlug) {
      case 'dev':
        return <Code2 className={`${svgSizes} text-slate-500 dark:text-slate-400`} />;
      case 'sys-tools':
        return <Settings className={`${svgSizes} text-slate-500 dark:text-slate-400`} />;
      case 'network':
        return <Wifi className={`${svgSizes} text-slate-500 dark:text-slate-400`} />;
      case 'hardware':
        return <Cpu className={`${svgSizes} text-slate-500 dark:text-slate-400`} />;
      case 'graphic':
        return <Palette className={`${svgSizes} text-slate-500 dark:text-slate-400`} />;
      case 'media':
        return <PlaySquare className={`${svgSizes} text-slate-500 dark:text-slate-400`} />;
      case 'games':
        return <Gamepad2 className={`${svgSizes} text-slate-500 dark:text-slate-400`} />;
      case 'security':
        return <ShieldCheck className={`${svgSizes} text-slate-500 dark:text-slate-400`} />;
      case 'office':
        return <FileText className={`${svgSizes} text-slate-500 dark:text-slate-400`} />;
      default:
        return <Package className={`${svgSizes} text-slate-500 dark:text-slate-400`} />;
    }
  };

  return (
    <div
      className={`shrink-0 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center ${containerSizes} ${className}`}
      title={name}
    >
      {getNeutralCategoryIcon()}
    </div>
  );
};
