import { chromium } from 'playwright';
import path from 'path';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const brainDir = 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';

  console.log('Navigating to homepage...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Featured Software & Popular Downloads
  const featured = page.locator('#featured');
  if (await featured.count() > 0) {
    await featured.screenshot({ path: path.join(brainDir, 'density_01_featured_portal.png') });
    console.log('Captured density_01_featured_portal.png');
  }

  // 2. Essential Suites (10 columns tight density)
  const suites = page.locator('#essential');
  if (await suites.count() > 0) {
    await suites.screenshot({ path: path.join(brainDir, 'density_02_essential_suites.png') });
    console.log('Captured density_02_essential_suites.png');
  }

  // 2.2 Visual Software Gallery (16:9 rich image block)
  const gallery = page.locator('#gallery');
  if (await gallery.count() > 0) {
    await gallery.screenshot({ path: path.join(brainDir, 'density_02_visual_gallery.png') });
    console.log('Captured density_02_visual_gallery.png');
  }

  // 2.5 Tool Categories (8 columns high density)
  const tools = page.locator('#tools');
  if (await tools.count() > 0) {
    await tools.screenshot({ path: path.join(brainDir, 'density_02_tools_six_cols.png') });
    console.log('Captured density_02_tools_six_cols.png');
  }

  // 2.8 Tutorials with visual banners
  const tutorials = page.locator('#tutorials');
  if (await tutorials.count() > 0) {
    await tutorials.screenshot({ path: path.join(brainDir, 'density_02_tutorials_banner.png') });
    console.log('Captured density_02_tutorials_banner.png');
  }

  // 3. MultiCategoryLeaderboard
  const hits = page.locator('#hits');
  if (await hits.count() > 0) {
    await hits.screenshot({ path: path.join(brainDir, 'density_03_four_columns_leaderboard.png') });
    console.log('Captured density_03_four_columns_leaderboard.png');
  }

  // 4. Category Page
  console.log('Navigating to category page...');
  await page.goto('http://localhost:3000/category/sys-tools', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(brainDir, 'density_04_category_dense_grid.png') });
  console.log('Captured density_04_category_dense_grid.png');

  await browser.close();
  console.log('All screenshots captured successfully.');
}

capture().catch((err) => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
