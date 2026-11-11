import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const browser = await chromium.launch();
  const artifactDir = 'C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea';

  // 1. 1440px desktop
  const page1440 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page1440.goto('http://localhost:3000/tutorials', { waitUntil: 'networkidle' });
  await page1440.waitForTimeout(1000);
  await page1440.screenshot({ path: path.join(artifactDir, 'before_p878_tutorials_1440.png'), fullPage: true });
  console.log('Saved before_p878_tutorials_1440.png');

  // 2. 390px mobile
  const page390 = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page390.goto('http://localhost:3000/tutorials', { waitUntil: 'networkidle' });
  await page390.waitForTimeout(1000);
  await page390.screenshot({ path: path.join(artifactDir, 'before_p878_tutorials_390.png'), fullPage: true });
  console.log('Saved before_p878_tutorials_390.png');

  await browser.close();
}

main().catch(console.error);
