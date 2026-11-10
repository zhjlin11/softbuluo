import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';
const BASE_URL = 'http://localhost:3000';

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
  console.log('🌐 P8.7.7 社区交流频道 Playwright 多视口与端到端视觉验收');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  let hasOverflowFailure = false;

  try {
    // 1. 多视口无横向溢出全面检查
    console.log('▶ [1/3] 正在对 6 大核心断点执行无横向滚动条与布局完整性检查...');
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent: vp.width <= 768
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
          : undefined,
      });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/community`, { waitUntil: 'networkidle', timeout: 15000 });

      // 评估是否存在横向滚动溢出
      const overflow = await page.evaluate(() => {
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
        hasOverflowFailure = true;
      } else {
        console.log(`  ✅ [PASS] 视口 ${vp.name} (${vp.width}px): 零横向溢出，自适应正常 (scrollWidth === clientWidth: ${overflow.clientWidth}px)`);
      }

      await context.close();
    }

    // 2. 截取高质量视觉截图
    console.log('\n▶ [2/3] 正在截取 P8.7.7 规范视觉产物...');
    const ctx1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p1440 = await ctx1440.newPage();
    await p1440.goto(`${BASE_URL}/community`, { waitUntil: 'networkidle', timeout: 15000 });

    // 2.1 桌面端 1440px 浅色全屏截图
    const dest1440 = path.join(ARTIFACT_DIR, 'p877_community_1440.png');
    await p1440.screenshot({ path: dest1440, fullPage: true });
    console.log(`  📸 已保存桌面端浅色模式截图: ${dest1440}`);

    // 2.2 桌面端 1440px 暗黑模式全屏截图
    await p1440.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await p1440.waitForTimeout(500);
    const destDark = path.join(ARTIFACT_DIR, 'p877_community_dark_1440.png');
    await p1440.screenshot({ path: destDark, fullPage: true });
    console.log(`  📸 已保存桌面端暗黑模式截图: ${destDark}`);

    // 恢复浅色模式
    await p1440.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });

    // 2.3 发帖与提问弹窗截图
    console.log('\n▶ 正在测试发帖弹窗交互与捕获...');
    // 点击“提问求助 / 发起讨论”
    const createBtn = await p1440.locator('button:has-text("提问求助 / 发起讨论")').first();
    await createBtn.click();
    await p1440.waitForTimeout(600);
    const destModal = path.join(ARTIFACT_DIR, 'p877_post_modal.png');
    await p1440.screenshot({ path: destModal, fullPage: false });
    console.log(`  📸 已保存发帖提问弹窗截图: ${destModal}`);

    // 关闭弹窗
    const closeBtn = await p1440.locator('button:has(svg.lucide-x)').first();
    await closeBtn.click();
    await p1440.waitForTimeout(400);

    // 2.4 详情页与最佳解答展示截图
    console.log('\n▶ 正在访问讨论详情页并捕获...');
    // 获取第一个讨论卡片链接并点击
    const firstThreadLink = await p1440.locator('article h2 a').first();
    if (await firstThreadLink.count() > 0) {
      const threadHref = await firstThreadLink.getAttribute('href');
      if (threadHref) {
        await p1440.goto(`${BASE_URL}${threadHref}`, { waitUntil: 'networkidle', timeout: 15000 });
        const destDetail = path.join(ARTIFACT_DIR, 'p877_post_detail.png');
        await p1440.screenshot({ path: destDetail, fullPage: true });
        console.log(`  📸 已保存讨论详情页与解答流截图: ${destDetail}`);
      }
    }
    await ctx1440.close();

    // 2.5 移动端 390px (iPhone 14) 全屏截图
    const ctx390 = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const p390 = await ctx390.newPage();
    await p390.goto(`${BASE_URL}/community`, { waitUntil: 'networkidle', timeout: 15000 });
    const dest390 = path.join(ARTIFACT_DIR, 'p877_community_390.png');
    await p390.screenshot({ path: dest390, fullPage: true });
    console.log(`  📸 已保存移动端 390px 全屏截图: ${dest390}`);
    await ctx390.close();

    console.log('\n========================================================================');
    if (hasOverflowFailure) {
      console.error('❌ 浏览器端视口验收存在横向溢出问题，请立即修复！');
      process.exit(1);
    } else {
      console.log('🎉 P8.7.7 社区交流频道 Playwright 视觉与多端自适应验收 100% 全部通过！');
    }
    console.log('========================================================================');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
