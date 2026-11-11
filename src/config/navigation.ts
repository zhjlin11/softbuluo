/**
 * 全站统一主导航配置 - 软游部落
 * 遵循 P8.7.9 规范：保留 7 大核心主导航频道，精简移除「对比评测」与「社区交流」主导航入口。
 * 供桌面端 Header、移动端抽屉菜单及全局导航消费，实现单一可信源管理。
 */

export interface NavItem {
  label: string;
  href: string;
  id: string;
  badge?: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: '首页', href: '/', id: 'nav-home' },
  { label: '电脑软件', href: '/software', id: 'nav-software' },
  { label: '系统工具', href: '/system-tools', id: 'nav-tools' },
  { label: '游戏中心', href: '/games', id: 'nav-games' },
  { label: '装机必备', href: '/essentials', id: 'nav-essential' },
  { label: '软件教程', href: '/tutorials', id: 'nav-tutorials' },
  { label: '最新更新', href: '/updates', id: 'nav-updates' },
];
