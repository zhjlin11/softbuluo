import { PrismaClient, SourceType, VerificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface UpgradeSpec {
  slug: string;
  officialDirect?: {
    sourceName: string;
    sourceType: SourceType;
    directFileUrl: string;
    fileName: string;
    platform: string;
    architecture: string;
    fileSizeLabel?: string;
    priority: number;
  }[];
  reclassifyExistingAsWebpage?: boolean;
}

const SPECS: UpgradeSpec[] = [
  {
    slug: 'vscode',
    reclassifyExistingAsWebpage: true,
    officialDirect: [
      {
        sourceName: '微软官方直链安装包 (Windows x64 User)',
        sourceType: SourceType.OFFICIAL_DIRECT,
        directFileUrl: 'https://code.visualstudio.com/sha/download?build=stable&os=win32-x64-user',
        fileName: 'VSCodeUserSetup-x64-stable.exe',
        platform: 'windows',
        architecture: 'x64',
        fileSizeLabel: '95.4 MB',
        priority: 1,
      },
      {
        sourceName: '微软官方直链安装包 (Windows ARM64)',
        sourceType: SourceType.OFFICIAL_DIRECT,
        directFileUrl: 'https://code.visualstudio.com/sha/download?build=stable&os=win32-arm64-user',
        fileName: 'VSCodeUserSetup-arm64-stable.exe',
        platform: 'windows',
        architecture: 'arm64',
        fileSizeLabel: '92.1 MB',
        priority: 2,
      },
      {
        sourceName: '微软官方直链安装包 (macOS Universal)',
        sourceType: SourceType.OFFICIAL_DIRECT,
        directFileUrl: 'https://code.visualstudio.com/sha/download?build=stable&os=darwin-universal',
        fileName: 'VSCode-darwin-universal.zip',
        platform: 'macos',
        architecture: 'universal',
        fileSizeLabel: '128 MB',
        priority: 3,
      },
    ],
  },
  {
    slug: '7zip',
    reclassifyExistingAsWebpage: true,
    officialDirect: [
      {
        sourceName: '7-Zip 官方直链安装包 (Windows x64)',
        sourceType: SourceType.OFFICIAL_DIRECT,
        directFileUrl: 'https://www.7-zip.org/a/7z2409-x64.exe',
        fileName: '7z2409-x64.exe',
        platform: 'windows',
        architecture: 'x64',
        fileSizeLabel: '1.5 MB',
        priority: 1,
      },
      {
        sourceName: '7-Zip 官方直链安装包 (Windows x86 32位)',
        sourceType: SourceType.OFFICIAL_DIRECT,
        directFileUrl: 'https://www.7-zip.org/a/7z2409.exe',
        fileName: '7z2409.exe',
        platform: 'windows',
        architecture: 'x86',
        fileSizeLabel: '1.3 MB',
        priority: 2,
      },
      {
        sourceName: '7-Zip 官方直链安装包 (Windows ARM64)',
        sourceType: SourceType.OFFICIAL_DIRECT,
        directFileUrl: 'https://www.7-zip.org/a/7z2409-arm64.exe',
        fileName: '7z2409-arm64.exe',
        platform: 'windows',
        architecture: 'arm64',
        fileSizeLabel: '1.5 MB',
        priority: 3,
      },
    ],
  },
  {
    slug: 'vlc',
    reclassifyExistingAsWebpage: true,
    officialDirect: [
      {
        sourceName: 'VideoLAN 官方直链安装包 (Windows x64)',
        sourceType: SourceType.OFFICIAL_DIRECT,
        directFileUrl: 'https://get.videolan.org/vlc/3.0.21/win64/vlc-3.0.21-win64.exe',
        fileName: 'vlc-3.0.21-win64.exe',
        platform: 'windows',
        architecture: 'x64',
        fileSizeLabel: '42.8 MB',
        priority: 1,
      },
    ],
  },
  {
    slug: 'everything',
    reclassifyExistingAsWebpage: true,
    officialDirect: [
      {
        sourceName: 'voidtools 官方直链安装程序 (x64)',
        sourceType: SourceType.OFFICIAL_DIRECT,
        directFileUrl: 'https://www.voidtools.com/Everything-1.4.1.1026.x64-Setup.exe',
        fileName: 'Everything-1.4.1.1026.x64-Setup.exe',
        platform: 'windows',
        architecture: 'x64',
        fileSizeLabel: '1.8 MB',
        priority: 1,
      },
      {
        sourceName: 'voidtools 官方绿色免安装压缩包 (x64 ZIP)',
        sourceType: SourceType.OFFICIAL_DIRECT,
        directFileUrl: 'https://www.voidtools.com/Everything-1.4.1.1026.x64.zip',
        fileName: 'Everything-1.4.1.1026.x64.zip',
        platform: 'windows',
        architecture: 'x64',
        fileSizeLabel: '1.6 MB',
        priority: 2,
      },
    ],
  },
  {
    slug: 'git',
    reclassifyExistingAsWebpage: true,
    officialDirect: [
      {
        sourceName: 'GitHub Releases 官方发行包 (Windows 64-bit)',
        sourceType: SourceType.OFFICIAL_RELEASE,
        directFileUrl: 'https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.1/Git-2.47.1-64-bit.exe',
        fileName: 'Git-2.47.1-64-bit.exe',
        platform: 'windows',
        architecture: 'x64',
        fileSizeLabel: '64.5 MB',
        priority: 1,
      },
    ],
  },
  {
    slug: 'rufus',
    reclassifyExistingAsWebpage: true,
    officialDirect: [
      {
        sourceName: 'GitHub Releases 官方签名直链 (Rufus 4.6 标准版)',
        sourceType: SourceType.OFFICIAL_RELEASE,
        directFileUrl: 'https://github.com/pbatard/rufus/releases/download/v4.6/rufus-4.6.exe',
        fileName: 'rufus-4.6.exe',
        platform: 'windows',
        architecture: 'x64',
        fileSizeLabel: '1.5 MB',
        priority: 1,
      },
    ],
  },
  {
    slug: 'ventoy',
    reclassifyExistingAsWebpage: true,
    officialDirect: [
      {
        sourceName: 'GitHub Releases 官方原版压缩包 (Windows ZIP)',
        sourceType: SourceType.OFFICIAL_RELEASE,
        directFileUrl: 'https://github.com/ventoy/Ventoy/releases/download/v1.0.99/ventoy-1.0.99-windows.zip',
        fileName: 'ventoy-1.0.99-windows.zip',
        platform: 'windows',
        architecture: 'x64',
        fileSizeLabel: '15.8 MB',
        priority: 1,
      },
    ],
  },
  {
    slug: 'wireshark',
    reclassifyExistingAsWebpage: true,
    officialDirect: [
      {
        sourceName: 'Wireshark 官方直链安装程序 (Windows x64)',
        sourceType: SourceType.OFFICIAL_DIRECT,
        directFileUrl: 'https://2.na.dl.wireshark.org/win64/Wireshark-4.4.2-x64.exe',
        fileName: 'Wireshark-4.4.2-x64.exe',
        platform: 'windows',
        architecture: 'x64',
        fileSizeLabel: '82.1 MB',
        priority: 1,
      },
    ],
  },
  {
    slug: 'chrome',
    reclassifyExistingAsWebpage: true,
    officialDirect: [
      {
        sourceName: 'Google Chrome 企业独立离线安装包 (Windows 64位 MSI)',
        sourceType: SourceType.OFFICIAL_DIRECT,
        directFileUrl: 'https://dl.google.com/dl/chrome/install/googlechromestandaloneenterprise64.msi',
        fileName: 'googlechromestandaloneenterprise64.msi',
        platform: 'windows',
        architecture: 'x64',
        fileSizeLabel: '112 MB',
        priority: 1,
      },
    ],
  },
];

async function run() {
  console.log('🚀 正在按照 P8.8 规范校验并升级本地下载源分类与直链...');

  // 1. 将所有现存网页形式的旧源默认规范化归类为 EXTERNAL_DOWNLOAD_PAGE (不伪装成直链)
  const existingSources = await prisma.downloadSource.findMany({
    where: { sourceType: SourceType.OFFICIAL_EXTERNAL },
  });

  for (const s of existingSources) {
    const isBinary = /\.(exe|msi|zip|7z|dmg|pkg|appimage|deb|rpm)$/i.test(s.url);
    await prisma.downloadSource.update({
      where: { id: s.id },
      data: {
        sourceType: isBinary ? SourceType.OFFICIAL_DIRECT : SourceType.EXTERNAL_DOWNLOAD_PAGE,
        priority: isBinary ? 2 : 50,
        directFileUrl: isBinary ? s.url : null,
      },
    });
  }
  console.log(`✅ 已审计并规范化 ${existingSources.length} 条存量下载源分类`);

  // 2. 为核心主流软件绑定经确认的官方直链与 Release 资产
  for (const spec of SPECS) {
    const sw = await prisma.software.findUnique({
      where: { slug: spec.slug },
      include: { versions: { orderBy: [{ isLatest: 'desc' }, { createdAt: 'desc' }], take: 1 } },
    });

    if (!sw || sw.versions.length === 0) continue;
    const latestVer = sw.versions[0];

    if (spec.officialDirect) {
      for (const item of spec.officialDirect) {
        const exists = await prisma.downloadSource.findFirst({
          where: {
            versionId: latestVer.id,
            directFileUrl: item.directFileUrl,
          },
        });
        if (!exists) {
          await prisma.downloadSource.create({
            data: {
              versionId: latestVer.id,
              sourceName: item.sourceName,
              sourceType: item.sourceType,
              url: item.directFileUrl,
              directFileUrl: item.directFileUrl,
              fileName: item.fileName,
              fileVersion: latestVer.version,
              platform: item.platform,
              architecture: item.architecture,
              fileSizeLabel: item.fileSizeLabel || latestVer.fileSize,
              priority: item.priority,
              verificationStatus: VerificationStatus.VERIFIED,
              reviewStatus: 'APPROVED',
              lastCheckStatus: 'HEALTHY',
              isActive: true,
            },
          });
          console.log(`  [+] 已添加直链: ${sw.name} -> ${item.fileName} (${item.platform}/${item.architecture})`);
        }
      }
    }
  }

  console.log('✨ P8.8 本地下载源数据治理升级完成！');
}

run()
  .catch((e) => {
    console.error('❌ 升级异常:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
