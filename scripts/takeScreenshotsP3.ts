import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const brainDir = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';

  // 1. Login to admin
  console.log('Logging in to admin...');
  await page.goto('http://localhost:3000/admin/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="text"], input[name="username"]', 'admin');
  await page.fill('input[type="password"], input[name="password"]', 'Admin@123456');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  // 2. Admin Operations Dashboard
  console.log('Capturing Admin Operations...');
  await page.goto('http://localhost:3000/admin/operations');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(brainDir, 'screenshot-p3-admin-operations.png') });

  // 3. Admin Import
  console.log('Capturing Admin Import...');
  await page.goto('http://localhost:3000/admin/import');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(brainDir, 'screenshot-p3-admin-import.png') });

  // 4. Admin Version Monitor
  console.log('Capturing Admin Version Monitor...');
  await page.goto('http://localhost:3000/admin/version-monitor');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(brainDir, 'screenshot-p3-admin-version-monitor.png') });

  // 5. Admin Link Monitor
  console.log('Capturing Admin Link Monitor...');
  await page.goto('http://localhost:3000/admin/link-monitor');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(brainDir, 'screenshot-p3-admin-link-monitor.png') });

  // 6. Front-end Category Page
  console.log('Capturing Category Page...');
  await page.goto('http://localhost:3000/category/developer-tools');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(brainDir, 'screenshot-p3-category.png') });

  console.log('All P3 screenshots captured successfully!');
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
