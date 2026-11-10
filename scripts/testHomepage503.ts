import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('response', (res) => {
    if (res.status() >= 400) {
      console.log(`[HTTP ${res.status()}] ${res.url()}`);
    }
  });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await browser.close();
}

main().catch(console.error);
