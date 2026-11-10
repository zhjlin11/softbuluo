import { chromium } from 'playwright';
import path from 'path';

async function main() {
  console.log('🚀 开始截取软游部落 P8 生产上线验收、多视口与后台运维数据大盘真实截图...');
  const browser = await chromium.launch({ headless: true });
  const brainDir = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';

  // ============================================
  // 1. 390px 移动端视口 (390 x 844)
  // ============================================
  console.log('\n--- 1. 390px 移动端截图 ---');
  const ctx390 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  
  // 1.1 移动端软件详情页 (VS Code，真实版本、官方来源与直接下载)
  const page390Detail = await ctx390.newPage();
  console.log('Capturing 390px Software Detail (/software/vscode)...');
  await page390Detail.goto('http://localhost:3000/software/vscode', { waitUntil: 'networkidle' });
  await page390Detail.waitForTimeout(1000);
  await page390Detail.screenshot({ path: path.join(brainDir, 'screenshot-p8-390px-software-detail.png') });

  // 1.2 移动端会员订阅与商业化方案
  const page390Membership = await ctx390.newPage();
  console.log('Capturing 390px Membership (/membership)...');
  await page390Membership.goto('http://localhost:3000/membership', { waitUntil: 'networkidle' });
  await page390Membership.waitForTimeout(1000);
  await page390Membership.screenshot({ path: path.join(brainDir, 'screenshot-p8-390px-membership.png') });

  // ============================================
  // 2. 768px 平板视口 (768 x 1024)
  // ============================================
  console.log('\n--- 2. 768px 平板端截图 ---');
  const ctx768 = await browser.newContext({ viewport: { width: 768, height: 1024 } });

  // 2.1 平板端软件横向对比详情页（VS Code vs Sublime Text 真实证据矩阵）
  const page768Compare = await ctx768.newPage();
  console.log('Capturing 768px Comparison Detail (/compare/vscode-vs-sublime-text)...');
  await page768Compare.goto('http://localhost:3000/compare/vscode-vs-sublime-text', { waitUntil: 'networkidle' });
  await page768Compare.waitForTimeout(1000);
  await page768Compare.screenshot({ path: path.join(brainDir, 'screenshot-p8-768px-comparison-detail.png') });

  // 2.2 平板端开放 API 规范与文档中心
  const page768ApiDocs = await ctx768.newPage();
  console.log('Capturing 768px API Docs (/docs/api)...');
  await page768ApiDocs.goto('http://localhost:3000/docs/api', { waitUntil: 'networkidle' });
  await page768ApiDocs.waitForTimeout(1000);
  await page768ApiDocs.screenshot({ path: path.join(brainDir, 'screenshot-p8-768px-api-docs.png') });

  // ============================================
  // 3. 1024px 笔记本视口 (1024 x 900)
  // ============================================
  console.log('\n--- 3. 1024px 笔记本端截图 ---');
  const ctx1024 = await browser.newContext({ viewport: { width: 1024, height: 900 } });

  // 3.1 会员结算收银台（微信支付接入与安全提示）
  const page1024Checkout = await ctx1024.newPage();
  console.log('Capturing 1024px Checkout (/checkout?productId=prod-vip-year)...');
  await page1024Checkout.goto('http://localhost:3000/checkout?productId=prod-vip-year', { waitUntil: 'networkidle' });
  await page1024Checkout.waitForTimeout(1000);
  await page1024Checkout.screenshot({ path: path.join(brainDir, 'screenshot-p8-1024px-checkout.png') });

  // 3.2 笔记本视口社区生态与技术交流大厅
  const page1024Community = await ctx1024.newPage();
  console.log('Capturing 1024px Community Portal (/community)...');
  await page1024Community.goto('http://localhost:3000/community', { waitUntil: 'networkidle' });
  await page1024Community.waitForTimeout(1000);
  await page1024Community.screenshot({ path: path.join(brainDir, 'screenshot-p8-1024px-community.png') });

  // ============================================
  // 4. 1440px 桌面视口 - 管理后台与运维大盘 (1440 x 900)
  // ============================================
  console.log('\n--- 4. 1440px 桌面端管理后台与大盘截图 ---');
  const ctx1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageAdmin = await ctx1440.newPage();

  // 4.1 管理后台登录
  console.log('Logging in to Admin Portal (1440px)...');
  await pageAdmin.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });
  await pageAdmin.fill('input[type="text"], input[name="identifier"], input[placeholder*="账号"], input[placeholder*="邮箱"]', 'admin@softbuluo.com');
  await pageAdmin.fill('input[type="password"]', 'Admin@123456');
  await pageAdmin.click('button[type="submit"]');
  await pageAdmin.waitForURL('**/admin**', { timeout: 10000 });
  await pageAdmin.waitForTimeout(1000);

  // 4.2 运维数据大盘、流量与下载转化漏斗
  console.log('Capturing 1440px Admin Analytics & Operations Dashboard (/admin/analytics)...');
  await pageAdmin.goto('http://localhost:3000/admin/analytics', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1200);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p8-1440px-admin-analytics.png') });

  // 4.3 搜索引擎收录审计与真实站长平台状态
  console.log('Capturing 1440px Admin SEO Audit & Search Consoles (/admin/seo/audit)...');
  await pageAdmin.goto('http://localhost:3000/admin/seo/audit', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1200);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p8-1440px-admin-seo-audit.png') });

  // 4.4 资源管理工作台（已发布正式资源与草稿隔离）
  console.log('Capturing 1440px Admin Resources & Draft Quarantine (/admin/resources)...');
  await pageAdmin.goto('http://localhost:3000/admin/resources', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1200);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p8-1440px-admin-resources.png') });

  // 4.5 官方外链与下载健康检查监控看板
  console.log('Capturing 1440px Admin Link Monitor (/admin/link-monitor)...');
  await pageAdmin.goto('http://localhost:3000/admin/link-monitor', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1200);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p8-1440px-admin-link-monitor.png') });

  await browser.close();
  console.log('🎉 软游部落 P8 全量真实截图截取完成！');
}

main().catch(err => {
  console.error('截图执行异常:', err);
  process.exit(1);
});
