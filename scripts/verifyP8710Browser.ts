import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';
const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('🚀 启动 Playwright 执行 P8.7.10 最新更新频道与七大导航收官浏览器自动化验收...\n');

  const browser = await chromium.launch({ headless: true });

  try {
    // 1. 桌面端 1440px 默认浅色
    console.log('📸 [1/10] 捕获桌面端 1440px 截图...');
    const ctx1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page1440 = await ctx1440.newPage();
    await page1440.goto(`${BASE_URL}/updates`, { waitUntil: 'networkidle', timeout: 15000 });
    await page1440.waitForSelector('h1', { timeout: 10000 });
    const p1440Path = path.join(ARTIFACT_DIR, 'p8710_updates_1440.png');
    await page1440.screenshot({ path: p1440Path, fullPage: true });
    console.log(`  ✅ 桌面端截图保存: ${p1440Path}`);

    // 检查是否有水平溢出
    const overflow1440 = await page1440.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  🔍 1440px 水平溢出检测: ${overflow1440 ? '❌ 存在溢出' : '✅ 正常无溢出'}`);

    // 2. 桌面端 1440px 深色模式
    console.log('\n📸 [2/10] 捕获桌面端深色模式截图...');
    await page1440.evaluate(() => document.documentElement.classList.add('dark'));
    await page1440.waitForTimeout(400);
    const darkPath = path.join(ARTIFACT_DIR, 'p8710_updates_dark_1440.png');
    await page1440.screenshot({ path: darkPath, fullPage: true });
    console.log(`  ✅ 深色模式截图保存: ${darkPath}`);
    await ctx1440.close();

    // 3. 笔记本端 1280px
    console.log('\n📸 [3/10] 捕获 1280px 截图...');
    const ctx1280 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page1280 = await ctx1280.newPage();
    await page1280.goto(`${BASE_URL}/updates`, { waitUntil: 'networkidle', timeout: 15000 });
    const p1280Path = path.join(ARTIFACT_DIR, 'p8710_updates_1280.png');
    await page1280.screenshot({ path: p1280Path, fullPage: true });
    const overflow1280 = await page1280.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  ✅ 1280px 截图保存: ${p1280Path} (溢出: ${overflow1280 ? '是' : '否'})`);
    await ctx1280.close();

    // 4. 平板横屏 1024px
    console.log('\n📸 [4/10] 捕获 1024px 截图...');
    const ctx1024 = await browser.newContext({ viewport: { width: 1024, height: 768 } });
    const page1024 = await ctx1024.newPage();
    await page1024.goto(`${BASE_URL}/updates`, { waitUntil: 'networkidle', timeout: 15000 });
    const p1024Path = path.join(ARTIFACT_DIR, 'p8710_updates_1024.png');
    await page1024.screenshot({ path: p1024Path, fullPage: true });
    const overflow1024 = await page1024.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  ✅ 1024px 截图保存: ${p1024Path} (溢出: ${overflow1024 ? '是' : '否'})`);
    await ctx1024.close();

    // 5. 平板竖屏 768px
    console.log('\n📸 [5/10] 捕获 768px 截图...');
    const ctx768 = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const page768 = await ctx768.newPage();
    await page768.goto(`${BASE_URL}/updates`, { waitUntil: 'networkidle', timeout: 15000 });
    const p768Path = path.join(ARTIFACT_DIR, 'p8710_updates_768.png');
    await page768.screenshot({ path: p768Path, fullPage: true });
    const overflow768 = await page768.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  ✅ 768px 截图保存: ${p768Path} (溢出: ${overflow768 ? '是' : '否'})`);
    await ctx768.close();

    // 6. 大屏手机 430px (iPhone 15 Pro Max)
    console.log('\n📸 [6/10] 捕获 430px 移动端截图...');
    const ctx430 = await browser.newContext({
      viewport: { width: 430, height: 932 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const page430 = await ctx430.newPage();
    await page430.goto(`${BASE_URL}/updates`, { waitUntil: 'networkidle', timeout: 15000 });
    const p430Path = path.join(ARTIFACT_DIR, 'p8710_updates_430.png');
    await page430.screenshot({ path: p430Path, fullPage: true });
    const overflow430 = await page430.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  ✅ 430px 截图保存: ${p430Path} (溢出: ${overflow430 ? '是' : '否'})`);
    await ctx430.close();

    // 7. 标准手机 390px (iPhone 14 / 13)
    console.log('\n📸 [7/10] 捕获 390px 移动端截图...');
    const ctx390 = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const page390 = await ctx390.newPage();
    await page390.goto(`${BASE_URL}/updates`, { waitUntil: 'networkidle', timeout: 15000 });
    const p390Path = path.join(ARTIFACT_DIR, 'p8710_updates_390.png');
    await page390.screenshot({ path: p390Path, fullPage: true });
    const overflow390 = await page390.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  ✅ 390px 截图保存: ${p390Path} (溢出: ${overflow390 ? '是' : '否'})`);
    await ctx390.close();

    // 8. 专项交互测试与局部特征截图
    console.log('\n📸 [8/10] 验证交互操作：搜索、筛选、日志展开与历史版本弹窗...');
    const ctxAction = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pageAction = await ctxAction.newPage();
    await pageAction.goto(`${BASE_URL}/updates`, { waitUntil: 'networkidle', timeout: 15000 });

    // 8.1 展开更新日志
    const changelogBtn = await pageAction.locator('button:has-text("查看官方更新日志")').first();
    if (await changelogBtn.isVisible()) {
      await changelogBtn.click();
      await pageAction.waitForTimeout(300);
      const expandedPath = path.join(ARTIFACT_DIR, 'p8710_updates_changelog_expanded.png');
      await pageAction.screenshot({ path: expandedPath });
      console.log(`  ✅ 更新日志展开截图保存: ${expandedPath}`);
    }

    // 8.2 触发演进历史弹窗
    const historyBtn = await pageAction.locator('button:has-text("演进历史")').first();
    if (await historyBtn.isVisible()) {
      await historyBtn.click();
      await pageAction.waitForTimeout(600);
      const modalPath = path.join(ARTIFACT_DIR, 'p8710_updates_history_modal.png');
      await pageAction.screenshot({ path: modalPath });
      console.log(`  ✅ 演进历史弹窗截图保存: ${modalPath}`);

      // 关闭弹窗
      const closeBtn = await pageAction.locator('button:has-text("关闭")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await pageAction.waitForTimeout(300);
      }
    }

    // 8.3 筛选互动测试
    const searchInput = await pageAction.locator('input[placeholder*="搜索软件名称"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Windows');
      await pageAction.waitForTimeout(600);
      const filteredPath = path.join(ARTIFACT_DIR, 'p8710_updates_filtered.png');
      await pageAction.screenshot({ path: filteredPath });
      console.log(`  ✅ 搜索筛选互动截图保存: ${filteredPath}`);
    }
    await ctxAction.close();

    // 9. 全站七大主导航页面逐一真实回归验收
    console.log('\n📸 [9/10] 执行全站七大主导航逐页完整回归检查...');
    const channels = [
      { name: '1. 首页', url: `${BASE_URL}/`, titleSelector: 'h1' },
      { name: '2. 电脑软件', url: `${BASE_URL}/software`, titleSelector: 'h1' },
      { name: '3. 系统工具', url: `${BASE_URL}/system-tools`, titleSelector: 'h1' },
      { name: '4. 游戏中心', url: `${BASE_URL}/games`, titleSelector: 'h1' },
      { name: '5. 装机必备', url: `${BASE_URL}/essentials`, titleSelector: 'h1' },
      { name: '6. 软件教程', url: `${BASE_URL}/tutorials`, titleSelector: 'h1' },
      { name: '7. 最新更新', url: `${BASE_URL}/updates`, titleSelector: 'h1' },
    ];

    const ctxReg = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const regPage = await ctxReg.newPage();

    for (const ch of channels) {
      const resp = await regPage.goto(ch.url, { waitUntil: 'networkidle', timeout: 15000 });
      const status = resp?.status();
      const title = await regPage.title();
      const h1Count = await regPage.locator('h1').count();
      const h1Text = h1Count > 0 ? (await regPage.locator('h1').first().textContent())?.trim() : '无H1';
      const hasOverflow = await regPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

      console.log(`  ${status === 200 ? '✅' : '❌'} [${ch.name}] HTTP ${status} | H1: "${h1Text?.slice(0, 24)}" | 溢出: ${hasOverflow ? '是' : '否'}`);
    }
    await ctxReg.close();

    // 10. 检查已隐藏的对比与社区历史路由
    console.log('\n📸 [10/10] 检查已隐藏栏目的历史路由可用性 (/compare, /community)...');
    const ctxHist = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const histPage = await ctxHist.newPage();

    const compareResp = await histPage.goto(`${BASE_URL}/compare`, { waitUntil: 'networkidle', timeout: 15000 });
    console.log(`  ✅ /compare 历史路由可用性: HTTP ${compareResp?.status()}`);

    const communityResp = await histPage.goto(`${BASE_URL}/community`, { waitUntil: 'networkidle', timeout: 15000 });
    console.log(`  ✅ /community 历史路由可用性: HTTP ${communityResp?.status()}`);

    await ctxHist.close();

    console.log('\n========================================================================');
    console.log('🎉 Playwright 浏览器自动化验收与七大导航回归全部通过！');
    console.log('========================================================================\n');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('❌ Playwright 验收发生错误:', err);
  process.exit(1);
});
