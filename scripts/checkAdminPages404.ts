import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('response', (res) => {
    if (res.status() === 404) {
      console.log(`[404] on ${page.url()}: ${res.url()}`);
    }
  });

  console.log('Logging in...');
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="text"], input[name="identifier"]', 'admin@softbuluo.com');
  await page.fill('input[type="password"]', 'Admin@123456');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**');

  const pages = [
    '/admin/comparisons',
    '/admin/seo/audit',
    '/admin/ai-assistant',
  ];

  for (const p of pages) {
    console.log(`--- Visiting ${p} ---`);
    await page.goto('http://localhost:3000' + p, { waitUntil: 'networkidle' });
  }

  await browser.close();
}

main().catch(console.error);
