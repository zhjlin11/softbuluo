import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function main() {
  const outDir = path.resolve('public/screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('🚀 正在启动 Playwright Chromium 浏览器进行真实页面验收...');
  const browser = await chromium.launch({ headless: true });

  // 1. 1440px 桌面端
  console.log('📸 截图 1: 1440px 桌面端首页');
  const page1440 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page1440.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page1440.screenshot({ path: path.join(outDir, 'screenshot-1440px-home.png'), fullPage: false });
  await page1440.screenshot({ path: path.join(outDir, 'screenshot-1440px-home-full.png'), fullPage: true });

  // 2. 1024px 平板端
  console.log('📸 截图 2: 1024px 平板端');
  const page1024 = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await page1024.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page1024.screenshot({ path: path.join(outDir, 'screenshot-1024px-tablet.png') });

  // 3. 390px 移动端
  console.log('📸 截图 3: 390px 手机端');
  const page390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page390.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page390.screenshot({ path: path.join(outDir, 'screenshot-390px-mobile.png') });

  // 4. 搜索结果列表截图
  console.log('📸 截图 4: 搜索结果横向列表');
  const pageSearch = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pageSearch.goto('http://localhost:3000/?q=Chrome', { waitUntil: 'networkidle' });
  await pageSearch.screenshot({ path: path.join(outDir, 'screenshot-search-result.png') });

  // 5. 详情页截图
  console.log('📸 截图 5: 软件详情页 (VS Code)');
  const pageDetail = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pageDetail.goto('http://localhost:3000/software/vscode', { waitUntil: 'networkidle' });
  await pageDetail.screenshot({ path: path.join(outDir, 'screenshot-software-detail.png') });

  // 6. 游戏中心自适应单卡截图
  console.log('📸 截图 6: 游戏中心自适应卡片');
  const gameSection = await page1440.$('#games');
  if (gameSection) {
    await gameSection.screenshot({ path: path.join(outDir, 'screenshot-game-single.png') });
  }

  await browser.close();
  console.log('🎉 全部真实浏览器验收截图已成功保存至 public/screenshots/ !');
}

main().catch(console.error);
