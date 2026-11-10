import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';
const PROD_URL = 'http://134.175.230.107:8080';

async function main() {
  console.log('========================================================================');
  console.log('🌐 P8.7.7 生产环境真实验证与视觉截屏: ' + PROD_URL);
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });

  try {
    // 1. 桌面端 1440px
    console.log('▶ [1/2] 正在加载生产环境 1440px 桌面端视口...');
    const ctx1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p1440 = await ctx1440.newPage();
    
    const resp1440 = await p1440.goto(`${PROD_URL}/community`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`  状态码: ${resp1440?.status()}`);

    // 等待列表渲染完成
    await p1440.waitForSelector('text=软游部落技术互助社区 UI 3.0 正式上线公告与发帖规范', { timeout: 10000 });
    await p1440.waitForTimeout(1000);

    const dest1440 = path.join(ARTIFACT_DIR, 'prod_p877_community_1440.png');
    await p1440.screenshot({ path: dest1440, fullPage: true });
    console.log(`  📸 生产环境桌面端 1440px 截图已保存: ${dest1440}`);
    await ctx1440.close();

    // 2. 移动端 390px
    console.log('\n▶ [2/2] 正在加载生产环境 390px 移动端视口...');
    const ctx390 = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });
    const p390 = await ctx390.newPage();
    const resp390 = await p390.goto(`${PROD_URL}/community`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`  状态码: ${resp390?.status()}`);

    // 等待渲染并验证无横向溢出
    await p390.waitForSelector('text=技术互助', { timeout: 10000 });
    await p390.waitForTimeout(1000);

    const overflow = await p390.evaluate(() => {
      const docElem = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(docElem.scrollWidth, body.scrollWidth);
      const clientWidth = Math.max(docElem.clientWidth, body.clientWidth);
      return {
        scrollWidth,
        clientWidth,
        hasOverflow: scrollWidth > clientWidth,
      };
    });

    console.log(`  移动端溢出检查: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}, hasOverflow=${overflow.hasOverflow}`);

    const dest390 = path.join(ARTIFACT_DIR, 'prod_p877_community_390.png');
    await p390.screenshot({ path: dest390, fullPage: true });
    console.log(`  📸 生产环境移动端 390px 截图已保存: ${dest390}`);
    await ctx390.close();

    console.log('\n🎉 生产环境浏览器验证与视觉截图完成！');
  } catch (err) {
    console.error('❌ 生产环境验证失败:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
