import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';
const PROD_URL = 'http://134.175.230.107:8080';

const EXPECTED_NAV_ITEMS = [
  '首页',
  '电脑软件',
  '系统工具',
  '游戏中心',
  '装机必备',
  '软件教程',
  '最新更新',
];

async function main() {
  console.log('========================================================================');
  console.log('🌐 P8.7.9 生产环境发布后多端真实验证与截图: ' + PROD_URL);
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });

  try {
    // 1. 桌面端 1440px 导航项目核对与截图
    console.log('▶ [1/2] 正在加载生产环境 1440px 桌面端视口...');
    const ctx1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p1440 = await ctx1440.newPage();
    const resp1440 = await p1440.goto(`${PROD_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`  状态码: ${resp1440?.status()}`);

    // 获取并断言生产环境桌面端导航项
    const desktopNavLabels = await p1440.locator('header nav[aria-label="主站导航"] button').allInnerTexts();
    console.log('  生产环境桌面端导航按钮:', desktopNavLabels);

    if (desktopNavLabels.length !== 7) {
      throw new Error(`生产环境期望 7 个导航项，实际发现 ${desktopNavLabels.length} 个`);
    }

    const matchesExpected = EXPECTED_NAV_ITEMS.every((item, idx) => desktopNavLabels[idx] === item);
    if (!matchesExpected) {
      throw new Error(`生产环境导航项不匹配: ${desktopNavLabels.join(', ')}`);
    }

    if (desktopNavLabels.includes('对比评测') || desktopNavLabels.includes('社区交流')) {
      throw new Error('生产环境依然残留对比评测或社区交流!');
    }

    const dest1440 = path.join(ARTIFACT_DIR, 'prod_p879_nav_desktop_1440.png');
    await p1440.screenshot({ path: dest1440, fullPage: false });
    console.log(`  📸 生产环境桌面端 1440px 截图已保存: ${dest1440}`);
    await ctx1440.close();

    // 2. 移动端 390px 抽屉菜单核对与截图
    console.log('\n▶ [2/2] 正在加载生产环境 390px 移动端视口...');
    const ctx390 = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const p390 = await ctx390.newPage();
    const resp390 = await p390.goto(`${PROD_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`  状态码: ${resp390?.status()}`);

    // 点击展开抽屉
    const menuBtn = p390.locator('header button[aria-label="展开导航菜单"]');
    await menuBtn.click();
    await p390.waitForSelector('div[role="dialog"][aria-label="移动端全站导航"]', { timeout: 8000 });
    await p390.waitForTimeout(500);

    const mobileNavLabels = await p390.locator('div[role="dialog"] .grid button').allInnerTexts();
    console.log('  生产环境移动端抽屉按钮:', mobileNavLabels);

    if (mobileNavLabels.length !== 7) {
      throw new Error(`生产环境移动端抽屉期望 7 项，实际发现 ${mobileNavLabels.length} 项`);
    }

    if (mobileNavLabels.includes('对比评测') || mobileNavLabels.includes('社区交流')) {
      throw new Error('生产环境移动端依然残留对比评测或社区交流!');
    }

    // 检查移动端零横向溢出
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

    const dest390 = path.join(ARTIFACT_DIR, 'prod_p879_nav_mobile_390.png');
    await p390.screenshot({ path: dest390, fullPage: false });
    console.log(`  📸 生产环境移动端 390px 截图已保存: ${dest390}`);
    await ctx390.close();

    console.log('\n🎉 生产环境浏览器验证与视觉截图完成！');
  } catch (err) {
    console.error('❌ 生产环境验收失败:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
