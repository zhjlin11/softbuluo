import { chromium } from 'playwright';
import path from 'path';

async function main() {
  console.log('🚀 开始截取 P5 阶段多视口与功能验收截图...');
  const browser = await chromium.launch({ headless: true });
  const brainDir = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';

  // 1. 390px 移动端首页 (390 x 844)
  const ctx390 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page390Home = await ctx390.newPage();
  console.log('Capturing 390px Mobile Home (/) ...');
  await page390Home.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page390Home.waitForTimeout(1000);
  await page390Home.screenshot({ path: path.join(brainDir, 'screenshot-p5-390px-mobile-home.png') });

  // 2. 390px 移动端对比详情 (390 x 844)
  const page390Compare = await ctx390.newPage();
  console.log('Capturing 390px Mobile Compare (/compare/vscode-vs-sublime) ...');
  await page390Compare.goto('http://localhost:3000/compare/vscode-vs-sublime', { waitUntil: 'networkidle' });
  await page390Compare.waitForTimeout(1000);
  await page390Compare.screenshot({ path: path.join(brainDir, 'screenshot-p5-390px-mobile-compare.png') });

  // 3. 768px 平板端教程详情 (768 x 1024)
  const ctx768 = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const page768Tutorial = await ctx768.newPage();
  console.log('Capturing 768px Tablet Tutorial (/tutorials/vscode-python-environment-setup-2026) ...');
  await page768Tutorial.goto('http://localhost:3000/tutorials/vscode-python-environment-setup-2026', { waitUntil: 'networkidle' });
  await page768Tutorial.waitForTimeout(1000);
  await page768Tutorial.screenshot({ path: path.join(brainDir, 'screenshot-p5-768px-tablet-tutorial.png') });

  // 4. 768px 平板端专题详情 (768 x 1024)
  const page768Topic = await ctx768.newPage();
  console.log('Capturing 768px Tablet Topic (/topics/developer-efficiency-suite-2026) ...');
  await page768Topic.goto('http://localhost:3000/topics/developer-efficiency-suite-2026', { waitUntil: 'networkidle' });
  await page768Topic.waitForTimeout(1000);
  await page768Topic.screenshot({ path: path.join(brainDir, 'screenshot-p5-768px-tablet-topic.png') });

  // 5. 1024px 对比详情带证据状态徽章 (1024 x 900)
  const ctx1024 = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  const page1024Compare = await ctx1024.newPage();
  console.log('Capturing 1024px Compare Detail with Evidence Status (/compare/vscode-vs-sublime) ...');
  await page1024Compare.goto('http://localhost:3000/compare/vscode-vs-sublime', { waitUntil: 'networkidle' });
  await page1024Compare.waitForTimeout(1000);
  await page1024Compare.evaluate(() => {
    window.scrollBy(0, 400);
  });
  await page1024Compare.waitForTimeout(500);
  await page1024Compare.screenshot({ path: path.join(brainDir, 'screenshot-p5-1024px-compare-evidence.png') });

  // 6. 1024px 分类浏览页 (1024 x 900)
  const page1024Category = await ctx1024.newPage();
  console.log('Capturing 1024px Category Page (/category/developer-tools) ...');
  await page1024Category.goto('http://localhost:3000/category/developer-tools', { waitUntil: 'networkidle' });
  await page1024Category.waitForTimeout(1000);
  await page1024Category.screenshot({ path: path.join(brainDir, 'screenshot-p5-1024px-category.png') });

  // 7 & 8: 1440px 登录管理后台并捕获数据治理大盘与资源列表
  const ctx1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageAdmin = await ctx1440.newPage();
  console.log('Logging in to Admin at 1440px ...');
  await pageAdmin.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });
  await pageAdmin.fill('input[type="text"], input[name="username"]', 'admin@softbuluo.com');
  await pageAdmin.fill('input[type="password"], input[name="password"]', 'Admin@123456');
  await pageAdmin.click('button[type="submit"]');
  await pageAdmin.waitForTimeout(1500);

  // 7. 运营与数据治理大盘 (/admin/analytics)
  console.log('Capturing 1440px Admin Analytics & Governance (/admin/analytics) ...');
  await pageAdmin.goto('http://localhost:3000/admin/analytics', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1500);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p5-1440px-admin-governance.png') });

  // 8. 资源管理与数据质量状态 (/admin/resources)
  console.log('Capturing 1440px Admin Resources (/admin/resources) ...');
  await pageAdmin.goto('http://localhost:3000/admin/resources', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1500);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p5-1440px-admin-resources.png') });

  await browser.close();
  console.log('✅ 所有 P5 多视口与功能截图已保存至 brain 目录！');
}

main().catch(console.error);
