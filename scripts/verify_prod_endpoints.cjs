const https = require('https');

const URLS = [
  'https://softtribe.top/',
  'https://softtribe.top/software',
  'https://softtribe.top/system-tools',
  'https://softtribe.top/games',
  'https://softtribe.top/essentials',
  'https://softtribe.top/tutorials',
  'https://softtribe.top/updates',
  'https://softtribe.top/compare',
  'https://softtribe.top/community',
  'https://softtribe.top/sitemap.xml',
  'https://softtribe.top/sitemap-software.xml',
  'https://softtribe.top/sitemap-games.xml',
  'https://softtribe.top/api/v1/health',
  'https://softtribe.top/software/sharex',
  'https://softtribe.top/software/handbrake',
  'https://softtribe.top/software/notepad-plus-plus',
  'https://softtribe.top/software/gimp',
  'https://softtribe.top/software/process-explorer',
  'https://softtribe.top/software/autoruns',
  'https://softtribe.top/software/audacity',
  'https://softtribe.top/software/sumatrapdf',
  'https://softtribe.top/software/memtest86',
  'https://softtribe.top/software/windows-terminal'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'SoftTribe-SmokeChecker/1.0' } }, (res) => {
      resolve({ url, status: res.statusCode, ok: res.statusCode === 200 });
    });
    req.on('error', (err) => {
      resolve({ url, status: 0, ok: false, error: err.message });
    });
    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ url, status: 0, ok: false, error: 'TIMEOUT' });
    });
  });
}

async function main() {
  console.log('=== VERIFYING LIVE PRODUCTION HTTPS ENDPOINTS ===\n');
  let passed = 0;
  let failed = 0;

  for (const url of URLS) {
    const res = await checkUrl(url);
    if (res.ok) {
      passed++;
      console.log(`  ✓ [HTTP ${res.status}] ${url}`);
    } else {
      failed++;
      console.log(`  ✗ [HTTP ${res.status}] ${url} (${res.error || 'FAIL'})`);
    }
  }

  console.log(`\n验收总结: ${passed}/${URLS.length} 通过 | 失败: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
