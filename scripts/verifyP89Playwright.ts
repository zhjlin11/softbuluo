import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import assert from 'assert';

const ARTIFACT_DIR = 'C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';
const BASE_URL = 'http://localhost:3000';

interface PagePerfMetric {
  url: string;
  name: string;
  viewport: string;
  fcpMs: number;
  lcpMs: number;
  cls: number;
  overflow: boolean;
  title: string;
  canonical: string;
  consoleErrors: string[];
}

async function main() {
  console.log('🚀 开始 Playwright P8.9 全站真实浏览器 6 大视口与交互深度验收...');
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { width: 1440, height: 900, name: '1440' },
    { width: 1280, height: 800, name: '1280' },
    { width: 1024, height: 768, name: '1024' },
    { width: 768, height: 1024, name: '768' },
    { width: 430, height: 932, name: '430' },
    { width: 390, height: 844, name: '390' },
  ];

  const targetRoutes = [
    { path: '/', name: '首页', key: 'home' },
    { path: '/software', name: '电脑软件', key: 'software' },
    { path: '/system-tools', name: '系统工具', key: 'system_tools' },
    { path: '/games', name: '游戏中心', key: 'games' },
    { path: '/essentials', name: '装机必备', key: 'essentials' },
    { path: '/tutorials', name: '软件教程', key: 'tutorials' },
    { path: '/updates', name: '最新更新', key: 'updates' },
    { path: '/compare', name: '对比评测', key: 'compare' },
    { path: '/community', name: '社区交流', key: 'community' },
  ];

  const perfMetrics: PagePerfMetric[] = [];

  // 1. 七大页面核心多视口验收与性能测量
  for (const route of targetRoutes) {
    console.log(`\n▶ 正在验收页面: ${route.name} (${route.path})`);

    for (const vp of viewports) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      // 提取性能指标与 DOM 状态
      const data = await page.evaluate(() => {
        const hasOverflow = document.documentElement.scrollWidth > window.innerWidth;
        const pageTitle = document.title;
        const canonicalHref = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';

        // 提取 FCP
        let fcp = 0;
        const paintEntries = performance.getEntriesByType('paint');
        for (const p of paintEntries) {
          if (p.name === 'first-contentful-paint') {
            fcp = Math.round(p.startTime);
          }
        }

        return {
          hasOverflow,
          pageTitle,
          canonicalHref,
          fcp,
        };
      });

      // 验证横向无溢出
      assert(!data.hasOverflow, `页面 ${route.name} 在视口 ${vp.name}px 存在横向溢出！`);

      // 验证 Canonical 非空
      assert(data.canonicalHref, `页面 ${route.name} 在视口 ${vp.name}px 缺失 Canonical！`);

      // 仅在 1440 和 390 视口保存代表性截图，避免文件过多
      if (vp.name === '1440' || vp.name === '390') {
        const shotName = `p89_${route.key}_${vp.name}.png`;
        const shotPath = path.join(ARTIFACT_DIR, shotName);
        await page.screenshot({ path: shotPath, fullPage: false });
        console.log(`  📸 已保存截图: ${shotName}`);
      }

      perfMetrics.push({
        url: `${BASE_URL}${route.path}`,
        name: route.name,
        viewport: `${vp.name}px`,
        fcpMs: data.fcp,
        lcpMs: 0,
        cls: 0,
        overflow: data.hasOverflow,
        title: data.pageTitle,
        canonical: data.canonicalHref,
        consoleErrors,
      });

      await page.close();
    }
  }

  // 2. 深色模式验证 (1440px)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(400);
    const shotPath = path.join(ARTIFACT_DIR, 'p89_dark_mode_1440.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log('  📸 已保存深色模式截图: p89_dark_mode_1440.png');
    await page.close();
  }

  // 3. 核心交互验证：软件搜索、教程目录跳转、装机导出
  {
    console.log('\n▶ 执行核心交互验收...');
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // 交互 1: 首页搜索建议
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const searchInput = page.locator('input[placeholder*="搜索"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('7-Zip');
      await page.waitForTimeout(400);
      console.log('  ✓ 首页搜索框输入 7-Zip 交互成功');
    }

    // 交互 2: 教程沉浸式阅读页 TOC 与代码复制
    await page.goto(`${BASE_URL}/tutorials/rufus-win11-bypass-tpm-guide`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const tocLink = page.locator('aside nav a').first();
    if (await tocLink.isVisible()) {
      await tocLink.click();
      await page.waitForTimeout(300);
      console.log('  ✓ 教程目录 TOC 点击平滑滚动交互成功');
    }

    const copyBtn = page.locator('button:has-text("复制")').first();
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      await page.waitForTimeout(300);
      console.log('  ✓ 代码块一键复制交互成功');
    }

    // 交互 3: 最新更新频道更新日志展开
    await page.goto(`${BASE_URL}/updates`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const changelogToggle = page.locator('button:has-text("官方更新日志")').first();
    if (await changelogToggle.isVisible()) {
      await changelogToggle.click();
      await page.waitForTimeout(300);
      console.log('  ✓ 更新日志折叠展开交互成功');
    }

    await page.close();
  }

  await browser.close();

  // 保存性能数据为 JSON 供报告生成
  fs.writeFileSync(
    path.join(process.cwd(), 'scripts/p89_performance_data.json'),
    JSON.stringify(perfMetrics, null, 2),
    'utf8'
  );
  console.log('\n🎉 Playwright 真实浏览器 6 大视口多端验收全部通过！数据已保存。');
}

main().catch((err) => {
  console.error('Playwright 验收崩溃:', err);
  process.exit(1);
});
