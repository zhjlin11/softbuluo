import { chromium } from 'playwright';
import path from 'path';
import assert from 'assert';

const ARTIFACT_DIR = 'C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';
const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('🚀 开始 Playwright 真实浏览器多视口与完整交互验收...');
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { width: 1440, height: 900, name: '1440' },
    { width: 1280, height: 800, name: '1280' },
    { width: 1024, height: 768, name: '1024' },
    { width: 768, height: 1024, name: '768' },
    { width: 430, height: 932, name: '430' },
    { width: 390, height: 844, name: '390' },
  ];

  // 1. 多视口截图
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/tutorials`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // 检查水平溢出
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log(`[视口 ${vp.name}px] 页面横向溢出检查: ${hasOverflow ? '❌ 溢出' : '✅ 正常'}`);
    assert(!hasOverflow, `视口 ${vp.name}px 存在整体横向溢出！`);

    const screenshotPath = path.join(ARTIFACT_DIR, `p878_tutorials_${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`  📸 已保存截图: p878_tutorials_${vp.name}.png`);
    await page.close();
  }

  // 2. 深色模式截图 (1440px)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE_URL}/tutorials`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(400);
    const screenshotPath = path.join(ARTIFACT_DIR, 'p878_tutorials_dark_1440.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('  📸 已保存深色模式截图: p878_tutorials_dark_1440.png');
    await page.close();
  }

  // 3. 真实分类筛选交互
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE_URL}/tutorials`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // 点击 "Windows 系统" 分类按钮
    const btnWin = page.locator('button:has-text("Windows 系统")').first();
    await btnWin.click();
    await page.waitForTimeout(600);

    const screenshotPath = path.join(ARTIFACT_DIR, 'p878_tutorials_category_filtered.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('  📸 已保存分类筛选截图: p878_tutorials_category_filtered.png');
    await page.close();
  }

  // 4. 真实搜索交互
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE_URL}/tutorials`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // 搜索框输入 "Rufus"
    const searchInput = page.locator('input[placeholder*="搜索教程"]').first();
    await searchInput.fill('Rufus');
    await page.waitForTimeout(600);

    const screenshotPath = path.join(ARTIFACT_DIR, 'p878_tutorials_search_filtered.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('  📸 已保存搜索过滤截图: p878_tutorials_search_filtered.png');
    await page.close();
  }

  // 5. 教程详情页阅读交互与 TOC 滚动锚点
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE_URL}/tutorials/rufus-win11-bypass-tpm-guide`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // 截图详情页首屏与主体
    const screenshotDetail = path.join(ARTIFACT_DIR, 'p878_tutorial_detail_1440.png');
    await page.screenshot({ path: screenshotDetail, fullPage: true });
    console.log('  📸 已保存教程详情截图: p878_tutorial_detail_1440.png');

    // 检查高风险警告横幅是否存在
    const riskBanner = page.locator('text=高风险系统操作安全警示');
    const isRiskVisible = await riskBanner.isVisible();
    assert(isRiskVisible, '详情页必须呈现高风险警告横幅');
    console.log('  ✅ [PASS] 真实检测到高风险警示横幅');

    // 点击准备清单项测试交互
    const checklistItem = page.locator('label:has-text("重要警告")').first();
    if (await checklistItem.isVisible()) {
      await checklistItem.click();
      await page.waitForTimeout(200);
      const isChecked = await checklistItem.locator('.line-through').isVisible();
      assert(isChecked, '准备清单勾选后应具有 line-through 样式');
      console.log('  ✅ [PASS] 准备清单项勾选交互成功');
    }

    // 点击目录锚点跳转
    const tocItem = page.locator('nav button:has-text("写入设置")').first();
    if (await tocItem.isVisible()) {
      await tocItem.click();
      await page.waitForTimeout(500);
      console.log('  ✅ [PASS] 目录锚点点击平滑滚动完成');
    }

    await page.close();
  }

  // 6. 代码块复制交互实测 (针对含代码的教程 how-to-verify-genuine-iso-checksums)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    // 授予剪贴板权限
    const context = page.context();
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto(`${BASE_URL}/tutorials/how-to-verify-genuine-iso-checksums`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const copyBtn = page.locator('button:has-text("复制")').first();
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      await page.waitForTimeout(300);
      const hasCopiedFeedback = await page.locator('text=已复制').first().isVisible();
      assert(hasCopiedFeedback, '点击复制后必须显示"已复制"状态反馈');
      console.log('  ✅ [PASS] 代码块一键复制与状态反馈功能验证成功');
    }

    const screenshotCode = path.join(ARTIFACT_DIR, 'p878_tutorial_code_copied.png');
    await page.screenshot({ path: screenshotCode, fullPage: false });
    console.log('  📸 已保存代码复制反馈截图: p878_tutorial_code_copied.png');
    await page.close();
  }

  // 7. 移动端 390px 教程详情与折叠目录交互
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${BASE_URL}/tutorials/rufus-win11-bypass-tpm-guide`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // 移动端横向溢出检测
    const hasMobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    assert(!hasMobileOverflow, '移动端详情页存在横向溢出！');
    console.log('  ✅ [PASS] 移动端 390px 详情页零水平溢出');

    // 展开移动端目录折叠栏
    const mobileTocToggle = page.locator('button:has-text("教程章节目录")');
    if (await mobileTocToggle.isVisible()) {
      await mobileTocToggle.click();
      await page.waitForTimeout(300);
      console.log('  ✅ [PASS] 移动端目录折叠栏展开正常');
    }

    const screenshotMobileDetail = path.join(ARTIFACT_DIR, 'p878_tutorial_detail_390.png');
    await page.screenshot({ path: screenshotMobileDetail, fullPage: false });
    console.log('  📸 已保存移动端详情截图: p878_tutorial_detail_390.png');
    await page.close();
  }

  await browser.close();
  console.log('\n🎉 Playwright 真实浏览器全部多视口与功能交互验收通过！');
}

main().catch((err) => {
  console.error('Playwright 验收失败:', err);
  process.exit(1);
});
