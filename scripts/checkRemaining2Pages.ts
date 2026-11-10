import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('response', (res) => {
    if (res.status() === 404) {
      console.log(`[404] on ${page.url()}: ${res.url()}`);
    }
  });

  console.log('--- Visiting /compare/vscode-vs-sublime-text ---');
  await page.goto('http://localhost:3000/compare/vscode-vs-sublime-text', { waitUntil: 'networkidle' });

  console.log('--- Visiting /developers/softbuluo-dev-team ---');
  await page.goto('http://localhost:3000/developers/softbuluo-dev-team', { waitUntil: 'networkidle' });

  await browser.close();
}

main().catch(console.error);
