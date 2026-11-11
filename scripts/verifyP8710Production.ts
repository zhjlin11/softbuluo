import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';
const PROD_BASE = 'http://134.175.230.107:8080';

async function main() {
  console.log('🌐 正在对生产环境进行 Playwright 浏览器真实端到端验收与截图...');

  const browser = await chromium.launch({ headless: true });

  try {
    // 1. 桌面端 1440px
    console.log('▶ [1/2] 桌面端 1440px 生产环境验收...');
    const ctx1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p1440 = await ctx1440.newPage();
    const resp1440 = await p1440.goto(`${PROD_BASE}/updates`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`  状态码: ${resp1440?.status()}`);

    const h1Text = await p1440.locator('h1').textContent();
    console.log(`  页面 H1: ${h1Text?.trim()}`);

    const overflow1440 = await p1440.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  1440px 水平溢出检测: ${overflow1440 ? '❌ 存在溢出' : '✅ 正常无溢出'}`);

    const dest1440 = path.join(ARTIFACT_DIR, 'prod_p8710_updates_1440.png');
    await p1440.screenshot({ path: dest1440, fullPage: true });
    console.log(`  📸 生产环境桌面端截图保存: ${dest1440}`);
    await ctx1440.close();

    // 2. 移动端 390px
    console.log('\n▶ [2/2] 移动端 390px 生产环境验收...');
    const ctx390 = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const p390 = await ctx390.newPage();
    const resp390 = await p390.goto(`${PROD_BASE}/updates`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`  状态码: ${resp390?.status()}`);

    const overflow390 = await p390.evaluate(() => {
      const docElem = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(docElem.scrollWidth, body.scrollWidth);
      const clientWidth = Math.max(docElem.clientWidth, body.clientWidth);
      return scrollWidth > clientWidth;
    });
    console.log(`  390px 水平溢出检测: ${overflow390 ? '❌ 存在溢出' : '✅ 正常无溢出'}`);

    const dest390 = path.join(ARTIFACT_DIR, 'prod_p8710_updates_390.png');
    await p390.screenshot({ path: dest390, fullPage: true });
    console.log(`  📸 生产环境移动端截图保存: ${dest390}`);
    await ctx390.close();

    console.log('\n🎉 生产环境 Playwright 验收与截图存证全部成功完成！');
  } catch (err) {
    console.error('❌ 生产环境验收失败:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
