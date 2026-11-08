import React from 'react';
import { Layers, ShieldCheck, Mail, FileText, ExternalLink } from 'lucide-react';
import { siteConfig } from '../../config/site';

interface SiteFooterProps {
  onCategoryClick?: (slug: string) => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({ onCategoryClick }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-950 text-slate-400 border-t border-slate-900 pt-16 pb-12 text-xs">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-900">
          {/* 第一列：品牌与定位声明 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Layers className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                {siteConfig.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {siteConfig.description}
            </p>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-850 text-[11px] text-slate-400 leading-relaxed">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>官方正版与合规声明</span>
              </div>
              {siteConfig.officialSourceDisclaimer}
            </div>
          </div>

          {/* 第二列：资源分类 */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-4">
              核心资源分类
            </h4>
            <ul className="space-y-2.5">
              {[
                { name: "系统与装机维护", slug: "sys-tools" },
                { name: "硬件分析与检测", slug: "hardware" },
                { name: "网络测速与抓包", slug: "network" },
                { name: "编程与开发环境", slug: "dev" },
                { name: "开源与单机游戏", slug: "games" },
                { name: "影音播放与媒体", slug: "media" },
                { name: "日常办公协同", slug: "office" },
              ].map((item) => (
                <li key={item.slug}>
                  <button
                    onClick={() => onCategoryClick?.(item.slug)}
                    className="hover:text-white transition-colors text-left"
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 第三列：帮助与服务指南 */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-4">
              帮助与服务
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#tutorials" className="hover:text-white transition-colors">
                  纯净装机与 PE 制作教程
                </a>
              </li>
              <li>
                <a href="#tutorials" className="hover:text-white transition-colors">
                  硬盘分区与误删数据恢复指南
                </a>
              </li>
              <li>
                <a href="#tutorials" className="hover:text-white transition-colors">
                  网络延迟与丢包排障手册
                </a>
              </li>
              <li>
                <a href="#featured" className="hover:text-white transition-colors">
                  软件安全扫描与 Hash 校验说明
                </a>
              </li>
              <li>
                <span className="text-slate-500">
                  软件收录与更新提报通道 (P1 开放)
                </span>
              </li>
            </ul>
          </div>

          {/* 第四列：网站合规与政策 */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-4">
              平台政策与支持
            </h4>
            <ul className="space-y-2.5">
              <li>
                <span className="text-slate-400">平台使用条款与规范</span>
              </li>
              <li>
                <span className="text-slate-400">用户隐私保护声明</span>
              </li>
              <li>
                <span className="text-slate-400">版权保护与侵权投诉通道</span>
              </li>
              <li>
                <span className="text-slate-400">增值技术服务退款政策</span>
              </li>
              <li className="pt-2 flex items-center gap-1.5 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>技术支持: {siteConfig.contactEmail}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 底部备案与版权归属 */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {siteConfig.foundedYear} - {currentYear} {siteConfig.copyrightOwner}. 保留所有权利。
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="hover:text-slate-400 transition-colors">
              {siteConfig.icpRecord}
            </span>
            <span aria-hidden="true">·</span>
            <span className="hover:text-slate-400 transition-colors">
              {siteConfig.publicSecurityRecord}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
