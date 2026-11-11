async function main() {
  const PROD_BASE = 'http://134.175.230.107:8080';
  const urls = [
    { url: `${PROD_BASE}/`, name: '首页' },
    { url: `${PROD_BASE}/software`, name: '电脑软件' },
    { url: `${PROD_BASE}/system-tools`, name: '系统工具' },
    { url: `${PROD_BASE}/games`, name: '游戏中心' },
    { url: `${PROD_BASE}/essentials`, name: '装机必备' },
    { url: `${PROD_BASE}/tutorials`, name: '软件教程' },
    { url: `${PROD_BASE}/updates`, name: '最新更新 (SSR/页面)' },
    { url: `${PROD_BASE}/api/v1/channels/updates`, name: '最新更新聚合 API' },
    { url: `${PROD_BASE}/api/v1/channels/updates/version-history/windows-10`, name: '历史版本 API' },
    { url: `${PROD_BASE}/sitemap-updates.xml`, name: '更新频道 Sitemap' },
    { url: `${PROD_BASE}/robots.txt`, name: '网络爬虫协议规范' },
    { url: `${PROD_BASE}/compare`, name: '对比评测 (历史路由)' },
    { url: `${PROD_BASE}/community`, name: '社区交流 (历史路由)' },
  ];

  console.log('--- 生产环境 P8.7.10 部署冒烟测试 ---');
  let hasError = false;

  for (const item of urls) {
    try {
      const resp = await fetch(item.url, { headers: { 'User-Agent': 'SoftTribe-SmokeTest/1.0' } });
      const status = resp.status;
      const ok = status === 200;
      console.log(`[STATUS ${status}] ${item.name} (${item.url})`);
      if (!ok) hasError = true;
    } catch (e: any) {
      console.error(`[ERROR] ${item.name} (${item.url}):`, e.message);
      hasError = true;
    }
  }

  // 深度检查聚合 API 返回数据
  try {
    const apiResp = await fetch(`${PROD_BASE}/api/v1/channels/updates`);
    const json: any = await apiResp.json();
    console.log('\n--- 生产环境更新频道 API 数据验证 ---');
    console.log(`- success: ${json.success}`);
    console.log(`- channel: ${json.data?.channel}`);
    console.log(`- totalPublished: ${json.data?.stats?.totalPublished}`);
    console.log(`- totalVersions: ${json.data?.stats?.totalVersions}`);
    console.log(`- timeline items count: ${json.data?.timeline?.items?.length}`);
    console.log(`- recentlyAdded count: ${json.data?.recentlyAdded?.length}`);
    if (!json.success || json.data?.channel !== 'UPDATES') {
      hasError = true;
    }
  } catch (e: any) {
    console.error('[API VERIFY ERROR]:', e.message);
    hasError = true;
  }

  if (hasError) {
    console.error('\n❌ 冒烟测试存在失败端点！');
    process.exit(1);
  } else {
    console.log('\n🎉 生产环境所有端点 100% 冒烟测试通过！');
  }
}

main();
