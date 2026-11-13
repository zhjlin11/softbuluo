import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '430', width: 430, height: 932 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1280', width: 1280, height: 800 },
  { name: '1440', width: 1440, height: 900 },
];

const PAGES = [
  { name: 'p901_software', path: '/software' },
  { name: 'p901_system_tools', path: '/system-tools' },
  { name: 'p901_games', path: '/games' },
  { name: 'p901_essentials', path: '/essentials' },
  { name: 'p901_tutorials', path: '/tutorials' },
  { name: 'p901_updates', path: '/updates' },
];

async function run() {
  console.log('📸 开始执行 P9.0.1 多视口真实浏览器端点验收截图...');
  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent: `Mozilla/5.0 (${vp.width <= 768 ? 'Mobile; Android 13' : 'Windows NT 10.0; Win64; x64'}) SoftBuluo-Playwright/3.0`,
    });
    const page = await context.newPage();

    for (const p of PAGES) {
      const url = `http://localhost:3000${p.path}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 8000 });
        const screenshotPath = path.join(ARTIFACT_DIR, `${p.name}_${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`  ✓ 截图已保存: [${vp.name}px] ${p.path} -> ${screenshotPath}`);
      } catch (err: any) {
        console.warn(`  ⚠ 截图告警 [${vp.name}px] ${p.path}: ${err.message}`);
      }
    }
    await context.close();
  }

  await browser.close();
  console.log('🎉 P9.0.1 多视口真实浏览器端点截图完成！');
}

run().catch(console.error);
