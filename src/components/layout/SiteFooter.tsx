import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, ExternalLink } from 'lucide-react';
import { siteConfig } from '../../config/site';

interface SiteFooterProps {
  onCategoryClick?: (slug: string) => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({ onCategoryClick }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#142238] text-slate-400 border-t border-slate-800 pt-10 pb-8 text-xs">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
          {/* 第一列：品牌与定位声明 */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <img
                src={siteConfig.logoUrl}
                alt="软游部落"
                className="h-7 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-base font-bold text-white tracking-tight">
                {siteConfig.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {siteConfig.tagline}。汇聚电脑办公、系统装机排障、网络运维与正版游戏资源。
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              服务反馈: {siteConfig.contactEmail}
            </div>
          </div>

          {/* 第二列：资源分类 */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              核心资源分类
            </h4>
            <ul className="space-y-1.5">
              {[
                { name: "系统与装机维护", slug: "sys-tools" },
                { name: "硬件分析与检测", slug: "hardware" },
                { name: "网络测速与抓包", slug: "network" },
                { name: "编程与开发环境", slug: "dev" },
                { name: "开源与单机游戏", slug: "games" },
                { name: "影音播放与媒体", slug: "media" },
              ].map((item) => (
                <li key={item.slug}>
                  <button
                    onClick={() => onCategoryClick?.(item.slug)}
                    className="hover:text-white transition-colors text-left cursor-pointer"
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 第三列：实用装机专区 */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              特色专区
            </h4>
            <ul className="space-y-1.5">
              <li>
                <a href="#tools" className="hover:text-white transition-colors">
                  新电脑装机必备软件
                </a>
              </li>
              <li>
                <a href="#tools" className="hover:text-white transition-colors">
                  硬盘体质与坏道检测利器
                </a>
              </li>
              <li>
                <a href="#games" className="hover:text-white transition-colors">
                  开源塔防与高分独立游戏
                </a>
              </li>
              <li>
                <a href="#tutorials" className="hover:text-white transition-colors">
                  Windows 原版纯净安装指南
                </a>
              </li>
            </ul>
          </div>

          {/* 第四列：合规声明 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              免责与知识产权说明
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {siteConfig.officialSourceDisclaimer}
            </p>
            <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-400">
              <Link to="/developer" className="hover:text-white transition-colors">
                开发者入驻
              </Link>
              <span>·</span>
              <Link to="/developers/api" className="hover:text-white transition-colors">
                开放 API
              </Link>
              <span>·</span>
              <Link to="/community" className="hover:text-white transition-colors">
                社区交流
              </Link>
              <span>·</span>
              <Link to="/admin/login" className="text-slate-500 hover:text-slate-300 transition-colors">
                运营登录 →
              </Link>
            </div>
          </div>
        </div>

        {/* 底部版权 */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            © {currentYear} {siteConfig.copyrightOwner}. 保留所有权利。
          </div>
          <div className="flex items-center gap-4">
            <span>{siteConfig.icpRecord}</span>
            <span>{siteConfig.publicSecurityRecord}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
