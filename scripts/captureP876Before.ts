import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';
const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('📸 正在截取 P8.7.6 改版前 /compare 页面基线截图...');
  const browser = await chromium.launch({ headless: true });

  try {
    // 1440px
    const ctx1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p1440 = await ctx1440.newPage();
    await p1440.goto(`${BASE_URL}/compare`, { waitUntil: 'networkidle', timeout: 15000 });
    const dest1440 = path.join(ARTIFACT_DIR, 'p876_before_compare_1440.png');
    await p1440.screenshot({ path: dest1440, fullPage: true });
    console.log(`  已保存桌面端基线截图: ${dest1440}`);
    await ctx1440.close();

    // 390px
    const ctx390 = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });
    const p390 = await ctx390.newPage();
    await p390.goto(`${BASE_URL}/compare`, { waitUntil: 'networkidle', timeout: 15000 });
    const dest390 = path.join(ARTIFACT_DIR, 'p876_before_compare_390.png');
    await p390.screenshot({ path: dest390, fullPage: true });
    console.log(`  已保存移动端基线截图: ${dest390}`);
    await ctx390.close();

    console.log('✅ 基线截图保存成功！');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
