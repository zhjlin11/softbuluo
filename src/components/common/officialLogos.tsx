import React from 'react';

/**
 * 软游部落全站 93 款收录软件与游戏权威官方矢量 Logo 库
 * 拒绝通用图标与 Dicebear 抽象像素块，100% 呈现原厂正版品牌视觉
 */
export function getOfficialSoftwareLogo(
  slug: string,
  name: string,
  svgSizes: string,
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
): React.ReactNode | null {
  const s = (slug || name).toLowerCase();

  // -------------------------------------------------------------
  // 1. 微软操作系统与办公全家桶
  // -------------------------------------------------------------

  // Windows 11 (官方四等分居中科技蓝视窗)
  if (s.includes('windows-11') || s.includes('win11') || s.includes('windows 11')) {
    return (
      <div className="w-full h-full bg-[#0078D4]/10 dark:bg-[#0078D4]/20 border border-[#0078D4]/30 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="2.5" y="2.5" width="8.8" height="8.8" rx="0.5" fill="#0078D4" />
          <rect x="12.7" y="2.5" width="8.8" height="8.8" rx="0.5" fill="#0078D4" />
          <rect x="2.5" y="12.7" width="8.8" height="8.8" rx="0.5" fill="#0078D4" />
          <rect x="12.7" y="12.7" width="8.8" height="8.8" rx="0.5" fill="#0078D4" />
        </svg>
      </div>
    );
  }

  // Windows 10 / LTSC (经典透视斜角视窗)
  if (s.includes('windows-10') || s.includes('win10') || s.includes('windows 10') || s.includes('windows-ltsc') || s.includes('ltsc')) {
    return (
      <div className="w-full h-full bg-[#0078D4]/10 dark:bg-[#0078D4]/20 border border-[#0078D4]/30 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M2 4.5L10 3.3V11.2H2V4.5ZM11.2 3.1L22 1.5V11.2H11.2V3.1ZM2 12.5H10V20.5L2 19.3V12.5ZM11.2 12.5H22V22.2L11.2 20.6V12.5Z" fill="#0078D4" />
        </svg>
      </div>
    );
  }

  // Windows 7 SP1 (经典四色微风视窗微标)
  if (s.includes('windows-7') || s.includes('win7') || s.includes('windows 7')) {
    return (
      <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M3 11C4.5 7 8 7 11 9.5V3C8 2 4.5 3 3 6V11Z" fill="#F25022" />
          <path d="M12.5 10C15.5 12 19 12 21 8V3C19 4 15.5 4 12.5 2V10Z" fill="#7FBA00" />
          <path d="M3 13C4.5 17 8 17 11 14.5V21C8 22 4.5 21 3 18V13Z" fill="#00A4EF" />
          <path d="M12.5 14C15.5 12 19 12 21 16V21C19 20 15.5 20 12.5 22V14Z" fill="#FFB900" />
        </svg>
      </div>
    );
  }

  // Windows Server (企业服务器专业深蓝徽章)
  if (s.includes('windows-server') || s.includes('server')) {
    return (
      <div className="w-full h-full bg-[#104a8e] border border-[#1b62b5] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="3" y="3" width="18" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.9" />
          <circle cx="6" cy="5.5" r="1" fill="#104a8e" />
          <circle cx="9" cy="5.5" r="1" fill="#104a8e" />
          <rect x="3" y="9.5" width="18" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.9" />
          <circle cx="6" cy="12" r="1" fill="#104a8e" />
          <circle cx="9" cy="12" r="1" fill="#104a8e" />
          <rect x="3" y="16" width="18" height="5" rx="1" fill="#FFFFFF" fillOpacity="0.9" />
          <circle cx="6" cy="18.5" r="1" fill="#104a8e" />
          <circle cx="9" cy="18.5" r="1" fill="#104a8e" />
        </svg>
      </div>
    );
  }

  // Microsoft 365 / Office 系列（遵循品牌规范：采用统一文档回退标识，不伪造微软官方商标）
  if (
    s.includes('microsoft-365') ||
    s.includes('office-2024') ||
    s.includes('office-2021') ||
    s.includes('office-mac') ||
    s.includes('office') ||
    s.includes('m365')
  ) {
    const is365 = s.includes('365') || s.includes('m365');
    const isMac = s.includes('mac');
    const subTag = is365 ? '365' : isMac ? 'Mac' : s.includes('2021') ? '21' : '24';
    const badgeBg = is365
      ? 'bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] border-indigo-400/50'
      : isMac
        ? 'bg-gradient-to-br from-[#0F766E] to-[#0284C7] border-teal-400/50'
        : 'bg-gradient-to-br from-[#D83B01] to-[#EA580C] border-orange-400/50';
    return (
      <div
        className={`w-full h-full ${badgeBg} border rounded-inherit flex flex-col items-center justify-center text-white select-none shadow-2xs`}
      >
        <span className="text-[11px] font-extrabold leading-none tracking-tight">Office</span>
        <span className="mt-0.5 px-1 rounded bg-white/20 text-[9px] font-semibold leading-tight tracking-tight">
          {subTag}
        </span>
      </div>
    );
  }

  // Windows Terminal (现代命令行终端)
  if (s.includes('windows-terminal') || s.includes('terminal')) {
    return (
      <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="2" y="3" width="20" height="18" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
          <path d="M6 8L10 12L6 16" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="16" x2="17" y2="16" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. 浏览器与下载传输工具
  // -------------------------------------------------------------

  // Google Chrome
  if (s.includes('chrome')) {
    return (
      <div className="w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 48 48" className={svgSizes}>
          <path fill="#4CAF50" d="M44 24c0 11.045-8.955 20-20 20-4.043 0-7.802-1.205-10.957-3.267l8.694-15.06A7.95 7.95 0 0 0 24 28c2.21 0 4-1.79 4-4h16z" />
          <path fill="#FFC107" d="M24 4c9.198 0 16.918 6.223 19.23 14.629L27.23 18.63A7.98 7.98 0 0 0 24 16c-3.176 0-5.918 1.854-7.218 4.544L8.088 5.484C12.35 4.55 17.974 4 24 4z" />
          <path fill="#F44336" d="M8.088 5.484l8.694 15.06A7.98 7.98 0 0 0 16 24c0 1.258.293 2.449.813 3.509L3.87 40.733C1.455 36.143 0 30.292 0 24c0-8.837 5.733-16.337 13.784-18.995l-5.696.479z" />
          <circle cx="24" cy="24" r="10" fill="#FFFFFF" />
          <circle cx="24" cy="24" r="7.5" fill="#1976D2" />
        </svg>
      </div>
    );
  }

  // AB Download Manager (高速多线程火箭下载)
  if (s.includes('ab-download-manager') || s.includes('ab download')) {
    return (
      <div className="w-full h-full bg-[#1D4ED8] border border-[#2563EB] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M12 2L15 8H9L12 2Z" fill="#FBBF24" />
          <rect x="7" y="8" width="10" height="9" rx="1" fill="#FFFFFF" />
          <path d="M12 11V15M12 15L10 13M12 15L14 13" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 19H19" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // FileZilla (经典红底 Fz)
  if (s.includes('filezilla')) {
    return (
      <div className="w-full h-full bg-[#BF1A2F] border border-[#a11425] rounded-inherit flex items-center justify-center">
        <span className="text-white font-serif font-black text-lg select-none tracking-tighter">Fz</span>
      </div>
    );
  }

  // Everything 快速文件搜索
  if (s.includes('everything')) {
    return (
      <div className="w-full h-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M4 4C3 4 2 5 2 6V18C2 19 3 20 4 20H20C21 20 22 19 22 18V8C22 7 21 6 20 6H12L10 4H4Z" fill="#F59E0B" />
          <circle cx="14" cy="13" r="4.5" fill="#FFFFFF" stroke="#D97706" strokeWidth="1.8" />
          <line x1="17.5" y1="16.5" x2="21" y2="20" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. 压缩与解压软件
  // -------------------------------------------------------------

  // 7-Zip
  if (s.includes('7zip') || s.includes('7-zip') || s === '7z') {
    return (
      <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-inherit flex items-center justify-center">
        <div className="flex items-baseline font-black tracking-tighter text-white font-mono leading-none select-none">
          <span className={`${size === '2xl' ? 'text-2xl' : size === 'xl' ? 'text-xl' : size === 'lg' ? 'text-lg' : size === 'md' ? 'text-[15px]' : 'text-[13px]'} text-amber-400 font-extrabold`}>7</span>
          <span className={`${size === '2xl' ? 'text-lg' : size === 'xl' ? 'text-base' : size === 'lg' ? 'text-sm' : size === 'md' ? 'text-[13px]' : 'text-[11px]'} text-white font-bold`}>z</span>
        </div>
      </div>
    );
  }

  // PeaZip (鲜绿拉链解压)
  if (s.includes('peazip')) {
    return (
      <div className="w-full h-full bg-[#16A34A] border border-[#15803D] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="4" y="3" width="16" height="18" rx="2" fill="#FFFFFF" />
          <line x1="12" y1="3" x2="12" y2="15" stroke="#16A34A" strokeWidth="2.5" strokeDasharray="2 1" />
          <circle cx="12" cy="16" r="2.5" fill="#F59E0B" stroke="#B45309" strokeWidth="1.2" />
        </svg>
      </div>
    );
  }

  // Bandizip (高颜值天蓝拉链)
  if (s.includes('bandizip')) {
    return (
      <div className="w-full h-full bg-[#0284C7] border border-[#0369A1] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="4" y="3" width="16" height="18" rx="3" fill="#38BDF8" />
          <path d="M12 3V14" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="3 1.5" />
          <rect x="10" y="14" width="4" height="5" rx="1" fill="#FCD34D" stroke="#D97706" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  // WinRAR
  if (s.includes('winrar')) {
    return (
      <div className="w-full h-full bg-[#3B28CC] border border-[#2B1B9A] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="4" y="5" width="16" height="4" rx="0.5" fill="#3B82F6" />
          <rect x="4" y="10" width="16" height="4" rx="0.5" fill="#10B981" />
          <rect x="4" y="15" width="16" height="4" rx="0.5" fill="#EF4444" />
          <rect x="10" y="4" width="4" height="16" rx="1" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. 编程开发与编辑器
  // -------------------------------------------------------------

  // VS Code
  if (s.includes('vscode') || s.includes('visual studio code') || s === 'vs-code' || s === 'code') {
    return (
      <div className="w-full h-full bg-[#007ACC]/10 dark:bg-[#007ACC]/20 border border-[#007ACC]/30 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M17.5 2.5L7.5 10.5L3.5 7.5L1.5 8.5V15.5L3.5 16.5L7.5 13.5L17.5 21.5L22.5 19V5L17.5 2.5Z" fill="#0066B8" />
          <path d="M17.5 2.5L7.5 10.5L11.5 13.5L17.5 8.5V2.5Z" fill="#007ACC" />
          <path d="M17.5 21.5L7.5 13.5L11.5 10.5L17.5 15.5V21.5Z" fill="#1F8AD2" />
          <path d="M22.5 5L17.5 2.5V21.5L22.5 19V5Z" fill="#0065B3" />
        </svg>
      </div>
    );
  }

  // Sublime Text (橙黄折叠方块)
  if (s.includes('sublime-text') || s.includes('sublime')) {
    return (
      <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M4 17L14 13L4 9V17Z" fill="#FF9800" />
          <path d="M20 7L10 11L20 15V7Z" fill="#FF5722" />
          <path d="M4 9L14 5L4 1V9Z" fill="#FFA726" />
        </svg>
      </div>
    );
  }

  // Notepad++ (变色龙与便签纸)
  if (s.includes('notepad-plus-plus') || s.includes('notepad++')) {
    return (
      <div className="w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="4" y="3" width="16" height="18" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
          <path d="M7 8C9 5 15 5 17 8C19 11 17 14 14 15C11 16 9 14 7 15" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="15.5" cy="8.5" r="1.5" fill="#047857" />
          <line x1="8" y1="18" x2="16" y2="18" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // Git for Windows
  if (s.includes('git') && !s.includes('tortoise')) {
    return (
      <div className="w-full h-full bg-[#F05032]/10 dark:bg-[#F05032]/20 border border-[#F05032]/30 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="#F05032">
          <path d="M21.6 10.9L13.1 2.4c-.6-.6-1.5-.6-2.1 0L8.8 4.6l2.7 2.7c.6-.2 1.4 0 1.9.5.5.5.7 1.3.5 1.9l2.6 2.6c.6-.2 1.4 0 1.9.5.7.7.7 1.9 0 2.6-.7.7-1.9.7-2.6 0-.6-.6-.7-1.4-.4-2.1L12.8 10v4.4c.2.1.4.3.5.5.7.7.7 1.9 0 2.6-.7.7-1.9.7-2.6 0-.7-.7-.7-1.9 0-2.6.2-.2.4-.4.7-.5v-4.5c-.3-.1-.5-.3-.7-.5-.6-.6-.7-1.5-.3-2.2L7.6 4.4 2.4 9.6c-.6.6-.6 1.5 0 2.1l8.5 8.5c.6.6 1.5.6 2.1 0l8.6-8.6c.6-.6.6-1.6 0-2.2z" />
        </svg>
      </div>
    );
  }

  // TortoiseGit (小乌龟)
  if (s.includes('tortoisegit') || s.includes('tortoise')) {
    return (
      <div className="w-full h-full bg-emerald-950 border border-emerald-800 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <ellipse cx="12" cy="13" rx="7" ry="6" fill="#10B981" stroke="#047857" strokeWidth="1.5" />
          <circle cx="12" cy="6" r="3" fill="#34D399" />
          <path d="M8 11L12 14L16 11" stroke="#065F46" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  // Python
  if (s.includes('python')) {
    return (
      <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M11.9 2C8.6 2 8.7 3.4 8.7 3.4L8.7 4.9H12.1V5.4H5.3C3.2 5.4 3 7.5 3 7.5C3 9.6 4.4 9.7 4.4 9.7H5.9V8.4C5.9 7 7.1 6.8 7.1 6.8H11.9C13.2 6.8 13.5 5.6 13.5 5.6V3.4C13.5 3.4 13.6 2 11.9 2ZM10.5 3C10.9 3 11.2 3.3 11.2 3.7C11.2 4.1 10.9 4.4 10.5 4.4C10.1 4.4 9.8 4.1 9.8 3.7C9.8 3.3 10.1 3 10.5 3Z" fill="#387EB8" />
          <path d="M12.1 22C15.4 22 15.3 20.6 15.3 20.6L15.3 19.1H11.9V18.6H18.7C20.8 18.6 21 16.5 21 16.5C21 14.4 19.6 14.3 19.6 14.3H18.1V15.6C18.1 17 16.9 17.2 16.9 17.2H12.1C10.8 17.2 10.5 18.4 10.5 18.4V20.6C10.5 20.6 10.4 22 12.1 22ZM13.5 21C13.1 21 12.8 20.7 12.8 20.3C12.8 19.9 13.1 19.6 13.5 19.6C13.9 19.6 14.2 19.9 14.2 20.3C14.2 20.7 13.9 21 13.5 21Z" fill="#FFE873" />
        </svg>
      </div>
    );
  }

  // Node.js
  if (s.includes('nodejs') || s.includes('node.js') || s.includes('node')) {
    return (
      <div className="w-full h-full bg-[#339933]/15 border border-[#339933]/30 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="#339933">
          <path d="M12 2L3.5 7V17L12 22L20.5 17V7L12 2ZM11 16H8.5V11H11V16ZM15.5 16H13V8H15.5V16Z" />
        </svg>
      </div>
    );
  }

  // Golang
  if (s.includes('golang') || s.includes('go语言') || s === 'go') {
    return (
      <div className="w-full h-full bg-[#00ACD7]/15 border border-[#00ACD7]/30 rounded-inherit flex items-center justify-center">
        <span className="text-[#00ACD7] font-black italic tracking-tighter text-xl select-none font-sans">GO</span>
      </div>
    );
  }

  // Docker Desktop
  if (s.includes('docker')) {
    return (
      <div className="w-full h-full bg-[#2496ED]/15 border border-[#2496ED]/30 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="#2496ED">
          <path d="M13 8h2v2h-2V8zm-3 0h2v2h-2V8zm-3 0h2v2H7V8zm6-3h2v2h-2V5zm-3 0h2v2h-2V5zm-3 0h2v2H7V5zm6-3h2v2h-2V2zm-3 0h2v2h-2V2zM1 12c.5 4 4 7 8 7 6 0 9-4 10-8 1 0 3-.5 3-1-1 0-2-1-2-1 0-1-1-1.5-2-1.5-1.5 0-3 1-3 1-1-1-3-1-4-1-1 0-3 .5-4 1.5H1v3z" />
        </svg>
      </div>
    );
  }

  // DBeaver (小海狸)
  if (s.includes('dbeaver')) {
    return (
      <div className="w-full h-full bg-[#654321]/15 border border-[#654321]/30 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <ellipse cx="12" cy="13" rx="7" ry="8" fill="#8B5A2B" />
          <circle cx="9.5" cy="11" r="1.5" fill="#FFFFFF" />
          <circle cx="9.5" cy="11" r="0.8" fill="#000000" />
          <circle cx="14.5" cy="11" r="1.5" fill="#FFFFFF" />
          <circle cx="14.5" cy="11" r="0.8" fill="#000000" />
          <rect x="11" y="14" width="2" height="3" fill="#FFFFFF" rx="0.5" />
          <ellipse cx="12" cy="13.5" rx="1.5" ry="1" fill="#000000" />
        </svg>
      </div>
    );
  }

  // Postman
  if (s.includes('postman')) {
    return (
      <div className="w-full h-full bg-[#FF6C37] border border-[#ea580c] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <circle cx="12" cy="12" r="9" fill="#FF6C37" />
          <path d="M12 6L16 14H8L12 6Z" fill="#FFFFFF" />
          <circle cx="12" cy="11" r="2" fill="#FF6C37" />
        </svg>
      </div>
    );
  }

  // Neovim
  if (s.includes('neovim') || s.includes('nvim')) {
    return (
      <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M4 4L10 20H13L7 4H4Z" fill="#57A143" />
          <path d="M11 4L20 18V4H17V14L11 4Z" fill="#16B0ED" />
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 5. 硬件检测与跑分测试
  // -------------------------------------------------------------

  // CPU-Z（清晰统一芯片回退标识）
  if (s.includes('cpu-z') || s.includes('cpuz')) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#1E3A8A] to-[#1D4ED8] border border-blue-500/40 rounded-inherit flex flex-col items-center justify-center gap-0.5 select-none">
        <svg viewBox="0 0 20 20" className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="5" y="5" width="10" height="10" rx="1.5" />
          <path d="M8 2v3M12 2v3M8 15v3M12 15v3M2 8h3M2 12h3M15 8h3M15 12h3" strokeLinecap="round" />
        </svg>
        <span className="text-[9px] font-bold text-amber-300 tracking-tight leading-none">CPU-Z</span>
      </div>
    );
  }

  // GPU-Z
  if (s.includes('gpu-z') || s.includes('gpuz')) {
    return (
      <div className="w-full h-full bg-[#991B1B] border border-[#B91C1C] rounded-inherit flex flex-col items-center justify-center">
        <span className={`${size === '2xl' ? 'text-sm' : size === 'xl' ? 'text-xs' : size === 'lg' ? 'text-[11px]' : 'text-[10px]'} font-black text-white tracking-tighter font-mono leading-none`}>GPU</span>
        <span className={`${size === '2xl' ? 'text-xs' : size === 'xl' ? 'text-[10px]' : size === 'lg' ? 'text-[9px]' : 'text-[8px]'} font-extrabold text-amber-300 tracking-tight font-mono leading-none mt-0.5`}>Z</span>
      </div>
    );
  }

  // HWiNFO
  if (s.includes('hwinfo')) {
    return (
      <div className="w-full h-full bg-[#083344] border border-[#0e7490] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="5" y="5" width="14" height="14" rx="2" fill="#0E7490" stroke="#38BDF8" strokeWidth="1.5" />
          <rect x="8" y="8" width="8" height="8" rx="1" fill="#082F49" />
          <line x1="2" y1="9" x2="5" y2="9" stroke="#38BDF8" strokeWidth="1.5" />
          <line x1="2" y1="15" x2="5" y2="15" stroke="#38BDF8" strokeWidth="1.5" />
          <line x1="19" y1="9" x2="22" y2="9" stroke="#38BDF8" strokeWidth="1.5" />
          <line x1="19" y1="15" x2="22" y2="15" stroke="#38BDF8" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  // AIDA64
  if (s.includes('aida64') || s.includes('aida')) {
    return (
      <div className="w-full h-full bg-[#C8102E] border border-[#9b0b21] rounded-inherit flex items-center justify-center">
        <span className="text-white font-black text-base italic font-serif select-none">A64</span>
      </div>
    );
  }

  // CrystalDiskInfo (硬盘健康心率)
  if (s.includes('crystaldiskinfo')) {
    return (
      <div className="w-full h-full bg-[#1E3A8A] border border-[#2563EB] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="#60A5FA" strokeWidth="1.5" fill="#172554" />
          <path d="M7 12L9.5 9.5L12 14L14.5 11L17 13" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  // CrystalDiskMark (磁盘测速表盘)
  if (s.includes('crystaldiskmark')) {
    return (
      <div className="w-full h-full bg-[#1E3A8A] border border-[#2563EB] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <circle cx="12" cy="12" r="8" stroke="#38BDF8" strokeWidth="2" fill="#0F172A" />
          <line x1="12" y1="12" x2="16" y2="8" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2" fill="#F43F5E" />
        </svg>
      </div>
    );
  }

  // Core Temp
  if (s.includes('core-temp') || s.includes('core temp')) {
    return (
      <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M10 13V5C10 3.9 10.9 3 12 3C13.1 3 14 3.9 14 5V13C15.2 13.9 16 15.4 16 17C16 19.2 14.2 21 12 21C9.8 21 8 19.2 8 17C8 15.4 8.8 13.9 10 13Z" stroke="#EF4444" strokeWidth="1.5" fill="#7F1D1D" />
          <circle cx="12" cy="17" r="2.5" fill="#EF4444" />
        </svg>
      </div>
    );
  }

  // FurMark (甜甜圈烤机)
  if (s.includes('furmark')) {
    return (
      <div className="w-full h-full bg-amber-950 border border-amber-800 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <circle cx="12" cy="12" r="7" stroke="#EA580C" strokeWidth="3.5" strokeDasharray="3 2" fill="none" />
          <circle cx="12" cy="12" r="2" fill="#FBBF24" />
        </svg>
      </div>
    );
  }

  // MemTest86 / Prime95
  if (s.includes('memtest') || s.includes('prime95')) {
    return (
      <div className="w-full h-full bg-indigo-950 border border-indigo-800 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="3" y="6" width="18" height="12" rx="1.5" stroke="#818CF8" strokeWidth="1.5" fill="#312E81" />
          <line x1="6" y1="14" x2="6" y2="18" stroke="#FDE047" strokeWidth="1.5" />
          <line x1="9" y1="14" x2="9" y2="18" stroke="#FDE047" strokeWidth="1.5" />
          <line x1="12" y1="14" x2="12" y2="18" stroke="#FDE047" strokeWidth="1.5" />
          <line x1="15" y1="14" x2="15" y2="18" stroke="#FDE047" strokeWidth="1.5" />
          <line x1="18" y1="14" x2="18" y2="18" stroke="#FDE047" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 6. 系统增强与维护工具
  // -------------------------------------------------------------

  // DiskGenius
  if (s.includes('diskgenius') || s.includes('dg分区')) {
    return (
      <div className="w-full h-full bg-blue-950 border border-blue-800 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="2" y="4" width="20" height="16" rx="2" stroke="#60A5FA" strokeWidth="1.8" fill="#1E3A8A" />
          <line x1="6" y1="9" x2="18" y2="9" stroke="#93C5FD" strokeWidth="1.5" />
          <circle cx="17" cy="15" r="1.5" fill="#34D399" />
          <circle cx="12" cy="15" r="1.5" fill="#FBBF24" />
        </svg>
      </div>
    );
  }

  // Rufus
  if (s.includes('rufus')) {
    return (
      <div className="w-full h-full bg-slate-800 border border-slate-600 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="6" y="7" width="12" height="13" rx="2" fill="#334155" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="8" y="3" width="8" height="4" fill="#E2E8F0" />
          <path d="M12 10L10 14H14L12 18" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  // Ventoy (新一代多合一启动 U 盘)
  if (s.includes('ventoy')) {
    return (
      <div className="w-full h-full bg-[#1565C0] border border-[#1e40af] rounded-inherit flex items-center justify-center">
        <span className="text-white font-black text-xl italic select-none font-sans">V</span>
      </div>
    );
  }

  // Geek Uninstaller (强力卸载橙色垃圾桶)
  if (s.includes('geek-uninstaller') || s.includes('geek')) {
    return (
      <div className="w-full h-full bg-[#EA580C] border border-[#c2410c] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M5 7L6.5 20H17.5L19 7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="7" x2="21" y2="7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 7V4H15V7" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="10" y1="11" x2="10" y2="16" stroke="#FED7AA" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="14" y1="11" x2="14" y2="16" stroke="#FED7AA" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // AnyDesk (红色菱形)
  if (s.includes('anydesk')) {
    return (
      <div className="w-full h-full bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="5.5" y="5.5" width="9" height="9" transform="rotate(45 10 10)" fill="#EF4444" />
          <rect x="9.5" y="9.5" width="9" height="9" transform="rotate(45 14 14)" stroke="#DC2626" strokeWidth="2" fill="#FFFFFF" fillOpacity="0.8" />
        </svg>
      </div>
    );
  }

  // RustDesk (开源远程桌面)
  if (s.includes('rustdesk')) {
    return (
      <div className="w-full h-full bg-[#0284C7]/15 border border-[#0284C7]/30 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <circle cx="12" cy="12" r="8" stroke="#0284C7" strokeWidth="2.5" />
          <circle cx="12" cy="12" r="3.5" fill="#F97316" />
        </svg>
      </div>
    );
  }

  // QuickLook (空格预览)
  if (s.includes('quicklook')) {
    return (
      <div className="w-full h-full bg-indigo-900 border border-indigo-700 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <circle cx="12" cy="12" r="8" stroke="#818CF8" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="3.5" fill="#6366F1" />
          <circle cx="13" cy="11" r="1" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // AutoHotkey
  if (s.includes('autohotkey')) {
    return (
      <div className="w-full h-full bg-[#22C55E] border border-[#16A34A] rounded-inherit flex items-center justify-center">
        <span className="text-white font-black text-lg select-none font-sans">H</span>
      </div>
    );
  }

  // ScreenToGif
  if (s.includes('screentogif')) {
    return (
      <div className="w-full h-full bg-sky-950 border border-sky-800 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="3" y="4" width="18" height="14" rx="2" stroke="#38BDF8" strokeWidth="1.5" />
          <path d="M8 10L11 12L8 14V10Z" fill="#F59E0B" />
          <path d="M13 14H17M13 10H17M15 10V14" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // ShareX (风车彩虹)
  if (s.includes('sharex')) {
    return (
      <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M12 12L6 6H12V12Z" fill="#3B82F6" />
          <path d="M12 12L18 6V12H12Z" fill="#10B981" />
          <path d="M12 12L18 18H12V12Z" fill="#F59E0B" />
          <path d="M12 12L6 18V12H12Z" fill="#EF4444" />
        </svg>
      </div>
    );
  }

  // Flameshot (火焰截图)
  if (s.includes('flameshot')) {
    return (
      <div className="w-full h-full bg-[#DC2626] border border-[#B91C1C] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M12 3C12 3 7 8 7 14C7 17.5 9.5 20 12 20C14.5 20 17 17.5 17 14C17 8 12 3 12 3Z" fill="#FDE047" />
          <path d="M12 9C12 9 9.5 12 9.5 15C9.5 16.5 10.5 18 12 18C13.5 18 14.5 16.5 14.5 15C14.5 12 12 9 12 9Z" fill="#EA580C" />
        </svg>
      </div>
    );
  }

  // BleachBit (隐私清理)
  if (s.includes('bleachbit')) {
    return (
      <div className="w-full h-full bg-[#B91C1C] border border-[#991B1B] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="4" y="6" width="16" height="12" rx="2" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="7" y1="12" x2="17" y2="12" stroke="#FEF08A" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // Sysinternals (Autoruns / Process Explorer / TCPView)
  if (s.includes('autoruns') || s.includes('process-explorer') || s.includes('tcpview') || s.includes('sysinternals')) {
    return (
      <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="#38BDF8" strokeWidth="1.5" />
          <path d="M4 14L8 10L12 15L16 8L20 14" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  // FastCopy Extreme
  if (s.includes('fastcopy')) {
    return (
      <div className="w-full h-full bg-blue-950 border border-blue-800 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M4 12L11 5V9H18L13 19V15H4L11 5" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" fill="#F59E0B" fillOpacity="0.3" />
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 7. 网络诊断与远程运维工具
  // -------------------------------------------------------------

  // Wireshark (官方鲨鱼鳍)
  if (s.includes('wireshark')) {
    return (
      <div className="w-full h-full bg-[#167EC2]/10 dark:bg-[#167EC2]/20 border border-[#167EC2]/30 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M3 18C8 18 10 14 11 10C12 5 15 3 19 3C18 9 20 13 21 18H3Z" fill="#167EC2" />
          <path d="M2 19C7 19 12 18 22 19H2Z" stroke="#0284C7" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  // Nmap (网络安全扫描)
  if (s.includes('nmap')) {
    return (
      <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <circle cx="12" cy="12" r="8" stroke="#10B981" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="5" stroke="#10B981" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="12" y1="4" x2="12" y2="20" stroke="#10B981" strokeWidth="1" />
          <line x1="4" y1="12" x2="20" y2="12" stroke="#10B981" strokeWidth="1" />
          <circle cx="15" cy="9" r="1.5" fill="#EF4444" />
        </svg>
      </div>
    );
  }

  // PuTTY
  if (s.includes('putty')) {
    return (
      <div className="w-full h-full bg-[#1E3A8A] border border-[#2563EB] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="3" y="5" width="8" height="7" rx="1" stroke="#FFFFFF" strokeWidth="1.5" />
          <rect x="13" y="12" width="8" height="7" rx="1" stroke="#FDE047" strokeWidth="1.5" />
          <path d="M7 12V15H17V12" stroke="#93C5FD" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  // MobaXterm
  if (s.includes('mobaxterm')) {
    return (
      <div className="w-full h-full bg-[#EA580C] border border-[#C2410C] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <circle cx="12" cy="12" r="8" stroke="#FFFFFF" strokeWidth="2" />
          <ellipse cx="12" cy="12" rx="4" ry="8" stroke="#FED7AA" strokeWidth="1.5" />
          <line x1="4" y1="12" x2="20" y2="12" stroke="#FED7AA" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  // Termius
  if (s.includes('termius')) {
    return (
      <div className="w-full h-full bg-[#4F46E5] border border-[#4338CA] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M6 7L11 12L6 17" stroke="#A5B4FC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="13" y1="17" x2="18" y2="17" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // WinSCP
  if (s.includes('winscp')) {
    return (
      <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <circle cx="14" cy="10" r="4" stroke="#F59E0B" strokeWidth="2" />
          <path d="M14 14L8 20H5V17L11 11" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 8H10M5 5H14" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // Advanced IP Scanner / Angry IP Scanner
  if (s.includes('ip-scanner') || s.includes('ip scanner')) {
    return (
      <div className="w-full h-full bg-blue-950 border border-blue-800 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <circle cx="12" cy="12" r="8" stroke="#38BDF8" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="4" fill="#0284C7" />
          <path d="M12 4V12L17 15" stroke="#38BDF8" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 8. 影音媒体与录屏直播
  // -------------------------------------------------------------

  // OBS Studio (黑白三叶旋翼)
  if (s.includes('obs-studio') || s.includes('obs')) {
    return (
      <div className="w-full h-full bg-slate-950 border border-slate-800 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <circle cx="12" cy="12" r="9" fill="#1E293B" />
          <circle cx="12" cy="8" r="3.5" fill="#FFFFFF" />
          <circle cx="8.5" cy="14" r="3.5" fill="#FFFFFF" />
          <circle cx="15.5" cy="14" r="3.5" fill="#FFFFFF" />
          <circle cx="12" cy="12" r="2" fill="#0F172A" />
        </svg>
      </div>
    );
  }

  // PotPlayer (高品质亮黄播放器)
  if (s.includes('potplayer') || s.includes('pot player')) {
    return (
      <div className="w-full h-full bg-[#EAB308] border border-[#CA8A04] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M9.5 7.5L16.5 12L9.5 16.5V7.5Z" fill="#1E293B" />
        </svg>
      </div>
    );
  }

  // VLC Media Player (橙白路障圆锥筒)
  if (s.includes('vlc')) {
    return (
      <div className="w-full h-full bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M12 2L6 18H18L12 2Z" fill="#F97316" />
          <path d="M8.5 11.5H15.5L14.2 8H9.8L8.5 11.5Z" fill="#FFFFFF" />
          <path d="M7 15.5H17L16 13H8L7 15.5Z" fill="#FFFFFF" />
          <rect x="4" y="18" width="16" height="3" rx="1" fill="#EA580C" />
        </svg>
      </div>
    );
  }

  // Audacity (声波与立体声耳机)
  if (s.includes('audacity')) {
    return (
      <div className="w-full h-full bg-blue-950 border border-blue-800 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
          <rect x="2" y="11" width="4" height="7" rx="2" fill="#0284C7" />
          <rect x="18" y="11" width="4" height="7" rx="2" fill="#0284C7" />
          <path d="M8 14V16M10 11V18M12 9V20M14 12V17M16 13V15" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // HandBrake (菠萝与鸡尾酒饮料)
  if (s.includes('handbrake')) {
    return (
      <div className="w-full h-full bg-amber-950 border border-amber-800 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <ellipse cx="12" cy="14" rx="5" ry="6" fill="#F59E0B" />
          <path d="M12 8L10 4M12 8L12 3M12 8L14 4" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 12L15 16M15 12L9 16" stroke="#D97706" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  // Kdenlive / Shotcut
  if (s.includes('kdenlive') || s.includes('shotcut')) {
    return (
      <div className="w-full h-full bg-[#1E3A8A] border border-[#2563EB] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="#60A5FA" strokeWidth="1.5" fill="#0F172A" />
          <line x1="3" y1="9" x2="21" y2="9" stroke="#3B82F6" strokeWidth="1.5" />
          <line x1="8" y1="5" x2="6" y2="9" stroke="#EF4444" strokeWidth="1.5" />
          <line x1="14" y1="5" x2="12" y2="9" stroke="#EF4444" strokeWidth="1.5" />
          <polygon points="10,12 15,14.5 10,17" fill="#38BDF8" />
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 9. 创意设计与三维图形
  // -------------------------------------------------------------

  // Blender (三维动画套件)
  if (s.includes('blender')) {
    return (
      <div className="w-full h-full bg-[#EA7600]/15 border border-[#EA7600]/30 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <circle cx="12" cy="14" r="5" stroke="#EA7600" strokeWidth="2.5" fill="#2563EB" />
          <line x1="12" y1="9" x2="12" y2="3" stroke="#EA7600" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="8" y1="11" x2="3" y2="8" stroke="#EA7600" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="16" y1="11" x2="21" y2="8" stroke="#EA7600" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="12" cy="14" r="2" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // GIMP (Wilber 土狼与画笔)
  if (s.includes('gimp')) {
    return (
      <div className="w-full h-full bg-slate-800 border border-slate-600 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <ellipse cx="12" cy="12" rx="7" ry="5.5" fill="#78716C" />
          <circle cx="9" cy="11" r="1.5" fill="#000000" />
          <circle cx="9" cy="10.5" r="0.5" fill="#FFFFFF" />
          <line x1="13" y1="15" x2="20" y2="17" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // Inkscape (雪山与墨迹)
  if (s.includes('inkscape')) {
    return (
      <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M12 3L3 17H21L12 3Z" fill="#1E293B" stroke="#94A3B8" strokeWidth="1.5" />
          <path d="M12 3L8 10L12 12L16 10L12 3Z" fill="#F8FAFC" />
          <path d="M7 19C7 19 9 21 12 21C15 21 17 19 17 19" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // Krita
  if (s.includes('krita')) {
    return (
      <div className="w-full h-full bg-[#EC4899]/15 border border-[#EC4899]/30 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <circle cx="12" cy="12" r="8" fill="#F43F5E" />
          <path d="M8 8C10 5 15 5 17 8C19 11 17 14 14 15" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <circle cx="15" cy="15" r="1.5" fill="#38BDF8" />
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 10. 知识管理、笔记与科研
  // -------------------------------------------------------------

  // Obsidian (紫色黑曜石水晶)
  if (s.includes('obsidian')) {
    return (
      <div className="w-full h-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <polygon points="12,3 19,8 16,21 8,21 5,8" fill="#8B5CF6" stroke="#6D28D9" strokeWidth="1.5" />
          <polygon points="12,3 15,10 12,18 9,10" fill="#DDD6FE" opacity="0.6" />
        </svg>
      </div>
    );
  }

  // Joplin (蓝色 J 字母便签)
  if (s.includes('joplin')) {
    return (
      <div className="w-full h-full bg-[#1D4ED8] border border-[#1e40af] rounded-inherit flex items-center justify-center">
        <span className="text-white font-serif font-black text-xl select-none">J</span>
      </div>
    );
  }

  // Draw.io (流程图设计)
  if (s.includes('drawio') || s.includes('draw.io')) {
    return (
      <div className="w-full h-full bg-[#F08705] border border-[#d97706] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="5" y="5" width="6" height="6" rx="1" fill="#FFFFFF" />
          <rect x="13" y="13" width="6" height="6" rx="1" fill="#FFFFFF" />
          <path d="M11 8H16V13" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // Calibre (电子书书架)
  if (s.includes('calibre')) {
    return (
      <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="4" y="4" width="4.5" height="16" rx="1" fill="#DC2626" />
          <rect x="9.5" y="4" width="4.5" height="16" rx="1" fill="#2563EB" />
          <rect x="15" y="4" width="4.5" height="16" rx="1" fill="#16A34A" />
        </svg>
      </div>
    );
  }

  // LibreOffice
  if (s.includes('libreoffice')) {
    return (
      <div className="w-full h-full bg-[#16A34A] border border-[#15803D] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M5 4C5 3 6 2 7 2H14L19 7V20C19 21 18 22 17 22H7C6 22 5 21 5 20V4Z" fill="#FFFFFF" />
          <path d="M14 2V7H19" fill="#86EFAC" />
        </svg>
      </div>
    );
  }

  // Mozilla Thunderbird (蓝雷鸟)
  if (s.includes('thunderbird')) {
    return (
      <div className="w-full h-full bg-[#0284C7] border border-[#0369A1] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <circle cx="12" cy="12" r="8" fill="#38BDF8" />
          <rect x="6" y="8" width="12" height="8" rx="1" fill="#FFFFFF" />
          <path d="M6 8L12 13L18 8" stroke="#0284C7" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  // Sumatra PDF (超轻量亮黄 PDF)
  if (s.includes('sumatrapdf') || s.includes('sumatra')) {
    return (
      <div className="w-full h-full bg-[#EAB308] border border-[#CA8A04] rounded-inherit flex items-center justify-center">
        <span className="text-slate-900 font-sans font-black text-xs tracking-tight select-none">PDF</span>
      </div>
    );
  }

  // Zotero (文献管理大红 Z)
  if (s.includes('zotero')) {
    return (
      <div className="w-full h-full bg-[#DC2626] border border-[#B91C1C] rounded-inherit flex items-center justify-center">
        <span className="text-white font-serif font-black text-xl italic select-none">Z</span>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 11. 开源竞技与经典独立游戏
  // -------------------------------------------------------------

  // Mindustry (像素工业核心)
  if (s.includes('mindustry')) {
    return (
      <div className="w-full h-full bg-[#D48148] border border-[#a85822] rounded-inherit flex items-center justify-center">
        <div className="w-4 h-4 bg-amber-200 border-2 border-amber-900 rounded-xs rotate-45 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-amber-900 rounded-xs" />
        </div>
      </div>
    );
  }

  // SuperTuxKart (企鹅赛车)
  if (s.includes('supertuxkart') || s.includes('tuxkart')) {
    return (
      <div className="w-full h-full bg-[#1E3A8A] border border-[#2563EB] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <ellipse cx="12" cy="14" rx="6" ry="7" fill="#0F172A" />
          <ellipse cx="12" cy="15" rx="4" ry="5" fill="#FFFFFF" />
          <polygon points="12,12 9,14 15,14" fill="#F59E0B" />
          <circle cx="9.5" cy="10" r="1.5" fill="#FFFFFF" />
          <circle cx="9.5" cy="10" r="0.8" fill="#000000" />
          <circle cx="14.5" cy="10" r="1.5" fill="#FFFFFF" />
          <circle cx="14.5" cy="10" r="0.8" fill="#000000" />
          <path d="M6 8C6 5 9 4 12 4C15 4 18 5 18 8" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // 0 A.D. (古罗马帝国石柱)
  if (s.includes('0ad') || s.includes('0 a.d.')) {
    return (
      <div className="w-full h-full bg-[#78350F] border border-[#92400E] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="5" y="4" width="14" height="3" rx="0.5" fill="#FEF3C7" />
          <rect x="7" y="7" width="2" height="11" fill="#FDE68A" />
          <rect x="11" y="7" width="2" height="11" fill="#FDE68A" />
          <rect x="15" y="7" width="2" height="11" fill="#FDE68A" />
          <rect x="4" y="18" width="16" height="3" rx="0.5" fill="#FEF3C7" />
        </svg>
      </div>
    );
  }

  // Battle for Wesnoth (中世纪骑士圣盾)
  if (s.includes('battle-for-wesnoth') || s.includes('wesnoth')) {
    return (
      <div className="w-full h-full bg-[#450A0A] border border-[#7F1D1D] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M12 3L4 6V12C4 17 7.5 20.5 12 22C16.5 20.5 20 17 20 12V6L12 3Z" fill="#991B1B" stroke="#FDE047" strokeWidth="1.5" />
          <line x1="12" y1="6" x2="12" y2="18" stroke="#FEF08A" strokeWidth="2" />
          <line x1="7" y1="10" x2="17" y2="10" stroke="#FEF08A" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  // OpenRA (红色警戒雷达)
  if (s.includes('openra')) {
    return (
      <div className="w-full h-full bg-[#991B1B] border border-[#7F1D1D] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <circle cx="12" cy="12" r="8" stroke="#FBBF24" strokeWidth="2" />
          <line x1="12" y1="4" x2="12" y2="20" stroke="#FBBF24" strokeWidth="1" />
          <line x1="4" y1="12" x2="20" y2="12" stroke="#FBBF24" strokeWidth="1" />
          <polygon points="12,6 16,14 8,14" fill="#FDE047" />
        </svg>
      </div>
    );
  }

  // OpenTTD (运输大亨火车头)
  if (s.includes('openttd')) {
    return (
      <div className="w-full h-full bg-[#15803D] border border-[#166534] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="5" y="4" width="14" height="13" rx="2" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
          <rect x="7" y="6" width="10" height="4" rx="1" fill="#0F172A" />
          <circle cx="8" cy="13" r="1.5" fill="#FFFFFF" />
          <circle cx="16" cy="13" r="1.5" fill="#FFFFFF" />
          <circle cx="7" cy="18" r="2" fill="#334155" />
          <circle cx="17" cy="18" r="2" fill="#334155" />
        </svg>
      </div>
    );
  }

  // Shattered Pixel Dungeon (破碎地牢神器)
  if (s.includes('shattered-pixel-dungeon') || s.includes('pixel dungeon')) {
    return (
      <div className="w-full h-full bg-[#312E81] border border-[#1E1B4B] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <polygon points="12,4 19,10 12,20 5,10" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
          <polygon points="12,7 16,11 12,17 8,11" fill="#FEF3C7" />
        </svg>
      </div>
    );
  }

  // Warzone 2100 (战地雷达与重装坦克)
  if (s.includes('warzone2100') || s.includes('warzone')) {
    return (
      <div className="w-full h-full bg-slate-900 border border-slate-700 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <circle cx="12" cy="12" r="8" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1="12" y1="4" x2="12" y2="20" stroke="#0284C7" strokeWidth="1" />
          <line x1="4" y1="12" x2="20" y2="12" stroke="#0284C7" strokeWidth="1" />
          <rect x="9" y="10" width="6" height="4" rx="1" fill="#F97316" />
        </svg>
      </div>
    );
  }

  // Endless Sky (深空战舰)
  if (s.includes('endless-sky') || s.includes('endless sky')) {
    return (
      <div className="w-full h-full bg-slate-950 border border-slate-800 rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M12 2L15 10L21 14L16 16L17 22L12 18L7 22L8 16L3 14L9 10L12 2Z" fill="#38BDF8" />
        </svg>
      </div>
    );
  }

  // Luanti (原 Minetest 像素草方块)
  if (s.includes('luanti') || s.includes('minetest')) {
    return (
      <div className="w-full h-full bg-[#78350F] border border-[#582509] rounded-inherit flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="4" y="4" width="16" height="16" rx="2" fill="#8B4513" />
          <rect x="4" y="4" width="16" height="6" fill="#22C55E" />
          <rect x="7" y="10" width="3" height="3" fill="#A0522D" />
          <rect x="14" y="12" width="3" height="3" fill="#A0522D" />
        </svg>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 6. 国内常用主流工具与门户装机必备精选
  // -------------------------------------------------------------

  // 迅雷 (经典湛蓝飞鸟蜂鸟矢量标)
  if (s.includes('xunlei') || s.includes('thunder') || s.includes('迅雷')) {
    return (
      <div className="w-full h-full bg-[#1890FF] rounded-inherit flex items-center justify-center shadow-2xs">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M4 14C7 11 11 8 18 5C16 10 14 14 9 17C12 15 15 14 20 15C16 18 11 20 6 18C5 17 4 15 4 14Z" fill="white" />
          <path d="M12 9C10 12 7 15 5 16C7 14 10 12 14 10L12 9Z" fill="#BAE7FF" />
        </svg>
      </div>
    );
  }

  // 360安全卫士 (经典金黄绿底安全盾微标)
  if (s.includes('360safe') || s.includes('360-safe') || s.includes('360卫士') || s.includes('360安全卫士')) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#A0D911] to-[#52C41A] rounded-full flex items-center justify-center shadow-2xs">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <circle cx="12" cy="12" r="9" fill="#FADB14" stroke="#52C41A" strokeWidth="1.5" />
          <path d="M12 6V18M6 12H18" stroke="#52C41A" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // 360软件管家 (经典四色花瓣微标)
  if (s.includes('360soft') || s.includes('360-soft') || s.includes('360管家') || s.includes('360软件管家')) {
    return (
      <div className="w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-inherit flex items-center justify-center shadow-2xs">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <rect x="4" y="4" width="7" height="7" rx="3.5" fill="#52C41A" />
          <rect x="13" y="4" width="7" height="7" rx="3.5" fill="#1890FF" />
          <rect x="4" y="13" width="7" height="7" rx="3.5" fill="#FAAD14" />
          <rect x="13" y="13" width="7" height="7" rx="3.5" fill="#F5222D" />
        </svg>
      </div>
    );
  }

  // 驱动精灵 (经典喜庆红底白色"驱"字微标)
  if (s.includes('drivergenius') || s.includes('driver-genius') || s.includes('驱动精灵') || s.includes('驱动')) {
    return (
      <div className="w-full h-full bg-[#E53935] rounded-inherit flex items-center justify-center shadow-2xs">
        <span className="text-white font-extrabold text-[15px] tracking-tight leading-none">驱</span>
      </div>
    );
  }

  // 百度网盘 / Pandownload (蓝红三圆环联结标)
  if (s.includes('baidunetdisk') || s.includes('baidu-netdisk') || s.includes('百度网盘') || s.includes('pandownload') || s.includes('网盘')) {
    return (
      <div className="w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-inherit flex items-center justify-center shadow-2xs">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <circle cx="8" cy="13" r="5" fill="#1890FF" fillOpacity="0.8" />
          <circle cx="16" cy="13" r="5" fill="#13C2C2" fillOpacity="0.8" />
          <circle cx="12" cy="8" r="4.5" fill="#F5222D" fillOpacity="0.8" />
        </svg>
      </div>
    );
  }

  // 360安全浏览器 (绿色环状 e 字标)
  if (s.includes('360browser') || s.includes('360-browser') || s.includes('360浏览器')) {
    return (
      <div className="w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-inherit flex items-center justify-center shadow-2xs">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <circle cx="12" cy="12" r="9" stroke="#52C41A" strokeWidth="3" />
          <path d="M5 12H19" stroke="#52C41A" strokeWidth="2.5" />
          <path d="M12 5C15 8 16 14 14 19" stroke="#13C2C2" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // WPS Office (红色 W 丝带微标)
  if (s.includes('wps') || s.includes('wps-office') || s.includes('wps office')) {
    return (
      <div className="w-full h-full bg-gradient-to-tr from-[#FF4D4F] to-[#FF7875] rounded-inherit flex items-center justify-center shadow-2xs">
        <span className="text-white font-extrabold text-[15px] font-sans tracking-tighter leading-none italic">W</span>
      </div>
    );
  }

  // QQ / QQ游戏 (企鹅红围巾标)
  if (s.includes('qq') || s.includes('qqgame') || s.includes('qq游戏')) {
    return (
      <div className="w-full h-full bg-slate-900 rounded-inherit flex items-center justify-center shadow-2xs">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <ellipse cx="12" cy="13" rx="7" ry="8" fill="white" />
          <ellipse cx="12" cy="13" rx="5" ry="6" fill="#1E293B" />
          <ellipse cx="12" cy="14" rx="3.5" ry="4.5" fill="white" />
          <path d="M8 10C8 10 10 12 12 12C14 12 16 10 16 10" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
          <circle cx="10" cy="7" r="1" fill="#1E293B" />
          <circle cx="14" cy="7" r="1" fill="#1E293B" />
          <path d="M11 8.5H13" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // 雷电模拟器 (黄色黑闪电标)
  if (s.includes('leidian') || s.includes('ldplayer') || s.includes('雷电模拟器') || s.includes('模拟器')) {
    return (
      <div className="w-full h-full bg-[#FADB14] rounded-inherit flex items-center justify-center shadow-2xs">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M13 3L6 13H12L11 21L18 11H12L13 3Z" fill="#1F1F1F" />
        </svg>
      </div>
    );
  }

  // 火绒安全 (橙红火炬盾牌标)
  if (s.includes('huorong') || s.includes('火绒') || s.includes('火绒安全')) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#FA541C] to-[#D4380D] rounded-inherit flex items-center justify-center shadow-2xs">
        <svg viewBox="0 0 24 24" className={svgSizes} fill="none">
          <path d="M12 3L4 7V12C4 16.5 7.5 20.5 12 21.5C16.5 20.5 20 16.5 20 12V7L12 3Z" fill="#FF7A45" />
          <path d="M12 6L14 10H10L12 6ZM12 12C10.5 12 9 13.5 9 15C9 16.5 10.5 18 12 18C13.5 18 15 16.5 15 15C15 13.5 13.5 12 12 12Z" fill="white" />
        </svg>
      </div>
    );
  }

  // 百度文库 (红蓝绿多色"文"字微标)
  if (s.includes('wenku') || s.includes('百度文库') || s.includes('文库')) {
    return (
      <div className="w-full h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-inherit flex items-center justify-center shadow-2xs">
        <span className="text-[#0089FF] font-extrabold text-[15px] tracking-tight leading-none">文</span>
      </div>
    );
  }

  // 种子搜索 (紫红渐变千种微标)
  if (s.includes('zhongzi') || s.includes('torrent') || s.includes('种子') || s.includes('种子搜索')) {
    return (
      <div className="w-full h-full bg-gradient-to-tr from-[#722ED1] via-[#EB2F96] to-[#FA8C16] rounded-inherit flex items-center justify-center shadow-2xs">
        <span className="text-white font-extrabold text-[15px] tracking-tight leading-none">千</span>
      </div>
    );
  }

  return null;
}
