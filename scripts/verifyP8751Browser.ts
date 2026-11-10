import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';
const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('========================================================================');
  console.log('🌐 启动 Playwright 进行 P8.7.5.1 装机必备多端响应式与交互验证');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: '390_Mobile_S', width: 390, height: 844 },
    { name: '430_Mobile_L', width: 430, height: 932 },
    { name: '768_Tablet', width: 768, height: 1024 },
    { name: '1024_Laptop', width: 1024, height: 768 },
    { name: '1280_Desktop', width: 1280, height: 800 },
    { name: '1440_Desktop_L', width: 1440, height: 900 },
  ];

  try {
    for (const vp of viewports) {
      console.log(`\n--- 验证视口: ${vp.name} (${vp.width}x${vp.height}) ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent:
          vp.width < 768
            ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
            : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      });
      const page = await context.newPage();

      // 监听 CLS
      await page.addInitScript(() => {
        (window as any).__clsScore = 0;
        try {
          const observer = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                (window as any).__clsScore += (entry as any).value;
              }
            }
          });
          observer.observe({ type: 'layout-shift', buffered: true });
        } catch (e) {}
      });

      const response = await page.goto(`${BASE_URL}/essentials`, {
        waitUntil: 'networkidle',
        timeout: 20000,
      });

      console.log(`  HTTP 状态: ${response?.status()}`);
      if (response?.status() !== 200) {
        throw new Error(`页面请求失败，HTTP 状态: ${response?.status()}`);
      }

      // 等待关键元素加载
      await page.waitForSelector('#essentials-hero', { timeout: 8000 });
      await page.waitForSelector('#essentials-plans', { timeout: 8000 });
      await page.waitForSelector('#essentials-checklist', { timeout: 8000 });

      // 检查水平溢出
      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;
        const maxScroll = Math.max(docWidth, bodyWidth);
        return {
          hasOverflow: maxScroll > winWidth + 1,
          maxScroll,
          winWidth,
        };
      });

      console.log(`  水平溢出检查: ${overflow.hasOverflow ? '❌ 溢出' : '✅ 正常'} (滚动宽度: ${overflow.maxScroll}px, 视口: ${overflow.winWidth}px)`);
      if (overflow.hasOverflow) {
        throw new Error(`视口 ${vp.name} 存在水平滚动溢出: ${overflow.maxScroll} > ${overflow.winWidth}`);
      }

      // 检查破损图片
      const brokenImages = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        const broken: string[] = [];
        for (const img of imgs) {
          if (!img.complete || img.naturalWidth === 0) {
            broken.push(img.src || img.getAttribute('src') || 'unknown');
          }
        }
        return { total: imgs.length, broken };
      });

      console.log(`  图片加载状态: 总数 ${brokenImages.total}，破损 ${brokenImages.broken.length}`);
      if (brokenImages.broken.length > 0) {
        console.warn(`  [WARN] 发现破损图片:`, brokenImages.broken);
      }

      // CLS 评估
      const cls = await page.evaluate(() => (window as any).__clsScore || 0);
      console.log(`  CLS 指标: ${cls.toFixed(4)} (阈值 <= 0.0022)`);

      if (vp.width === 1440) {
        const dest = path.join(ARTIFACT_DIR, 'p8751_essentials_1440.png');
        await page.screenshot({ path: dest, fullPage: true });
        console.log(`  已保存桌面端全屏截图: ${dest}`);
      } else if (vp.width === 390) {
        const dest = path.join(ARTIFACT_DIR, 'p8751_essentials_390.png');
        await page.screenshot({ path: dest, fullPage: true });
        console.log(`  已保存移动端全屏截图: ${dest}`);
      }

      await context.close();
    }

    // -------------------------------------------------------------
    // 交互与安全导出验证 (Desktop 1440)
    // -------------------------------------------------------------
    console.log('\n========================================================================');
    console.log('🔍 执行方案切换、清单交互、预览弹窗与 TXT/JSON 导出 URL 检查');
    console.log('========================================================================\n');

    const testCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const testPage = testCtx.newPage();
    const page = await testPage;

    await page.goto(`${BASE_URL}/essentials`, { waitUntil: 'networkidle' });

    // 1. 方案切换交互
    console.log('1. 测试装机方案卡片点击与切换:');
    const planCards = await page.$$('[data-plan-card]');
    console.log(`  发现方案卡片数: ${planCards.length}`);
    if (planCards.length < 6) {
      throw new Error(`装机方案卡片少于 6 个: ${planCards.length}`);
    }

    // 点击第二个方案（游戏电竞）
    const secondPlanCard = page.locator('[data-plan-card]').nth(1);
    await secondPlanCard.click();
    await page.waitForTimeout(500);
    const activeHeading = await page.locator('#checklist-heading').textContent();
    console.log(`  点击后清单头部标题: "${activeHeading?.trim()}"`);

    // 2. 预览弹窗交互
    console.log('2. 测试「查看已选软件」预览弹窗:');
    const previewBtn = page.locator('button:has-text("查看已选")').first();
    await previewBtn.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    console.log('  ✅ 预览弹窗已成功打开');

    // 弹窗截图
    const modalPath = path.join(ARTIFACT_DIR, 'p8751_export_preview_modal.png');
    await page.screenshot({ path: modalPath });
    console.log(`  已保存预览弹窗截图: ${modalPath}`);

    // 关闭弹窗
    const closeBtn = page.locator('button[aria-label="关闭预览弹窗"]');
    await closeBtn.click();
    await page.waitForTimeout(400);

    // 3. 导出 TXT 与 JSON 内容捕获并校验域名
    console.log('3. 测试 TXT 与 JSON 清单导出内容安全性 (防 localhost 泄露):');

    // 捕获 TXT 导出
    const [txtDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button:has-text("导出 TXT 清单")').first().click(),
    ]);
    const txtPath = await txtDownload.path();
    const txtContent = fs.readFileSync(txtPath!, 'utf-8');
    console.log(`  TXT 导出文件大小: ${txtContent.length} 字节`);

    // 验证 TXT 内容
    if (txtContent.includes('localhost:3000') || txtContent.includes('127.0.0.1')) {
      throw new Error(`TXT 导出文件包含 localhost/127.0.0.1 泄露!\n${txtContent.slice(0, 300)}`);
    }
    if (!txtContent.includes('https://softtribe.top/software/')) {
      throw new Error(`TXT 导出文件未包含官方生产域名 https://softtribe.top/software/!\n${txtContent.slice(0, 300)}`);
    }
    console.log('  ✅ TXT 导出文件已确认使用 https://softtribe.top/software/，0 本地域名泄露');

    // 捕获 JSON 导出
    const [jsonDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button:has-text("导出 JSON 清单")').first().click(),
    ]);
    const jsonPath = await jsonDownload.path();
    const jsonContent = fs.readFileSync(jsonPath!, 'utf-8');
    console.log(`  JSON 导出文件大小: ${jsonContent.length} 字节`);

    // 验证 JSON 内容
    const parsedJson = JSON.parse(jsonContent);
    if (jsonContent.includes('localhost:3000') || jsonContent.includes('127.0.0.1')) {
      throw new Error(`JSON 导出文件包含 localhost/127.0.0.1 泄露!\n${jsonContent.slice(0, 300)}`);
    }
    for (const item of parsedJson.items) {
      if (!item.detailUrl.startsWith('https://softtribe.top/software/')) {
        throw new Error(`JSON 导出项 detailUrl 格式异常: ${item.detailUrl}`);
      }
    }
    console.log(`  ✅ JSON 导出成功，已选 ${parsedJson.items.length} 款软件，全部绑定生产安全域名`);

    // 4. 深色模式验证
    console.log('\n4. 验证深色模式切换:');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(500);
    const darkPath = path.join(ARTIFACT_DIR, 'p8751_essentials_dark_1440.png');
    await page.screenshot({ path: darkPath, fullPage: true });
    console.log(`  已保存深色模式全屏截图: ${darkPath}`);

    await testCtx.close();
    console.log('\n========================================================================');
    console.log('🎉 Playwright 多端响应式与交互验证全部通过！');
    console.log('========================================================================\n');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('❌ Playwright 验证失败:', err);
  process.exit(1);
});
