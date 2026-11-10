import { chromium } from 'playwright';
import path from 'path';

async function main() {
  console.log('🚀 开始截取 P6 阶段生态多视口与后台功能验收截图...');
  const browser = await chromium.launch({ headless: true });
  const brainDir = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';

  // ============================================
  // 1. 390px 移动端视口 (390 x 844)
  // ============================================
  const ctx390 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  
  // 1.1 移动端开发者门户
  const page390Dev = await ctx390.newPage();
  console.log('Capturing 390px Developer Portal (/developer)...');
  await page390Dev.goto('http://localhost:3000/developer', { waitUntil: 'networkidle' });
  await page390Dev.waitForTimeout(1000);
  await page390Dev.screenshot({ path: path.join(brainDir, 'screenshot-p6-390px-developer-portal.png') });

  // 1.2 移动端社区讨论大厅
  const page390Community = await ctx390.newPage();
  console.log('Capturing 390px Community List (/community)...');
  await page390Community.goto('http://localhost:3000/community', { waitUntil: 'networkidle' });
  await page390Community.waitForTimeout(1000);
  await page390Community.screenshot({ path: path.join(brainDir, 'screenshot-p6-390px-community.png') });

  // ============================================
  // 2. 768px 平板视口 (768 x 1024)
  // ============================================
  const ctx768 = await browser.newContext({ viewport: { width: 768, height: 1024 } });

  // 2.1 平板端 OpenAPI 3.1 接口文档
  const page768ApiDocs = await ctx768.newPage();
  console.log('Capturing 768px OpenAPI Docs (/developers/api)...');
  await page768ApiDocs.goto('http://localhost:3000/developers/api', { waitUntil: 'networkidle' });
  await page768ApiDocs.waitForTimeout(1000);
  await page768ApiDocs.screenshot({ path: path.join(brainDir, 'screenshot-p6-768px-api-docs.png') });

  // 2.2 平板端开发者公开主页
  const page768DevPublic = await ctx768.newPage();
  console.log('Capturing 768px Developer Public Page (/developers/softbuluo-dev-team)...');
  await page768DevPublic.goto('http://localhost:3000/developers/softbuluo-dev-team', { waitUntil: 'networkidle' });
  await page768DevPublic.waitForTimeout(1000);
  await page768DevPublic.screenshot({ path: path.join(brainDir, 'screenshot-p6-768px-developer-public.png') });

  // ============================================
  // 3. 1024px 笔记本视口 (1024 x 900)
  // ============================================
  const ctx1024 = await browser.newContext({ viewport: { width: 1024, height: 900 } });

  // 3.1 社区详情与认证开发者徽章回复
  const page1024Community = await ctx1024.newPage();
  console.log('Capturing 1024px Community Detail with Verified Badge...');
  await page1024Community.goto('http://localhost:3000/community', { waitUntil: 'networkidle' });
  await page1024Community.waitForTimeout(1000);
  const firstThread = await page1024Community.$('a[href^="/community/"]');
  if (firstThread) {
    await firstThread.click();
    await page1024Community.waitForTimeout(1000);
  }
  await page1024Community.screenshot({ path: path.join(brainDir, 'screenshot-p6-1024px-community-detail.png') });

  // 3.2 开发者 API Key 自助管理工作台
  const page1024ApiKeys = await ctx1024.newPage();
  console.log('Capturing 1024px Developer API Keys Portal (/developer/api-keys)...');
  await page1024ApiKeys.goto('http://localhost:3000/developer/api-keys', { waitUntil: 'networkidle' });
  await page1024ApiKeys.waitForTimeout(1000);
  await page1024ApiKeys.screenshot({ path: path.join(brainDir, 'screenshot-p6-1024px-developer-apikeys.png') });

  // ============================================
  // 4. 1440px 桌面视口 - 管理后台各生态工作台 (1440 x 900)
  // ============================================
  const ctx1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageAdmin = await ctx1440.newPage();

  // 4.1 登录管理后台
  console.log('Logging in to Admin Portal (1440px)...');
  await pageAdmin.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });
  await pageAdmin.fill('input[type="text"], input[name="identifier"], input[placeholder*="账号"], input[placeholder*="邮箱"]', 'admin@softbuluo.com');
  await pageAdmin.fill('input[type="password"]', 'Admin@123456');
  await pageAdmin.click('button[type="submit"]');
  await pageAdmin.waitForURL('**/admin**', { timeout: 10000 });
  await pageAdmin.waitForTimeout(1000);

  // 4.2 资源审查工作台抽屉 (含未扫描证据核验)
  console.log('Capturing 1440px Admin Resources with P6 Review Workbench Drawer (/admin/resources)...');
  await pageAdmin.goto('http://localhost:3000/admin/resources', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1000);
  // 点击快速审查抽屉按钮
  const reviewBtn = await pageAdmin.$('button:has-text("审查待审资源"), button:has-text("审查下一条")');
  if (reviewBtn) {
    await reviewBtn.click();
    await pageAdmin.waitForTimeout(800);
  }
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p6-1440px-admin-resources-review.png') });

  // 4.3 开发者入驻审核后台
  console.log('Capturing 1440px Admin Developers (/admin/developers)...');
  await pageAdmin.goto('http://localhost:3000/admin/developers', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1000);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p6-1440px-admin-developers.png') });

  // 4.4 软件认领审核后台
  console.log('Capturing 1440px Admin Claims (/admin/claims)...');
  await pageAdmin.goto('http://localhost:3000/admin/claims', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1000);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p6-1440px-admin-claims.png') });

  // 4.5 社区内容治理后台
  console.log('Capturing 1440px Admin Community (/admin/community)...');
  await pageAdmin.goto('http://localhost:3000/admin/community', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1000);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p6-1440px-admin-community.png') });

  // 4.6 开放 API 监控后台
  console.log('Capturing 1440px Admin API Keys (/admin/api-keys)...');
  await pageAdmin.goto('http://localhost:3000/admin/api-keys', { waitUntil: 'networkidle' });
  await pageAdmin.waitForTimeout(1000);
  await pageAdmin.screenshot({ path: path.join(brainDir, 'screenshot-p6-1440px-admin-apikeys.png') });

  await browser.close();
  console.log('✅ P6 全量真实截图截取完成！');
}

main().catch(err => {
  console.error('截图执行异常:', err);
  process.exit(1);
});
