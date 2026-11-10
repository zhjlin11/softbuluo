import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('response', (res) => {
    if (res.status() === 404) {
      console.log(`[404] on ${page.url()}: ${res.url()}`);
    }
  });

  console.log('--- Visiting /category/dev ---');
  await page.goto('http://localhost:3000/category/dev', { waitUntil: 'networkidle' });

  console.log('--- Visiting /topics/developer-essentials ---');
  await page.goto('http://localhost:3000/topics/developer-essentials', { waitUntil: 'networkidle' });

  console.log('--- Visiting /admin/operations ---');
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="text"], input[name="identifier"]', 'admin@softbuluo.com');
  await page.fill('input[type="password"]', 'Admin@123456');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**');
  await page.goto('http://localhost:3000/admin/operations', { waitUntil: 'networkidle' });

  await browser.close();
}

main().catch(console.error);
