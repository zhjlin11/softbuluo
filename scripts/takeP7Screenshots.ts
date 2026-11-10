import { chromium } from 'playwright';
import path from 'path';

async function main() {
  console.log('🚀 开始截取软游部落 P7 生产上线多视口与后台运维数据大盘真实截图...');
  const browser = await chromium.launch({ headless: true });
  const brainDir = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';

  // ============================================
  // 1. 390px 移动端视口 (390 x 844)
  // ============================================
  console.log('\n--- 1. 390px 移动端截图 ---');
  const ctx390 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  
  // 1.1 移动端首页与冷启动入口
  const page390Home = await ctx390.newPage();
  console.log('Capturing 390px Home (/)...');
  await page390Home.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page390Home.waitForTimeout(1000);
  await page390Home.screenshot({ path: path.join(brainDir, 'screenshot-p7-390px-home.png') });

  // 1.2 移动端官方冷启动教程详情页
  const page390Guide = await ctx390.newPage();
  console.log('Capturing 390px Cold-start Guide (/tutorials/developer-verification-guide)...');
  await page390Guide.goto('http://localhost:3000/tutorials/developer-verification-guide', { waitUntil: 'networkidle' });
  await page390Guide.waitForTimeout(1000);
  await page390Guide.screenshot({ path: path.join(brainDir, 'screenshot-p7-390px-tutorial-guide.png') });

  // ============================================
  // 2. 768px 平板视口 (768 x 1024)
  // ============================================
  console.log('\n--- 2. 768px 平板端截图 ---');
  const ctx768 = await browser.newContext({ viewport: { width: 768, height: 1024 } });

  // 2.1 平板端社区讨论列表大厅
  const page768Community = await ctx768.newPage();
  console.log('Capturing 768px Community (/community)...');
  await page768Community.goto('http://localhost:3000/community', { waitUntil: 'networkidle' });
  await page768Community.waitForTimeout(1000);
  await page768Community.screenshot({ path: path.join(brainDir, 'screenshot-p7-768px-community.png') });

  // 2.2 平板端开发者门户
  const page768DevPortal = await ctx768.newPage();
  console.log('Capturing 768px Developer Portal (/developer)...');
  await page768DevPortal.goto('http://localhost:3000/developer', { waitUntil: 'networkidle' });
  await page768DevPortal.waitForTimeout(1000);
  await page768DevPortal.screenshot({ path: path.join(brainDir, 'screenshot-p7-768px-developer-portal.png') });

  // ============================================
  // 3. 1024px 笔记本视口 (1024 x 900)
  // ============================================
  console.log('\n--- 3. 1024px 笔记本端截图 ---');
  const ctx1024 = await browser.newContext({ viewport: { width: 1024, height: 900 } });

  // 3.1 开发者公开主页与认领资质展示
  const page1024DevPublic = await ctx1024.newPage();
  console.log('Capturing 1024px Developer Public Page (/developers/softbuluo-dev-team)...');
  await page1024DevPublic.goto('http://localhost:3000/developers/softbuluo-dev-team', { waitUntil: 'networkidle' });
  await page1024DevPublic.waitForTimeout(1000);
  await page1024DevPublic.screenshot({ path: path.join(brainDir, 'screenshot-p7-1024px-developer-public.png') });

  // 3.2 社区讨论详情与认证开发者专属徽章
  const page1024Community = await ctx1024.newPage();
  console.log('Capturing 1024px Community Detail (/community)...');
  await page1024Community.goto('http://localhost:3000/community', { waitUntil: 'networkidle' });
  await page1024Community.waitForTimeout(1000);
  const firstThread = await page1024Community.$('a[href^="/community/"]');
  if (firstThread) {
    await firstThread.click();
    await page1024Community.waitForTimeout(1000);
  }
  await page1024Community.screenshot({ path: path.join(brainDir, 'screenshot-p7-1024px-community-detail.png') });

  // ============================================
  // 4. 1440px 桌面视口 - 管理后台与数据大盘 (1440 x 900)
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

  // 4.2 流量增长、转化漏斗与生态数据大盘
  console.log('Capturing 1440px Admin Analytics & Conversion Funnel (/admin/analytics)...');
  await pageAdmin.goto('http://localhost:3000/admin/analytics', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1200);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p7-1440px-admin-analytics.png') });

  // 4.3 SEO 质量审计与站长平台状态
  console.log('Capturing 1440px Admin SEO Audit & Search Consoles (/admin/seo/audit)...');
  await pageAdmin.goto('http://localhost:3000/admin/seo/audit', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1200);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p7-1440px-admin-seo-audit.png') });

  // 4.4 资源管理工作台（63 款草稿待审隔离）
  console.log('Capturing 1440px Admin Resources & Draft Quarantine (/admin/resources)...');
  await pageAdmin.goto('http://localhost:3000/admin/resources', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1200);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p7-1440px-admin-resources.png') });

  // 4.5 开发者认领审核工作台
  console.log('Capturing 1440px Admin Claims (/admin/claims)...');
  await pageAdmin.goto('http://localhost:3000/admin/claims', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1200);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p7-1440px-admin-claims.png') });

  await browser.close();
  console.log('🎉 软游部落 P7 全量真实截图截取完成！');
}

main().catch(err => {
  console.error('截图执行异常:', err);
  process.exit(1);
});
