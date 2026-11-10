import { chromium } from 'playwright';
import path from 'path';

async function main() {
  console.log('🚀 开始截取 P4 阶段功能与多视口验收截图...');
  const browser = await chromium.launch({ headless: true });
  const brainDir = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';

  // 1. 1440px 对比列表大盘 (/compare)
  const ctx1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageCompareList = await ctx1440.newPage();
  console.log('Capturing 1440px Comparison List (/compare)...');
  await pageCompareList.goto('http://localhost:3000/compare', { waitUntil: 'networkidle' });
  await pageCompareList.waitForTimeout(1000);
  await pageCompareList.screenshot({ path: path.join(brainDir, 'screenshot-p4-compare-list.png') });

  // 2. 1200px 对比详情页 (/compare/vscode-vs-sublime)
  const ctx1200 = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const pageCompareDetail = await ctx1200.newPage();
  console.log('Capturing 1200px Comparison Detail (/compare/vscode-vs-sublime)...');
  await pageCompareDetail.goto('http://localhost:3000/compare/vscode-vs-sublime', { waitUntil: 'networkidle' });
  await pageCompareDetail.waitForTimeout(1000);
  await pageCompareDetail.screenshot({ path: path.join(brainDir, 'screenshot-p4-compare-detail.png') });

  // 3. 1024px 软件详情页 (包含替代品关联与真实用户评价评分)
  const ctx1024 = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  const pageSoftwareDetail = await ctx1024.newPage();
  console.log('Capturing 1024px Software Detail (/software/vscode)...');
  await pageSoftwareDetail.goto('http://localhost:3000/software/vscode', { waitUntil: 'networkidle' });
  await pageSoftwareDetail.waitForTimeout(1000);
  // 滚动到替代品与评论区域
  await pageSoftwareDetail.evaluate(() => {
    window.scrollBy(0, 750);
  });
  await pageSoftwareDetail.waitForTimeout(800);
  await pageSoftwareDetail.screenshot({ path: path.join(brainDir, 'screenshot-p4-software-reviews-alts.png') });

  // 4. 390px 移动端视口对比详情
  const ctx390 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page390 = await ctx390.newPage();
  console.log('Capturing 390px Mobile Compare Detail...');
  await page390.goto('http://localhost:3000/compare/vscode-vs-sublime', { waitUntil: 'networkidle' });
  await page390.waitForTimeout(1000);
  await page390.screenshot({ path: path.join(brainDir, 'screenshot-p4-390px-mobile-compare.png') });

  // 登录管理后台并捕获新后台页面
  const ctxAdmin = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageAdmin = await ctxAdmin.newPage();
  console.log('Logging in to Admin...');
  await pageAdmin.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });
  await pageAdmin.fill('input[type="text"], input[name="username"]', 'admin@softbuluo.com');
  await pageAdmin.fill('input[type="password"], input[name="password"]', 'Admin@123456');
  await pageAdmin.click('button[type="submit"]');
  await pageAdmin.waitForTimeout(1500);

  // 5. SEO 关键词库管理 (/admin/seo/keywords)
  console.log('Capturing Admin SEO Keywords...');
  await pageAdmin.goto('http://localhost:3000/admin/seo/keywords', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1000);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p4-admin-keywords.png') });

  // 6. SEO 质量 0-100 审计大盘 (/admin/seo/audit)
  console.log('Capturing Admin SEO Audit...');
  await pageAdmin.goto('http://localhost:3000/admin/seo/audit', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1000);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p4-admin-seo-audit.png') });

  // 7. AI 辅助运营工作台 (/admin/ai-assistant)
  console.log('Capturing Admin AI Assistant...');
  await pageAdmin.goto('http://localhost:3000/admin/ai-assistant', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1000);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p4-admin-ai-assistant.png') });

  // 8. 站点流量与搜索意图分析 (/admin/analytics)
  console.log('Capturing Admin Analytics...');
  await pageAdmin.goto('http://localhost:3000/admin/analytics', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1000);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p4-admin-analytics.png') });

  await browser.close();
  console.log('✅ 所有 P4 截图捕获完成并已持久化到脑图目录！');
}

main().catch(console.error);
