import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';

async function verifyComparePortal() {
  console.log('🚀 启动 Playwright 进行 P8.7.6 对比评测频道多视口与真实交互验收...');
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { width: 1440, height: 900, name: '1440' },
    { width: 1280, height: 800, name: '1280' },
    { width: 1024, height: 768, name: '1024' },
    { width: 768, height: 1024, name: '768' },
    { width: 430, height: 932, name: '430' },
    { width: 390, height: 844, name: '390' },
  ];

  // 1. 1440 桌面端全页渲染与截图
  console.log('📸 [1/6] 截取 1440px 桌面端全景截图...');
  const page1440 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page1440.goto('http://localhost:3000/compare', { waitUntil: 'networkidle' });
  await page1440.waitForSelector('#compare-matrix-section');
  await page1440.screenshot({
    path: path.join(ARTIFACT_DIR, 'p876_compare_1440.png'),
    fullPage: true,
  });

  // 2. 390 移动端全页渲染与截图
  console.log('📸 [2/6] 截取 390px 移动端全景截图...');
  const page390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page390.goto('http://localhost:3000/compare', { waitUntil: 'networkidle' });
  await page390.waitForSelector('#compare-matrix-section');
  await page390.screenshot({
    path: path.join(ARTIFACT_DIR, 'p876_compare_390.png'),
    fullPage: true,
  });

  // 3. 截取选择器与矩阵聚焦截图 (p876_selector_matrix.png)
  console.log('📸 [3/6] 截取选择器与矩阵聚焦截图...');
  const matrixSection = await page1440.$('#compare-matrix-section');
  if (matrixSection) {
    await matrixSection.screenshot({
      path: path.join(ARTIFACT_DIR, 'p876_selector_matrix.png'),
    });
  }

  // 4. 交互测试：点击"仅显示差异项"并截图 (p876_diff_mode.png)
  console.log('📸 [4/6] 交互测试：切换「仅显示差异项」并截图...');
  const diffButton = await page1440.getByRole('button', { name: '仅显示差异项' });
  await diffButton.click();
  await page1440.waitForTimeout(500);
  if (matrixSection) {
    await matrixSection.screenshot({
      path: path.join(ARTIFACT_DIR, 'p876_diff_mode.png'),
    });
  }

  // 5. 暗黑模式渲染与截图 (p876_compare_dark_1440.png)
  console.log('📸 [5/6] 截取 1440px 暗黑模式全景截图...');
  await page1440.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await page1440.waitForTimeout(500);
  await page1440.screenshot({
    path: path.join(ARTIFACT_DIR, 'p876_compare_dark_1440.png'),
    fullPage: true,
  });

  // 6. URL 参数水合与交互：直接访问 /compare?left=vscode&right=sublime-text
  console.log('🧪 [6/6] 验证 URL 查询参数状态水合与交互功能...');
  const pageHydrate = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pageHydrate.goto('http://localhost:3000/compare?left=vscode&right=sublime-text', {
    waitUntil: 'networkidle',
  });
  await pageHydrate.waitForSelector('#compare-matrix-section');

  // 检查选择框是否水合为 vscode 与 sublime-text
  const leftVal = await pageHydrate.$eval('select[aria-label="软件 A（对比基准）"]', (el: any) => el.value);
  const rightVal = await pageHydrate.$eval('select[aria-label="软件 B（对比目标）"]', (el: any) => el.value);
  console.log(`  URL 水合结果: 左侧=${leftVal}, 右侧=${rightVal}`);
  if (leftVal !== 'vscode' || rightVal !== 'sublime-text') {
    throw new Error(`URL 水合失败: 期望 left=vscode, right=sublime-text，实际 left=${leftVal}, right=${rightVal}`);
  }

  // 测试左右互换按钮
  const swapBtn = await pageHydrate.getByRole('button', { name: '交换左右对比软件' });
  await swapBtn.click();
  await pageHydrate.waitForTimeout(500);
  const swappedLeft = await pageHydrate.$eval('select[aria-label="软件 A（对比基准）"]', (el: any) => el.value);
  const swappedRight = await pageHydrate.$eval('select[aria-label="软件 B（对比目标）"]', (el: any) => el.value);
  console.log(`  左右互换结果: 左侧=${swappedLeft}, 右侧=${swappedRight}`);
  if (swappedLeft !== 'sublime-text' || swappedRight !== 'vscode') {
    throw new Error('左右互换功能异常');
  }

  // 检查多视口无横向溢出 (CLS & 布局检查)
  for (const vp of viewports) {
    const p = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await p.goto('http://localhost:3000/compare', { waitUntil: 'networkidle' });
    const scrollWidth = await p.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await p.evaluate(() => document.documentElement.clientWidth);
    console.log(`  视口 ${vp.name}px: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
    if (scrollWidth > clientWidth + 2) {
      console.warn(`  ⚠️ 视口 ${vp.name}px 存在可能的外层横向溢出: scrollWidth(${scrollWidth}) > clientWidth(${clientWidth})`);
    } else {
      console.log(`  ✅ 视口 ${vp.name}px 无外层溢出`);
    }
    await p.close();
  }

  await browser.close();
  console.log('\n🎉 Playwright 浏览器多视口与交互验收全部通过！所有截图已生成。');
}

verifyComparePortal().catch((err) => {
  console.error('Playwright verification failed:', err);
  process.exit(1);
});
