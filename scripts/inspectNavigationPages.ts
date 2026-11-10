import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';

async function capture() {
  const browser = await chromium.launch({ headless: true });

  const pagesToTest = [
    { url: 'http://localhost:3000/', name: 'p87_01_homepage_protected.png', width: 1440, height: 900, dark: false },
    { url: 'http://localhost:3000/software', name: 'p87_02_software_channel.png', width: 1440, height: 900, dark: false },
    { url: 'http://localhost:3000/system-tools', name: 'p87_03_system_tools_scenarios.png', width: 1440, height: 900, dark: false },
    { url: 'http://localhost:3000/games', name: 'p87_04_games_channel.png', width: 1440, height: 900, dark: false },
    { url: 'http://localhost:3000/essentials', name: 'p87_05_essentials_checklist.png', width: 1440, height: 900, dark: false },
    { url: 'http://localhost:3000/compare', name: 'p87_06_compare_channel.png', width: 1440, height: 900, dark: false },
    { url: 'http://localhost:3000/tutorials', name: 'p87_07_tutorials_channel.png', width: 1440, height: 900, dark: false },
    { url: 'http://localhost:3000/updates', name: 'p87_08_updates_changelog.png', width: 1440, height: 900, dark: false },
    { url: 'http://localhost:3000/topics', name: 'p87_09_topics_index.png', width: 1440, height: 900, dark: false },
    // 移动端视图 (390px iPhone)
    { url: 'http://localhost:3000/software', name: 'p87_10_mobile_software.png', width: 390, height: 844, dark: false },
    { url: 'http://localhost:3000/essentials', name: 'p87_11_mobile_essentials.png', width: 390, height: 844, dark: false },
    // 深色模式视图 (Dark Mode)
    { url: 'http://localhost:3000/system-tools', name: 'p87_12_dark_system_tools.png', width: 1440, height: 900, dark: true },
    { url: 'http://localhost:3000/updates', name: 'p87_13_dark_updates.png', width: 1440, height: 900, dark: true },
  ];

  for (const item of pagesToTest) {
    const context = await browser.newContext({
      viewport: { width: item.width, height: item.height },
      colorScheme: item.dark ? 'dark' : 'light',
    });
    const page = await context.newPage();
    try {
      await page.goto(item.url, { waitUntil: 'networkidle', timeout: 15000 });
      // 等待 1 秒确保动画与图片完成加载
      await page.waitForTimeout(1000);
      const filePath = path.join(ARTIFACT_DIR, item.name);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`✅ 已截图: ${item.name} (${item.width}x${item.height}, dark: ${item.dark})`);
    } catch (err: any) {
      console.error(`❌ 截图失败: ${item.name}`, err.message);
    } finally {
      await context.close();
    }
  }

  await browser.close();
}

capture().catch((e) => {
  console.error('Playwright 截图脚本异常:', e);
  process.exit(1);
});
