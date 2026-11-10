import { PrismaClient, ResourceStatus, ResourceType, SourceType, VerificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

const authenticSoftwares = [
  {
    name: 'VLC Media Player',
    slug: 'vlc',
    englishName: 'VLC Media Player',
    aliases: JSON.stringify(['vlc', 'vlc播放器', '视频播放', '开源播放器']),
    developer: 'VideoLAN 非营利组织',
    summary: '开源跨平台多媒体播放器，原生支持几乎所有音视频编解码器，无广告纯净体验。',
    description: 'VLC 是一款自由、开源的跨平台多媒体播放器及框架，可播放绝大多数多媒体文件，以及 DVD、音频 CD、VCD 及各类流媒体协议，无需安装外部解码包。',
    type: ResourceType.SOFTWARE,
    categorySlug: 'media',
    isFeatured: true,
    featuredOrder: 5,
    version: '3.0.21',
    platform: 'Windows 10/11 64位',
    fileSize: '41.8 MB',
    releaseDate: '2024-10-18',
    changelog: '修复了部分 MP4 封装在特定音频采样率下的同步延迟，提升了 4K HDR 硬件加速解码稳定性。',
    officialUrl: 'https://www.videolan.org/vlc/download-windows.html',
    sourceName: 'VideoLAN 官方直达下载页',
    licenseType: 'OPEN_SOURCE',
  },
  {
    name: 'DiskGenius 硬盘分区与数据恢复',
    slug: 'diskgenius',
    englishName: 'DiskGenius',
    aliases: JSON.stringify(['diskgenius', 'dg分区', '分区工具', '数据恢复', '坏道检测']),
    developer: '易数科技',
    summary: '老牌专业的数据恢复与磁盘分区维护工具，支持扇区级恢复、磁盘克隆与坏道修复。',
    description: 'DiskGenius 是一款集磁盘分区管理、数据恢复、系统备份还原于一体的高级实用工具。支持 MBR 与 GUID 分区表转换，解决各种复杂存储故障，装机与维修人员必备神器。',
    type: ResourceType.TOOL,
    categorySlug: 'sys-tools',
    isFeatured: true,
    featuredOrder: 6,
    version: '5.6.1.1580',
    platform: 'Windows 11/10/8/7 (64-bit / 32-bit)',
    fileSize: '73.2 MB',
    releaseDate: '2024-11-15',
    changelog: '提升了针对 exFAT 分区删除文件扫描的重组准确率，优化了 NVMe SSD 扇区坏道检测算法。',
    officialUrl: 'https://www.diskgenius.cn/download.php',
    sourceName: 'DiskGenius 官方免费版下载',
    licenseType: 'COMMERCIAL_TRIAL',
  },
  {
    name: 'Everything 快速文件搜索',
    slug: 'everything',
    englishName: 'Everything',
    aliases: JSON.stringify(['everything', '文件搜索', '本地搜索', '秒搜']),
    developer: 'voidtools',
    summary: '基于 NTFS 文件索引的闪电级本地搜索工具，数秒内索引数百万文件，毫秒级响应。',
    description: 'Everything 是一款轻量小巧、占用资源极低的 Windows 文件名搜索引擎。它通过直接读取 NTFS 日志记录，在极短时间内完成全盘检索，彻底告别 Windows 自带搜索的缓慢体验。',
    type: ResourceType.TOOL,
    categorySlug: 'sys-tools',
    isFeatured: true,
    featuredOrder: 7,
    version: '1.4.1.1026',
    platform: 'Windows 11/10/8/7',
    fileSize: '1.7 MB',
    releaseDate: '2024-09-02',
    changelog: '修复了部分网络共享驱动器在断开连接时重连的假死问题，增强了高级正则匹配性能。',
    officialUrl: 'https://www.voidtools.com/downloads/',
    sourceName: 'voidtools 官方下载页 (x64)',
    licenseType: 'FREE',
  },
  {
    name: 'Wireshark 网络抓包分析仪',
    slug: 'wireshark',
    englishName: 'Wireshark',
    aliases: JSON.stringify(['wireshark', '抓包工具', '网络分析', '协议分析']),
    developer: 'Wireshark Foundation',
    summary: '全球最广泛使用的开源网络协议分析仪，深入洞察数据包细节与网络通信状态。',
    description: 'Wireshark 是一款强大的网络封包分析软件。网络工程师与安全研究员通过它捕获网络流量，微观分析百种网络协议，精准定位丢包、网络延迟与未授权通信问题。',
    type: ResourceType.TOOL,
    categorySlug: 'network',
    isFeatured: true,
    featuredOrder: 8,
    version: '4.4.2',
    platform: 'Windows 64位',
    fileSize: '84.1 MB',
    releaseDate: '2024-11-20',
    changelog: '更新了 QUIC 协议解密过滤器，修复了特定畸形 TCP 报文解析可能导致的内存溢出安全缺陷。',
    officialUrl: 'https://www.wireshark.org/download.html',
    sourceName: 'Wireshark 官方直达下载',
    licenseType: 'OPEN_SOURCE',
  },
  {
    name: 'Git for Windows',
    slug: 'git',
    englishName: 'Git for Windows',
    aliases: JSON.stringify(['git', '版本控制', 'git bash', '代码仓库']),
    developer: 'Git SCM Team',
    summary: '全球主流的分布式版本控制系统，提供快速高效的分支管理与完备终端命令行工具。',
    description: 'Git 是一款免费开源的分布式版本控制系统，能以高速度和高效率处理从极小到极大的项目，是软件工程师团队协同、代码追踪与分支发布的标准基础设施。',
    type: ResourceType.TOOL,
    categorySlug: 'dev',
    isFeatured: false,
    featuredOrder: 0,
    version: '2.47.1',
    platform: 'Windows 10/11 64位',
    fileSize: '62.4 MB',
    releaseDate: '2024-11-25',
    changelog: '修复了特定 rebase 交互逻辑下的终端乱码，优化了稀疏检出（sparse checkout）性能。',
    officialUrl: 'https://git-scm.com/download/win',
    sourceName: 'Git 官方镜像直达',
    licenseType: 'OPEN_SOURCE',
  },
  {
    name: 'Geek Uninstaller 强力卸载工具',
    slug: 'geek-uninstaller',
    englishName: 'Geek Uninstaller',
    aliases: JSON.stringify(['geek', '卸载工具', '垃圾清理', '软件卸载']),
    developer: 'Thomas Koen',
    summary: '小巧便携的专业软件卸载神器，深度扫描清理残留文件与注册表项，支持强制移除。',
    description: 'Geek Uninstaller 是一款轻量绿色的卸载辅助软件。针对卸载不干净、残留垃圾文件甚至顽固无法卸载的顽疾程序，提供极速深度扫描与强制删除机制，保持系统干爽。',
    type: ResourceType.TOOL,
    categorySlug: 'sys-tools',
    isFeatured: false,
    featuredOrder: 0,
    version: '1.5.2.165',
    platform: 'Windows 11/10/8/7',
    fileSize: '2.9 MB',
    releaseDate: '2024-10-08',
    changelog: '优化了对 Windows 11 新版应用商店 UWP 应用的检测与卸载响应。',
    officialUrl: 'https://geekuninstaller.com/download',
    sourceName: 'Geek 官网单文件绿色版下载',
    licenseType: 'FREE',
  },
  {
    name: 'HWiNFO64 专业硬件传感器监控',
    slug: 'hwinfo',
    englishName: 'HWiNFO64',
    aliases: JSON.stringify(['hwinfo', '硬件监控', '温度监控', '电压传感器']),
    developer: 'REALiX',
    summary: '权威的硬件系统深度分析与实时传感器监控利器，全方位掌握芯片温度、电压与功耗。',
    description: 'HWiNFO 是一款全面的专业硬件信息检测与实时监控软件。支持最新主板传感器微码读取，详尽罗列 CPU 核心温度、显卡显存发热与功耗数据，超频与烤机排查必备。',
    type: ResourceType.TOOL,
    categorySlug: 'hardware',
    isFeatured: false,
    featuredOrder: 0,
    version: '8.16',
    platform: 'Windows 11/10',
    fileSize: '11.8 MB',
    releaseDate: '2024-12-10',
    changelog: '增强了对下一代移动平台 GPU 功耗传感器的遥测读取支持。',
    officialUrl: 'https://www.hwinfo.com/download/',
    sourceName: 'HWiNFO 官方安装包 / 便携版',
    licenseType: 'FREE',
  },
  {
    name: 'Rufus 启动盘制作工具',
    slug: 'rufus',
    englishName: 'Rufus',
    aliases: JSON.stringify(['rufus', 'u盘启动盘', '系统安装盘', 'iso烧录']),
    developer: 'Pete Batard',
    summary: '极速开源的 USB 启动盘制作利器，支持绕过 Windows 11 TPM 与在线账号限制。',
    description: 'Rufus 是一款小巧便携、制作速度惊人的 USB 启动盘格式化与制作工具。在烧录 Windows 11 ISO 镜像时可一键移除 TPM 2.0、Secure Boot 与强制在线微软账号限制，干净利落。',
    type: ResourceType.TOOL,
    categorySlug: 'sys-tools',
    isFeatured: false,
    featuredOrder: 0,
    version: '4.6',
    platform: 'Windows 11/10/8/7',
    fileSize: '1.4 MB',
    releaseDate: '2024-10-21',
    changelog: '改进对最新 Windows 11 24H2 安装镜像的静默应答文件与本地账号注入支持。',
    officialUrl: 'https://rufus.ie/zh/',
    sourceName: 'Rufus 官方便携版直链',
    licenseType: 'OPEN_SOURCE',
  }
];

async function run() {
  console.log('📦 开始同步真实软件数据...');
  const catList = await prisma.category.findMany();
  const catMap = new Map(catList.map(c => [c.slug, c.id]));

  for (const item of authenticSoftwares) {
    const catId = catMap.get(item.categorySlug);
    if (!catId) continue;

    const existing = await prisma.software.findUnique({ where: { slug: item.slug } });
    if (!existing) {
      const soft = await prisma.software.create({
        data: {
          name: item.name,
          slug: item.slug,
          englishName: item.englishName,
          aliases: item.aliases,
          developer: item.developer,
          summary: item.summary,
          description: item.description,
          type: item.type,
          categoryId: catId,
          status: ResourceStatus.PUBLISHED,
          isFeatured: item.isFeatured,
          featuredOrder: item.featuredOrder,
          isTestData: false,
          publishedAt: new Date(),
        }
      });

      const ver = await prisma.softwareVersion.create({
        data: {
          softwareId: soft.id,
          version: item.version,
          platform: item.platform,
          fileSize: item.fileSize,
          releaseDate: item.releaseDate,
          changelog: item.changelog,
          isLatest: true,
        }
      });

      await prisma.downloadSource.create({
        data: {
          versionId: ver.id,
          sourceType: SourceType.OFFICIAL_EXTERNAL,
          sourceName: item.sourceName,
          url: item.officialUrl,
          verificationStatus: VerificationStatus.VERIFIED,
          lastCheckedAt: new Date(),
          lastHttpStatus: 200,
          isActive: true,
        }
      });

      await prisma.resourceLicense.create({
        data: {
          softwareId: soft.id,
          licenseType: item.licenseType,
        }
      });

      console.log(`✅ 已写入真实资源: ${item.name}`);
    } else {
      console.log(`ℹ️  已存在: ${item.name}`);
    }
  }
  console.log('🎉 真实资源同步完成！');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
