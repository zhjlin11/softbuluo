import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { GrowthService } from '../../services/growthService';

/**
 * 软游部落 P9.1.0 路由访问分析追踪器
 * 自动监听路由切换并上报 PV/UV 数据：
 * 1. 严格排除 /admin/* 管理后台路由，保护运营操作不污染前台数据；
 * 2. 1秒内相同路径防刷防抖；
 * 3. 自动识别 HOME / SOFTWARE / TOOL / GAME / ESSENTIALS / TUTORIAL 等页面语义；
 * 4. 传输来源 referer，后端进行 SHA-256 隐私加盐哈希，不落盘明文 IP。
 */
export const RouteAnalyticsTracker: React.FC = () => {
  const location = useLocation();
  const lastTrackedRef = useRef<{ path: string; timestamp: number }>({
    path: '',
    timestamp: 0,
  });

  useEffect(() => {
    const path = location.pathname;

    // 1. 管理后台路由直接跳过，杜绝运营管理操作污染前台访客统计
    if (path.startsWith('/admin')) {
      return;
    }

    // 2. 防刷与快速重复路由去重（1 秒内相同路径不重复上报）
    const now = Date.now();
    if (lastTrackedRef.current.path === path && now - lastTrackedRef.current.timestamp < 1000) {
      return;
    }
    lastTrackedRef.current = { path, timestamp: now };

    // 3. 映射语义化页面类型
    let pageType = 'OTHER';
    if (path === '/') pageType = 'HOME';
    else if (path === '/software') pageType = 'SOFTWARE_INDEX';
    else if (path.startsWith('/software/')) pageType = 'SOFTWARE_DETAIL';
    else if (path === '/system-tools') pageType = 'TOOL_INDEX';
    else if (path.startsWith('/tool/')) pageType = 'TOOL_DETAIL';
    else if (path === '/games') pageType = 'GAME_INDEX';
    else if (path.startsWith('/game/')) pageType = 'GAME_DETAIL';
    else if (path === '/essentials') pageType = 'ESSENTIALS';
    else if (path === '/tutorials') pageType = 'TUTORIAL_INDEX';
    else if (path.startsWith('/tutorials/') || path.startsWith('/tutorial/')) pageType = 'TUTORIAL_DETAIL';
    else if (path === '/updates') pageType = 'UPDATES';
    else if (path.startsWith('/topics') || path.startsWith('/topic/')) pageType = 'TOPICS';
    else if (path.startsWith('/category/')) pageType = 'CATEGORY';
    else if (path.startsWith('/compare')) pageType = 'COMPARE';
    else if (path.startsWith('/community')) pageType = 'COMMUNITY';
    else if (path === '/membership') pageType = 'MEMBERSHIP';
    else if (path === '/account') pageType = 'ACCOUNT';

    // 4. 调用轻量打点上报
    GrowthService.collectPageView(
      path,
      pageType,
      typeof document !== 'undefined' ? document.referrer : undefined
    );
  }, [location.pathname]);

  return null;
};
