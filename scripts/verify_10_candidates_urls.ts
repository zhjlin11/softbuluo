import { isPrivateIp, validateSafeExternalUrl } from '../server/src/utils/security';

const CANDIDATES = [
  { name: 'ShareX', slug: 'sharex', url: 'https://github.com/ShareX/ShareX/releases', home: 'https://getsharex.com/' },
  { name: 'HandBrake', slug: 'handbrake', url: 'https://handbrake.fr/downloads.php', home: 'https://handbrake.fr/' },
  { name: 'Notepad++', slug: 'notepad-plus-plus', url: 'https://notepad-plus-plus.org/downloads/', home: 'https://notepad-plus-plus.org/' },
  { name: 'GIMP', slug: 'gimp', url: 'https://www.gimp.org/downloads/', home: 'https://www.gimp.org/' },
  { name: 'Process Explorer', slug: 'process-explorer', url: 'https://download.sysinternals.com/files/ProcessExplorer.zip', home: 'https://learn.microsoft.com/sysinternals/downloads/process-explorer' },
  { name: 'Autoruns', slug: 'autoruns', url: 'https://download.sysinternals.com/files/Autoruns.zip', home: 'https://learn.microsoft.com/sysinternals/downloads/autoruns' },
  { name: 'Audacity', slug: 'audacity', url: 'https://www.audacityteam.org/download/', home: 'https://www.audacityteam.org/' },
  { name: 'Sumatra PDF', slug: 'sumatrapdf', url: 'https://www.sumatrapdfreader.org/download-free-pdf-viewer', home: 'https://www.sumatrapdfreader.org/' },
  { name: 'MemTest86', slug: 'memtest86', url: 'https://www.memtest86.com/download.htm', home: 'https://www.memtest86.com/' },
  { name: 'Windows Terminal', slug: 'windows-terminal', url: 'https://github.com/microsoft/terminal/releases', home: 'https://github.com/microsoft/terminal' },
];

async function checkUrl(url: string) {
  const safe = await validateSafeExternalUrl(url);
  if (!safe.valid) {
    return { ok: false, status: 0, error: safe.reason };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    return { ok: res.status >= 200 && res.status < 400, status: res.status, finalUrl: res.url };
  } catch (err: any) {
    return { ok: false, status: 0, error: err.message };
  }
}

async function main() {
  console.log('=== VERIFYING 10 CANDIDATE OFFICIAL URLS & DOWNLOAD ACCESS ===\n');

  for (const c of CANDIDATES) {
    console.log(`▶ 正在核查: ${c.name} (${c.slug})`);
    const homeRes = await checkUrl(c.home);
    console.log(`  官方主页: ${c.home} -> HTTP ${homeRes.status} (${homeRes.ok ? '✅ 可达' : '❌ 失败: ' + homeRes.error})`);

    const dlRes = await checkUrl(c.url);
    console.log(`  下载入口: ${c.url} -> HTTP ${dlRes.status} (${dlRes.ok ? '✅ 可达' : '❌ 失败: ' + dlRes.error})`);
    console.log('');
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
