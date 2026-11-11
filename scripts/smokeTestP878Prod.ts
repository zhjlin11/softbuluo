async function main() {
  const PROD_BASE = 'http://134.175.230.107:8080';
  const urls = [
    { url: `${PROD_BASE}/`, name: '首页' },
    { url: `${PROD_BASE}/software`, name: '电脑软件' },
    { url: `${PROD_BASE}/system-tools`, name: '系统工具' },
    { url: `${PROD_BASE}/games`, name: '游戏中心' },
    { url: `${PROD_BASE}/essentials`, name: '装机必备' },
    { url: `${PROD_BASE}/tutorials`, name: '软件教程 (UI 3.0 门户 / SSR)' },
    { url: `${PROD_BASE}/tutorials/rufus-win11-bypass-tpm-guide`, name: '教程沉浸式阅读详情页' },
    { url: `${PROD_BASE}/updates`, name: '最新更新' },
    { url: `${PROD_BASE}/api/v1/channels/tutorials`, name: '软件教程聚合 API' },
    { url: `${PROD_BASE}/api/v1/channels/tutorials/rufus-win11-bypass-tpm-guide`, name: '教程详情 API' },
    { url: `${PROD_BASE}/sitemap-tutorials.xml`, name: '教程频道 Sitemap' },
    { url: `${PROD_BASE}/robots.txt`, name: '网络爬虫协议规范' },
    { url: `${PROD_BASE}/compare`, name: '对比评测 (隐藏路由保护)' },
    { url: `${PROD_BASE}/community`, name: '社区交流 (隐藏路由保护)' },
  ];

  console.log('--- 生产环境 P8.7.8 部署冒烟测试 ---');
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

  // 深度检查教程频道 API 返回数据
  try {
    const apiResp = await fetch(`${PROD_BASE}/api/v1/channels/tutorials`);
    const json: any = await apiResp.json();
    console.log('\n--- 生产环境教程频道 API 数据验证 ---');
    console.log(`- success: ${json.success}`);
    console.log(`- totalTutorials: ${json.data?.stats?.totalTutorials}`);
    console.log(`- totalCategories: ${json.data?.stats?.totalCategories}`);
    console.log(`- items count: ${json.data?.items?.length}`);
    console.log(`- hero title: ${json.data?.hero?.title}`);
    if (!json.success || json.data?.stats?.totalTutorials !== 27) {
      hasError = true;
    }
  } catch (e: any) {
    console.error('[API VERIFY ERROR]:', e.message);
    hasError = true;
  }

  if (hasError) {
    console.error('\n❌ 生产环境冒烟测试发现异常');
    process.exit(1);
  } else {
    console.log('\n🎉 生产环境所有端点及教程数据核验全部通过 (HTTP 200)！');
  }
}

main().catch((err) => {
  console.error('冒烟脚本崩溃:', err);
  process.exit(1);
});
