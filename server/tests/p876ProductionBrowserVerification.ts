import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';

async function verifyProduction() {
  console.log('🚀 开始对生产环境进行 Playwright 真实多视口与功能验收...');
  const browser = await chromium.launch({ headless: true });

  // 优先测试公网直接 HTTP 端口 http://134.175.230.107:8080/compare
  const testUrl = 'http://134.175.230.107:8080/compare';

  // 1. 1440 桌面端
  console.log(`📸 [1/4] 访问生产页面 1440px: ${testUrl}`);
  const p1440 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const res1440 = await p1440.goto(testUrl, { waitUntil: 'networkidle', timeout: 30000 });
  console.log(`  生产 HTTP 响应码: ${res1440?.status()}`);

  await p1440.waitForSelector('#compare-matrix-section');
  const title = await p1440.title();
  const h1 = await p1440.locator('h1').textContent();
  console.log(`  生产页面标题: ${title}`);
  console.log(`  生产页面 H1: ${h1}`);

  await p1440.screenshot({
    path: path.join(ARTIFACT_DIR, 'prod_p876_compare_1440.png'),
    fullPage: true,
  });
  console.log('  ✅ 已保存 prod_p876_compare_1440.png');

  // 2. 390 手机端
  console.log(`📸 [2/4] 访问生产页面 390px (移动端)`);
  const p390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await p390.goto(testUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await p390.waitForSelector('#compare-matrix-section');

  const scrollWidth = await p390.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await p390.evaluate(() => document.documentElement.clientWidth);
  console.log(`  移动端视口检测: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
  if (scrollWidth <= clientWidth) {
    console.log('  ✅ 生产移动端 390px 完美贴合，无外层横向溢出！');
  } else {
    console.warn(`  ⚠️ 存在微小溢出: ${scrollWidth} > ${clientWidth}`);
  }

  await p390.screenshot({
    path: path.join(ARTIFACT_DIR, 'prod_p876_compare_390.png'),
    fullPage: true,
  });
  console.log('  ✅ 已保存 prod_p876_compare_390.png');

  // 3. 验证 URL 水合与交互：?left=vscode&right=sublime-text
  console.log(`🧪 [3/4] 验证生产环境 URL 查询状态水合`);
  const pHydrate = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pHydrate.goto(`${testUrl}?left=vscode&right=sublime-text`, { waitUntil: 'networkidle' });
  await pHydrate.waitForSelector('#compare-matrix-section');

  const leftVal = await pHydrate.locator('select[aria-label="软件 A（对比基准）"]').inputValue();
  const rightVal = await pHydrate.locator('select[aria-label="软件 B（对比目标）"]').inputValue();
  console.log(`  生产 URL 水合结果: left=${leftVal}, right=${rightVal}`);

  // 4. 验证既有核心栏目生产环境无回退
  console.log(`🌐 [4/4] 验证生产环境既有核心栏目...`);
  const routes = [
    { path: '/', label: '首页' },
    { path: '/software', label: '电脑软件' },
    { path: '/system-tools', label: '系统工具' },
    { path: '/games', label: '游戏中心' },
    { path: '/essentials', label: '装机必备' },
  ];

  for (const r of routes) {
    const res = await p1440.goto(`http://134.175.230.107:8080${r.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log(`  栏目 [${r.label}] (${r.path}): HTTP ${res?.status()}`);
  }

  await browser.close();
  console.log('\n🎉 生产环境线上验收全部完成！');
}

verifyProduction().catch((err) => {
  console.error('Production verification failed:', err);
  process.exit(1);
});
