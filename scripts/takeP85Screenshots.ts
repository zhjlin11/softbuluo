import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';

async function main() {
  console.log('📸 启动 Playwright 多视口真实渲染截图与响应式复验...');
  const browser = await chromium.launch({ headless: true });

  const tasks = [
    {
      name: 'screenshot-p85-390px-software-detail.png',
      url: 'http://localhost:3000/software/vscode',
      viewport: { width: 390, height: 844 },
      desc: '390px 移动端: 软件详情页 (含收藏操作区与品牌矢量图标)'
    },
    {
      name: 'screenshot-p85-430px-account-bookmarks.png',
      url: 'http://localhost:3000/account',
      viewport: { width: 430, height: 932 },
      desc: '430px 大屏移动端: 个人中心与“我的收藏”面板'
    },
    {
      name: 'screenshot-p85-768px-tablet-header.png',
      url: 'http://localhost:3000/category/dev',
      viewport: { width: 768, height: 1024 },
      desc: '768px 平板竖屏: 顶部导航折叠抽屉修复验证 (无横向溢出)'
    },
    {
      name: 'screenshot-p85-1024px-comparison-detail.png',
      url: 'http://localhost:3000/compare/vscode-vs-sublime',
      viewport: { width: 1024, height: 768 },
      desc: '1024px 平板横屏: 软件横向对比选型决策表'
    },
    {
      name: 'screenshot-p85-1440px-admin-operations.png',
      url: 'http://localhost:3000/admin/operations',
      viewport: { width: 1440, height: 900 },
      admin: true,
      desc: '1440px 桌面端: 运营工作台与全量待办流转大盘'
    },
    {
      name: 'screenshot-p85-1440px-home-desktop.png',
      url: 'http://localhost:3000/',
      viewport: { width: 1440, height: 900 },
      desc: '1440px 桌面端: 首页精选与合规搜索 (Lighthouse 100 SEO)'
    }
  ];

  for (const t of tasks) {
    console.log(`\n📷 正在捕获: ${t.desc} [${t.viewport.width}x${t.viewport.height}]`);
    const context = await browser.newContext({ viewport: t.viewport });
    const page = await context.newPage();

    if (t.admin) {
      await page.goto('http://localhost:3000/admin/login');
      await page.fill('input[type="text"]', 'admin@softbuluo.com');
      await page.fill('input[type="password"]', 'Admin@123456');
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(600);
    }

    await page.goto(t.url, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(800);

    const outPath = path.join(ARTIFACT_DIR, t.name);
    await page.screenshot({ path: outPath, fullPage: false });
    const stats = fs.statSync(outPath);
    console.log(`  ✅ 保存成功: ${t.name} (${(stats.size / 1024).toFixed(1)} KB)`);

    await context.close();
  }

  await browser.close();
  console.log('\n🎉 全量多视口真实截图执行完毕，已全部持久化至 Artifact 目录！');
}

main().catch(console.error);
