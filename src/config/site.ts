/**
 * 全站统一品牌与站点配置
 * 统一管理站点名称、Logo、联系方式、SEO、页脚备案及全局常量，杜绝页面硬编码。
 */

export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  domain: string;
  url: string;
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
  name: "软件资源中心",
  shortName: "软资中心",
  tagline: "找软件更快，找来源更准，下载更放心",
  description: "整理常用电脑软件、系统维修工具、网络工具、开发软件及正版游戏获取渠道，提供软件版本信息、官方来源与实用安装教程。",
  domain: "soft.example.com",
  url: "https://soft.example.com",
  contactEmail: "contact@example.com",
  copyrightOwner: "软件资源中心平台技术团队",
  foundedYear: 2024,
  icpRecord: "京ICP备2024018899号-1",
  publicSecurityRecord: "京公网安备 11010802039988号",
  officialSourceDisclaimer: "本站收录资源均经过人工比对官方发布渠道或开源许可协议。本平台非商业软件著作权方，优先引导用户前往官方网站或授权渠道下载正版软件。",
  navItems: [
    { label: "首页", href: "#hero" },
    { label: "电脑软件", href: "#featured" },
    { label: "系统工具", href: "#tools" },
    { label: "游戏中心", href: "#games" },
    { label: "软件教程", href: "#tutorials" },
    { label: "最新更新", href: "#updates" },
  ],
  popularSearches: ["Chrome", "7-Zip", "VS Code", "CPU-Z", "DiskGenius", "VLC", "Everything"],
};
