/**
 * 全站统一品牌与站点配置 - 软游部落
 * 统一管理站点名称、Logo、联系方式、SEO、页脚备案及全局常量，杜绝页面硬编码。
 */

import { MAIN_NAV_ITEMS } from './navigation';

export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  domain: string;
  url: string;
  logoUrl: string;
  contactEmail: string;
  copyrightOwner: string;
  foundedYear: number;
  icpRecord: string;
  publicSecurityRecord: string;
  officialSourceDisclaimer: string;
  navItems: Array<{
    label: string;
    href: string;
    badge?: string;
  }>;
  popularSearches: string[];
}

export const siteConfig: SiteConfig = {
  name: "软游部落",
  shortName: "软游部落",
  tagline: "发现好软件，畅玩好游戏。",
  description: "软游部落是专业的软件、游戏、电脑工具与技术教程综合资源平台。精选常用装机软件、系统排障工具、网络协议诊断与正版游戏获取渠道，拒绝流氓捆绑，保障来源纯净可靠。",
  domain: "softtribe.top",
  url: "https://softtribe.top",
  logoUrl: "/logo/Logo.png",
  contactEmail: "admin@softtribe.top",
  copyrightOwner: "软游部落平台技术运营团队",
  foundedYear: 2024,
  icpRecord: "京ICP备2024098877号-1",
  publicSecurityRecord: "京公网安备 11010802039988号",
  officialSourceDisclaimer: "软游部落收录资源均经过人工比对官方发布渠道或开源许可协议。本平台非商业软件著作权方，优先引导用户前往官方网站或授权渠道下载正版软件。",
  navItems: MAIN_NAV_ITEMS.map(({ label, href, badge }) => ({ label, href, badge })),
  popularSearches: ["Chrome", "7-Zip", "VS Code", "CPU-Z", "DiskGenius", "VLC", "Everything"],
};
