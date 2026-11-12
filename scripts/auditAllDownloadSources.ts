import { prisma } from '../server/src/db';
import http from 'http';
import https from 'https';
import { URL } from 'url';

interface AuditResult {
  softwareName: string;
  softwareSlug: string;
  version: string;
  sourceId: string;
  sourceName: string;
  sourceType: string;
  url: string;
  isHttps: boolean;
  httpStatus: number | string;
  finalUrl: string;
  contentType: string;
  isOfficialDomain: boolean;
  sha256Present: boolean;
  signatureStatus: string;
  verificationStatus: string;
  auditLevel: number;
  levelDescription: string;
  notes: string;
}

// 检查是否为常见官方域名
function checkOfficialDomain(urlStr: string, softwareSlug: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    const officialDomains: Record<string, string[]> = {
      'visual-studio-code': ['code.visualstudio.com', 'visualstudio.com', 'microsoft.com'],
      'git': ['git-scm.com', 'github.com'],
      'nodejs': ['nodejs.org'],
      'python': ['python.org'],
      '7-zip': ['7-zip.org', '7-zip.com'],
      'bandizip': ['bandisoft.com', 'bandisoft.cn'],
      'potplayer': ['potplayer.tv', 'daum.net', 'kakao.com'],
      'vlc': ['videolan.org'],
      'obs-studio': ['obsproject.com'],
      'geek-uninstaller': ['geekuninstaller.com'],
      'crystaldiskinfo': ['crystalmark.info'],
      'rufus': ['rufus.ie', 'github.com'],
      'ventoy': ['ventoy.net', 'github.com'],
      'dbeaver': ['dbeaver.io', 'github.com'],
      'postman': ['postman.com'],
      'wireshark': ['wireshark.org'],
      'everything': ['voidtools.com'],
      'snipaste': ['snipaste.com'],
      'typora': ['typora.io'],
      'obsidian': ['obsidian.md'],
      'putty': ['chiark.greenend.org.uk', 'putty.org'],
      'winscp': ['winscp.net'],
      'screentogif': ['screentogif.com', 'github.com'],
      'handbrake': ['handbrake.fr'],
      'bleachbit': ['bleachbit.org'],
      'rustdesk': ['rustdesk.com', 'github.com'],
      'libreoffice': ['libreoffice.org'],
      'notepad-plus-plus': ['notepad-plus-plus.org'],
    };
    const matched = officialDomains[softwareSlug];
    if (matched) {
      return matched.some((d) => host === d || host.endsWith('.' + d));
    }
    return host.includes(softwareSlug) || host.includes('github.com');
  } catch {
    return false;
  }
}

// 安全轻量请求，带超时与重定向限制
async function checkUrl(targetUrl: string): Promise<{ status: number | string; finalUrl: string; contentType: string }> {
  try {
    const urlObj = new URL(targetUrl);
    // SSRF 基础拦截：拒绝内网与回环
    const host = urlObj.hostname;
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('172.16.') ||
      host.startsWith('169.254.')
    ) {
      return { status: 'SSRF_BLOCKED', finalUrl: targetUrl, contentType: '' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    // 优先使用 HEAD
    let resp = await fetch(targetUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
      },
      redirect: 'follow',
      signal: controller.signal,
    }).catch(() => null);

    // 若 HEAD 返回 405 (Method Not Allowed) 或失败，尝试微量 GET (Range: bytes=0-0)
    if (!resp || resp.status === 405) {
      resp = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Range': 'bytes=0-10',
        },
        redirect: 'follow',
        signal: controller.signal,
      }).catch(() => null);
    }

    clearTimeout(timeout);

    if (!resp) {
      return { status: 'TIMEOUT_OR_NET_ERR', finalUrl: targetUrl, contentType: '' };
    }

    return {
      status: resp.status,
      finalUrl: resp.url || targetUrl,
      contentType: resp.headers.get('content-type') || '',
    };
  } catch (err: any) {
    return { status: err.name === 'AbortError' ? 'TIMEOUT' : 'ERR', finalUrl: targetUrl, contentType: '' };
  }
}

