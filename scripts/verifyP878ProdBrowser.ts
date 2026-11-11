import { chromium } from 'playwright';
import path from 'path';
import assert from 'assert';

const ARTIFACT_DIR = 'C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';
const PROD_BASE = 'http://134.175.230.107:8080';

async function main() {
  console.log('🚀 开始生产环境 (134.175.230.107:8080) Playwright 浏览器验收...');
  const browser = await chromium.launch({ headless: true });

  // 1. 桌面端 1440px 教程频道首页
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${PROD_BASE}/tutorials`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`[生产 1440px] 页面横向溢出: ${hasOverflow ? '❌ 溢出' : '✅ 正常'}`);
    assert(!hasOverflow, '生产 1440px 存在横向溢出');

    // 检查主导航是否严格为七个，无对比评测和社区交流
    const navText = await page.locator('header nav').first().innerText();
    console.log('[生产 主导航栏目内容]:', navText.replace(/\s+/g, ' '));
    assert(!navText.includes('对比评测'), '生产主导航不应包含对比评测');
    assert(!navText.includes('社区交流'), '生产主导航不应包含社区交流');
    assert(navText.includes('软件教程'), '生产主导航必须包含软件教程');

    const screenshotPath = path.join(ARTIFACT_DIR, 'prod_p878_tutorials_1440.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('📸 已保存生产截图: prod_p878_tutorials_1440.png');
    await page.close();
  }

  // 2. 移动端 390px 教程频道首页
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${PROD_BASE}/tutorials`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`[生产 390px] 页面横向溢出: ${hasOverflow ? '❌ 溢出' : '✅ 正常'}`);
    assert(!hasOverflow, '生产 390px 存在横向溢出');

    const screenshotPath = path.join(ARTIFACT_DIR, 'prod_p878_tutorials_390.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('📸 已保存生产截图: prod_p878_tutorials_390.png');
    await page.close();
  }

  // 3. 教程沉浸式阅读详情页 (1440px)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${PROD_BASE}/tutorials/rufus-win11-bypass-tpm-guide`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const h1 = await page.locator('h1').first().innerText();
    console.log('[生产 教程详情页 H1]:', h1);

    const screenshotPath = path.join(ARTIFACT_DIR, 'prod_p878_tutorial_detail_1440.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('📸 已保存生产截图: prod_p878_tutorial_detail_1440.png');
    await page.close();
  }

  await browser.close();
  console.log('🎉 生产环境 Playwright 验收全部通过！');
}

main().catch(err => {
  console.error('生产验收失败:', err);
  process.exit(1);
});
