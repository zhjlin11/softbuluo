import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';
const BASE_URL = 'http://localhost:3000';

const EXPECTED_NAV_ITEMS = [
  '首页',
  '电脑软件',
  '系统工具',
  '游戏中心',
  '装机必备',
  '软件教程',
  '最新更新',
];

const VIEWPORTS = [
  { name: '1440 Desktop Large', width: 1440, height: 900 },
  { name: '1280 Desktop Standard', width: 1280, height: 800 },
  { name: '1024 Tablet / Small Desktop', width: 1024, height: 768 },
  { name: '768 Tablet Portrait', width: 768, height: 1024 },
  { name: '430 Mobile Large (iPhone Pro Max)', width: 430, height: 932 },
  { name: '390 Mobile Standard (iPhone 14/15)', width: 390, height: 844 },
];

async function main() {
  console.log('========================================================================');
  console.log('🌐 P8.7.9 顶部导航精简与全端多视口 Playwright 验证');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  let hasFailure = false;

  try {
    // 1. 桌面端 1440px 导航完整性检查
    console.log('▶ [1/4] 验证桌面端 1440px 导航项目...');
    const ctx1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p1440 = await ctx1440.newPage();
    await p1440.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });

    const desktopNavLabels = await p1440.locator('header nav[aria-label="主站导航"] button').allInnerTexts();
    console.log('  桌面端导航按钮:', desktopNavLabels);

    if (desktopNavLabels.length !== 7) {
      console.error(`  ❌ [FAIL] 期望 7 个导航项目，实际得到 ${desktopNavLabels.length} 个`);
      hasFailure = true;
    } else {
      console.log('  ✅ [PASS] 桌面端导航项目数量精确等于 7 个');
    }

    const matchesExpected = EXPECTED_NAV_ITEMS.every((item, idx) => desktopNavLabels[idx] === item);
    if (!matchesExpected) {
      console.error('  ❌ [FAIL] 导航项目内容或顺序不匹配! 期望:', EXPECTED_NAV_ITEMS, '实际:', desktopNavLabels);
      hasFailure = true;
    } else {
      console.log('  ✅ [PASS] 导航项目内容与严格顺序完全匹配:', desktopNavLabels.join(' | '));
    }

    if (desktopNavLabels.includes('对比评测') || desktopNavLabels.includes('社区交流')) {
      console.error('  ❌ [FAIL] 桌面端导航依然残留「对比评测」或「社区交流」!');
      hasFailure = true;
    } else {
      console.log('  ✅ [PASS] 桌面端导航成功移除「对比评测」与「社区交流」');
    }

    // 保存 1440px 浅色全屏截图
    const dest1440 = path.join(ARTIFACT_DIR, 'p879_nav_desktop_1440.png');
    await p1440.screenshot({ path: dest1440, fullPage: false });
    console.log(`  📸 桌面端 1440px 截图已保存: ${dest1440}`);

    // 保存 1440px 暗黑模式截图
    await p1440.evaluate(() => document.documentElement.classList.add('dark'));
    await p1440.waitForTimeout(400);
    const destDark = path.join(ARTIFACT_DIR, 'p879_nav_desktop_dark_1440.png');
    await p1440.screenshot({ path: destDark, fullPage: false });
    console.log(`  📸 桌面端 1440px 暗黑模式截图已保存: ${destDark}`);
    await p1440.evaluate(() => document.documentElement.classList.remove('dark'));

    await ctx1440.close();

    // 2. 桌面端 1280px 检查
    console.log('\n▶ [2/4] 验证 1280px 桌面标准分辨率...');
    const ctx1280 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const p1280 = await ctx1280.newPage();
    await p1280.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });
    const dest1280 = path.join(ARTIFACT_DIR, 'p879_nav_desktop_1280.png');
    await p1280.screenshot({ path: dest1280, fullPage: false });
    console.log(`  📸 1280px 标准桌面端截图已保存: ${dest1280}`);
    await ctx1280.close();

    // 3. 移动端 390px 抽屉菜单与导航检查
    console.log('\n▶ [3/4] 验证移动端 390px 抽屉菜单...');
    const ctx390 = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const p390 = await ctx390.newPage();
    await p390.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });

    const destMobilePage = path.join(ARTIFACT_DIR, 'p879_nav_mobile_page_390.png');
    await p390.screenshot({ path: destMobilePage, fullPage: false });
    console.log(`  📸 移动端 390px 页面首页截图已保存: ${destMobilePage}`);

    // 点击汉堡按钮展开抽屉
    const menuBtn = p390.locator('header button[aria-label="展开导航菜单"]');
    await menuBtn.click();
    await p390.waitForSelector('div[role="dialog"][aria-label="移动端全站导航"]', { timeout: 5000 });
    await p390.waitForTimeout(400);

    const mobileNavLabels = await p390.locator('div[role="dialog"] .grid button').allInnerTexts();
    console.log('  移动端抽屉导航按钮:', mobileNavLabels);

    if (mobileNavLabels.length !== 7) {
      console.error(`  ❌ [FAIL] 移动端期望 7 个导航项目，实际得到 ${mobileNavLabels.length} 个`);
      hasFailure = true;
    } else {
      console.log('  ✅ [PASS] 移动端导航项目数量精确等于 7 个');
    }

    if (mobileNavLabels.includes('对比评测') || mobileNavLabels.includes('社区交流')) {
      console.error('  ❌ [FAIL] 移动端抽屉依然残留「对比评测」或「社区交流」!');
      hasFailure = true;
    } else {
      console.log('  ✅ [PASS] 移动端抽屉成功移除「对比评测」与「社区交流」');
    }

    const destMobileMenu = path.join(ARTIFACT_DIR, 'p879_nav_mobile_menu_390.png');
    await p390.screenshot({ path: destMobileMenu, fullPage: false });
    console.log(`  📸 移动端 390px 展开菜单截图已保存: ${destMobileMenu}`);

    await ctx390.close();

    // 4. 多视口零横向滚动溢出检查
    console.log('\n▶ [4/4] 验证 6 大标准视口横向防溢出...');
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const p = await ctx.newPage();
      await p.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });

      const overflow = await p.evaluate(() => {
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

      if (overflow.hasOverflow) {
        console.error(`  ❌ [FAIL] 视口 ${vp.name} (${vp.width}px): 发现横向滚动溢出! (scrollWidth: ${overflow.scrollWidth}, clientWidth: ${overflow.clientWidth})`);
        hasFailure = true;
      } else {
        console.log(`  ✅ [PASS] 视口 ${vp.name} (${vp.width}px): 零横向溢出 (scrollWidth === clientWidth === ${overflow.clientWidth}px)`);
      }

      if (vp.width === 1024) {
        const dest1024 = path.join(ARTIFACT_DIR, 'p879_nav_tablet_1024.png');
        await p.screenshot({ path: dest1024, fullPage: false });
        console.log(`  📸 1024px 平板视口截图已保存: ${dest1024}`);
      }

      await ctx.close();
    }

    if (hasFailure) {
      console.error('\n❌ Playwright 浏览器验证存在失败项!');
      process.exit(1);
    } else {
      console.log('\n🎉 P8.7.9 顶部导航精简 Playwright 视觉与多端自适应验收 100% 全部通过！');
    }
  } catch (err) {
    console.error('❌ 测试运行异常:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