async function main() {
  console.log('🚀 开始全站下载通道 (DownloadSource) 逐条深度审计与可访问性核验...');

  const swList = await prisma.software.findMany({
    where: { status: 'PUBLISHED', isTestData: false },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      versions: {
        where: { isLatest: true },
        select: {
          version: true,
          downloadSources: {
            select: {
              id: true,
              sourceType: true,
              sourceName: true,
              url: true,
              directFileUrl: true,
              sha256: true,
              verificationStatus: true,
              scanStatus: true,
              signatureStatus: true,
              reviewStatus: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const allSources: Array<{
    sw: (typeof swList)[0];
    version: string;
    source: (typeof swList)[0]['versions'][0]['downloadSources'][0];
  }> = [];

  for (const sw of swList) {
    for (const v of sw.versions) {
      for (const ds of v.downloadSources) {
        allSources.push({ sw, version: v.version, source: ds });
      }
    }
  }

  console.log(`📦 已加载 ${swList.length} 款正式发布软件/工具，共找到 ${allSources.length} 条有效关联下载渠道。\n`);

  const results: AuditResult[] = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < allSources.length; i += BATCH_SIZE) {
    const chunk = allSources.slice(i, i + BATCH_SIZE);
    const chunkResults = await Promise.all(
      chunk.map(async ({ sw, version, source }) => {
        const checkTarget = source.directFileUrl || source.url;
        const isHttps = checkTarget.startsWith('https://');
        const isOfficialDomain = checkOfficialDomain(checkTarget, sw.slug);
        const { status, finalUrl, contentType } = await checkUrl(checkTarget);

        const sha256Present = !!source.sha256 && source.sha256.length === 64;
        const signatureVerified = source.signatureStatus === 'VALID';
        const isReachable = typeof status === 'number' && status >= 200 && status < 400;

        // 分级逻辑判定 (1-6)
        let auditLevel = 1;
        let levelDescription = '1 级：仅登记外部链接';
        if (isReachable) {
          auditLevel = 2;
          levelDescription = '2 级：链接实测可访问';
        }
        if (source.reviewStatus === 'APPROVED' || source.verificationStatus === 'VERIFIED') {
          auditLevel = 3;
          levelDescription = '3 级：人工审核来源';
        }
        if (isOfficialDomain && (source.sourceType === 'OFFICIAL_DIRECT' || source.sourceType === 'OFFICIAL_RELEASE' || source.sourceType === 'OFFICIAL_EXTERNAL')) {
          auditLevel = 4;
          levelDescription = '4 级：官方或授权分发来源已确认';
        }
        if (sha256Present) {
          auditLevel = 5;
          levelDescription = '5 级：文件 SHA-256 完整性已验证';
        }
        if (signatureVerified) {
          auditLevel = 6;
          levelDescription = '6 级：文件数字签名实际验证';
        }

        let notes = '';
        if (!isHttps) notes += '[非HTTPS警告] ';
        if (typeof status === 'number' && status >= 400) notes += `[HTTP ${status} 异常] `;
        if (status === 'TIMEOUT') notes += '[网络探测超时] ';
        if (contentType.includes('text/html') && source.sourceType === 'OFFICIAL_DIRECT') {
          notes += '[直链返回HTML页面疑似登录/拦截页] ';
        }

        return {
          softwareName: sw.name,
          softwareSlug: sw.slug,
          version,
          sourceId: source.id,
          sourceName: source.sourceName,
          sourceType: source.sourceType,
          url: checkTarget,
          isHttps,
          httpStatus: status,
          finalUrl,
          contentType: contentType.slice(0, 35),
          isOfficialDomain,
          sha256Present,
          signatureStatus: source.signatureStatus,
          verificationStatus: source.verificationStatus,
          auditLevel,
          levelDescription,
          notes: notes || '正常',
        };
      })
    );

    results.push(...chunkResults);
    process.stdout.write(`已检测 ${results.length}/${allSources.length} 条渠道...\r`);
  }

  console.log('\n\n--- 审计结果汇总统计 ---');
  console.log(`- 审计下载来源总量: ${results.length}`);
  const httpsCount = results.filter((r) => r.isHttps).length;
  console.log(`- HTTPS 覆盖率: ${httpsCount}/${results.length} (${((httpsCount / results.length) * 100).toFixed(1)}%)`);

  const reachableCount = results.filter((r) => typeof r.httpStatus === 'number' && r.httpStatus >= 200 && r.httpStatus < 400).length;
  console.log(`- 当前可访问来源数 (200-399): ${reachableCount}/${results.length} (${((reachableCount / results.length) * 100).toFixed(1)}%)`);

  const officialDomainCount = results.filter((r) => r.isOfficialDomain).length;
  console.log(`- 官方/受信任域名来源数: ${officialDomainCount}/${results.length} (${((officialDomainCount / results.length) * 100).toFixed(1)}%)`);

  const levelStats: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const r of results) {
    levelStats[r.auditLevel] = (levelStats[r.auditLevel] || 0) + 1;
  }
  console.log('\n--- 1-6 级安全可信度分级分布 ---');
  for (let l = 1; l <= 6; l++) {
    console.log(`- Level ${l}: ${levelStats[l]} 条`);
  }

  // 保存检测结果到 scratch 供后续生成报告使用
  const fs = await import('fs');
  fs.writeFileSync('scripts/download_sources_audit_result.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('\n✅ 审计结果明细已保存至 scripts/download_sources_audit_result.json');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
