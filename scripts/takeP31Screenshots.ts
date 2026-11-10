import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const brainDir = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';

  // 1. 1440px 桌面端全站首页
  const ctx1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page1440 = await ctx1440.newPage();
  console.log('Capturing 1440px Home...');
  await page1440.goto('http://localhost:3000/');
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(brainDir, 'screenshot-p31-1440px-home.png'), fullPage: false });

  // 2. 1024px 软件详情页
  const ctx1024 = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page1024 = await ctx1024.newPage();
  console.log('Capturing 1024px Software Detail...');
  await page1024.goto('http://localhost:3000/software/vscode');
  await page1024.waitForTimeout(1000);
  await page1024.screenshot({ path: path.join(brainDir, 'screenshot-p31-1024px-software-detail.png'), fullPage: false });

  // 3. 768px 平板端游戏详情页
  const ctx768 = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const page768 = await ctx768.newPage();
  console.log('Capturing 768px Game Detail...');
  await page768.goto('http://localhost:3000/software/mindustry');
  await page768.waitForTimeout(1000);
  await page768.screenshot({ path: path.join(brainDir, 'screenshot-p31-768px-game-detail.png'), fullPage: false });

  // 4. 390px 移动端视口首页
  const ctx390 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page390 = await ctx390.newPage();
  console.log('Capturing 390px Mobile...');
  await page390.goto('http://localhost:3000/');
  await page390.waitForTimeout(1000);
  await page390.screenshot({ path: path.join(brainDir, 'screenshot-p31-390px-mobile.png'), fullPage: false });

  // 5. 管理员后台运营大盘 (1440px)
  const ctxAdmin = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageAdmin = await ctxAdmin.newPage();
  console.log('Capturing Admin Operations...');
  await pageAdmin.goto('http://localhost:3000/admin/login');
  await pageAdmin.waitForLoadState('networkidle');
  await pageAdmin.fill('input[type="text"], input[name="username"]', 'admin@softbuluo.com');
  await pageAdmin.fill('input[type="password"], input[name="password"]', 'Admin@123456');
  await pageAdmin.click('button[type="submit"]');
  await pageAdmin.waitForTimeout(1500);

  await pageAdmin.goto('http://localhost:3000/admin/operations');
  await pageAdmin.waitForTimeout(1000);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p31-admin-operations.png') });

  // 6. 后台 XLSX / CSV 批量收录工作台
  console.log('Capturing Admin Import...');
  await pageAdmin.goto('http://localhost:3000/admin/import');
  await pageAdmin.waitForTimeout(1000);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p31-admin-import-xlsx.png') });

  console.log('All P3.1 screenshots successfully captured!');
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
