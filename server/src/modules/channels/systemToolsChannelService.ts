import { ResourceStatus, ResourceType, TopicStatus, ComparisonStatus } from '@prisma/client';
import { prisma } from '../../db';
import {
  CompactSoftwareDto,
  HeroSlideDto,
  INTERNAL_POLICY_TUTORIAL_SLUGS,
  SLIDE_THEMES,
  conciseHeroText,
  isWithinSchedule,
  pickChannelSoftwares,
  toCompactSoftware,
} from './softwareChannelService';

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SystemToolItemDto extends CompactSoftwareDto {
  domainSlug: string;
  domainName: string;
  riskLevel: RiskLevel;
  requireBackup: boolean;
  requireAdmin: boolean;
  riskNotice: string | null;
  verifiedSha256Count: number;
}

export interface ToolScenarioDto {
  id: string;
  title: string;
  shortLabel: string;
  summary: string;
  badge: string;
  accentTone: 'amber' | 'rose' | 'blue' | 'indigo' | 'emerald' | 'slate';
  safetyWarning: string;
  steps: string[];
  recommendedDomainSlug: string;
  tools: SystemToolItemDto[];
  tutorials: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    publishedAt: string;
    requireBackup: boolean;
  }>;
  relatedTopic: {
    slug: string;
    title: string;
    resourceCount: number;
  } | null;
}

interface ToolEngineeringMeta {
  domainSlug: string;
  riskLevel: RiskLevel;
  requireBackup: boolean;
  requireAdmin: boolean;
  riskNotice: string | null;
}

const DOMAIN_DEFS: Array<{
  slug: string;
  name: string;
  description: string;
  filterCategorySlug: string;
  safetyNote: string;
}> = [
  {
    slug: 'file-archive',
    name: '文件检索与解压管理',
    description: '毫秒级 NTFS 全盘文件检索、高压缩比归档与分卷加密校验工具',
    filterCategorySlug: 'sys-tools',
    safetyNote: '处理受信任来源压缩包，加密归档建议妥善保存密码。',
  },
  {
    slug: 'disk-recovery',
    name: '磁盘分区与数据恢复',
    description: '硬盘分区调整、坏道检测、引导修复及误删扇区级扫描拯救工具',
    filterCategorySlug: 'sys-tools',
    safetyNote: '高危数据操作：分区调整或数据恢复前务必完整备份，严禁向故障盘写入新数据！',
  },
  {
    slug: 'hardware-check',
    name: '硬件体检与温度监测',
    description: 'CPU/主板/内存参数识别与实时电压、功耗、温度传感器监测',
    filterCategorySlug: 'hardware',
    safetyNote: '高负载烤机测试请留意供电与散热状态，笔记本建议插电运行。',
  },
  {
    slug: 'network-diag',
    name: '网络诊断与传输排查',
    description: '网络数据包抓取分析、连接追踪及多线程断点传输校验实用工具',
    filterCategorySlug: 'network',
    safetyNote: '抓包通常需以管理员身份并配合 Npcap 驱动使用，仅限授权排障场景。',
  },
  {
    slug: 'sys-maintenance',
    name: '卸载清理与环境维护',
    description: '残留注册表与启动项深度卸载清理、命令行版本控制维护辅助',
    filterCategorySlug: 'sys-tools',
    safetyNote: '强制卸载注册表或启动项清理前建议确认软件路径，避免误删共享运行库。',
  },
  {
    slug: 'boot-deploy',
    name: '启动盘制作与原版指引',
    description: 'UEFI/GPT 启动 U 盘烧录工具与微软官方系统安装通道及 SHA-256 校验参考',
    filterCategorySlug: 'sys-tools',
    safetyNote: '写入 U 盘将清空目标盘全部数据；微软原版系统属于商业授权软件，需自备正版许可。',
  },
];

const TOOL_PROFILES: Record<string, ToolEngineeringMeta> = {
  diskgenius: {
    domainSlug: 'disk-recovery',
    riskLevel: 'HIGH',
    requireBackup: true,
    requireAdmin: true,
    riskNotice: '高风险工具：分区调整、坏道屏蔽与恢复写入前必须备份重要数据，且数据恢复期间勿向待恢复盘写入任何文件。',
  },
  rufus: {
    domainSlug: 'boot-deploy',
    riskLevel: 'HIGH',
    requireBackup: true,
    requireAdmin: true,
    riskNotice: '高风险操作：制作启动 U 盘将完全格式化目标 USB 设备，写入前请仔细核对盘符并清空迁移 U 盘内重要资料。',
  },
  'geek-uninstaller': {
    domainSlug: 'sys-maintenance',
    riskLevel: 'MEDIUM',
    requireBackup: false,
    requireAdmin: true,
    riskNotice: '涉及强制删除安装目录与注册表残留，执行强力扫描清除前请核对删除路径清单。',
  },
  wireshark: {
    domainSlug: 'network-diag',
    riskLevel: 'MEDIUM',
    requireBackup: false,
    requireAdmin: true,
    riskNotice: '抓包捕获网卡流量需安装 Npcap 并按管理员权限运行，排查完毕建议及时停止抓包释放内存。',
  },
  'windows-11': {
    domainSlug: 'boot-deploy',
    riskLevel: 'MEDIUM',
    requireBackup: true,
    requireAdmin: true,
    riskNotice: '系统重装/升级前务必备份桌面及C盘资料；Windows 11 为商业授权系统，获取介质不代表拥有许可。',
  },
  'windows-10': {
    domainSlug: 'boot-deploy',
    riskLevel: 'MEDIUM',
    requireBackup: true,
    requireAdmin: true,
    riskNotice: '系统部署前务必完成个人资料全量备份；Windows 10 为商业授权产品，需使用合法正版许可证。',
  },
  'windows-ltsc': {
    domainSlug: 'boot-deploy',
    riskLevel: 'MEDIUM',
    requireBackup: true,
    requireAdmin: true,
    riskNotice: '面向企业批量授权客户发行，暂不提供第三方托管镜像直链，请使用微软官方评估/VLSC 渠道。',
  },
  'windows-server': {
    domainSlug: 'boot-deploy',
    riskLevel: 'MEDIUM',
    requireBackup: true,
    requireAdmin: true,
    riskNotice: '服务器部署涉及商业授权及存储配置，操作前请完成备份与业务评估。',
  },
  'windows-7': {
    domainSlug: 'boot-deploy',
    riskLevel: 'MEDIUM',
    requireBackup: true,
    requireAdmin: false,
    riskNotice: '已停止微软官方安全更新支持，仅供历史归档校验参考，不建议用于日常联网生产主机。',
  },
  hwinfo: {
    domainSlug: 'hardware-check',
    riskLevel: 'LOW',
    requireBackup: false,
    requireAdmin: true,
    riskNotice: '读取底层主板总线传感器建议以管理员启动，遇到特定旧主板传感器兼容性报错可开启安全读取模式。',
  },
  'cpu-z': {
    domainSlug: 'hardware-check',
    riskLevel: 'LOW',
    requireBackup: false,
    requireAdmin: false,
    riskNotice: null,
  },
  everything: {
    domainSlug: 'file-archive',
    riskLevel: 'LOW',
    requireBackup: false,
    requireAdmin: true,
    riskNotice: null,
  },
  '7zip': {
    domainSlug: 'file-archive',
    riskLevel: 'LOW',
    requireBackup: false,
    requireAdmin: false,
    riskNotice: null,
  },
  'ab-download-manager': {
    domainSlug: 'network-diag',
    riskLevel: 'LOW',
    requireBackup: false,
    requireAdmin: false,
    riskNotice: null,
  },
  git: {
    domainSlug: 'sys-maintenance',
    riskLevel: 'LOW',
    requireBackup: false,
    requireAdmin: false,
    riskNotice: null,
  },
};

const SYSTEM_TOPIC_COVERS: Record<string, string> = {
  'win11-essential-tools': '/images/system-tools/hero-maintenance.svg',
  'disk-health-diagnosis': '/images/system-tools/hero-disk-health.svg',
  'lan-troubleshooting-tools': '/images/system-tools/hero-network-diag.svg',
  'windows-sysinternals-guide': '/images/system-tools/hero-sysinternals.svg',
  'software-clean-uninstallation': '/images/system-tools/hero-clean.svg',
  'genuine-microsoft-installation-media': '/images/system-tools/hero-boot-media.svg',
  'printer-driver-setup-guide': '/images/system-tools/hero-network-diag.svg',
};

const SYSTEM_TOPIC_ORDER = [
  'win11-essential-tools',
  'disk-health-diagnosis',
  'lan-troubleshooting-tools',
  'windows-sysinternals-guide',
  'software-clean-uninstallation',
  'genuine-microsoft-installation-media',
  'printer-driver-setup-guide',
];

const MAINTENANCE_TUTORIAL_SLUGS = new Set([
  'how-to-verify-genuine-iso-checksums',
  'crystaldiskinfo-smart-health-check',
  'sysinternals-autoruns-clean-startup',
  'bleachbit-windows-deep-clean-privacy',
  'ventoy-custom-multiboot-usb',
  'rufus-win11-bypass-tpm-guide',
  'geek-uninstaller-clean-remnants',
  'wireshark-http-tcp-handshake-capture',
  'everything-advanced-search-syntax',
  '7zip-ultra-compression-parameters',
  '7zip-aes256-encryption-tutorial',
  'clean-install-win11-guide',
]);

const HIGH_RISK_TUTORIAL_SLUGS = new Set([
  'rufus-win11-bypass-tpm-guide',
  'ventoy-custom-multiboot-usb',
  'clean-install-win11-guide',
  'crystaldiskinfo-smart-health-check',
  'geek-uninstaller-clean-remnants',
  'bleachbit-windows-deep-clean-privacy',
]);

const SCENARIO_BLUEPRINTS: Array<{
  id: string;
  title: string;
  shortLabel: string;
  summary: string;
  badge: string;
  accentTone: ToolScenarioDto['accentTone'];
  safetyWarning: string;
  steps: string[];
  recommendedDomainSlug: string;
  toolSlugs: string[];
  tutorialSlugs: string[];
  topicSlug?: string;
}> = [
  {
    id: 'slow_pc',
    title: '电脑运行缓慢 / 占用过高',
    shortLabel: '运行缓慢排查',
    summary: '排查后台异常进程与自启项，查找占满磁盘空间的巨大文件，安全卸载臃肿顽固软件。',
    badge: '性能诊断',
    accentTone: 'blue',
    safetyWarning: '禁止直接删除 C:\\Windows 或 ProgramData 下未知系统文件；强力清理启动项前请确认程序归属。',
    steps: ['任务管理器定位高 CPU/磁盘进程', '使用文件检索定位 C 盘大体积冗余文件', '检查并停用非必要开机自启、卸载残留软件'],
    recommendedDomainSlug: 'sys-maintenance',
    toolSlugs: ['everything', 'geek-uninstaller', 'hwinfo'],
    tutorialSlugs: ['sysinternals-autoruns-clean-startup', 'everything-advanced-search-syntax', 'bleachbit-windows-deep-clean-privacy'],
    topicSlug: 'win11-essential-tools',
  },
  {
    id: 'disk_health',
    title: '硬盘健康检测与数据恢复',
    shortLabel: '硬盘与数据救援',
    summary: '核查固态/机械硬盘 S.M.A.R.T. 关键指标、调整分区大小、扫描误删文件与异常扇区。',
    badge: '数据高危',
    accentTone: 'amber',
    safetyWarning: '重要警告：磁盘存在异响、掉盘或发生误删后，应立即停用下载缓存并严禁向故障磁盘写入任何新数据、切勿盲目格式化或运行修复写入！',
    steps: ['先断网/停止写入保护原始扇区现场', '用只读工具读取温度与 S.M.A.R.T. 健康告警', '分区备份或恢复文件时，务必将恢复结果输出至另一块独立物理硬盘'],
    recommendedDomainSlug: 'disk-recovery',
    toolSlugs: ['diskgenius', 'hwinfo'],
    tutorialSlugs: ['crystaldiskinfo-smart-health-check'],
    topicSlug: 'disk-health-diagnosis',
  },
  {
    id: 'network_diag',
    title: '网络连接异常 / DNS 排查',
    shortLabel: '网络故障排障',
    summary: '抓包追踪 TCP 三次握手与 DNS 解析异常、分析端口占用、提升大文件稳定下载体验。',
    badge: '网络排障',
    accentTone: 'indigo',
    safetyWarning: '网络抓包可能包含本机明文会话报文，切勿将含身份凭据的完整抓包文件外传公开。',
    steps: ['先确认本机 IP / DNS 配置与网关连通性', '使用抓包过滤 DNS / HTTP 异常响应码或丢包重传', '定位故障环节后针对性调整代理或网卡驱动'],
    recommendedDomainSlug: 'network-diag',
    toolSlugs: ['wireshark', 'ab-download-manager'],
    tutorialSlugs: ['wireshark-http-tcp-handshake-capture'],
    topicSlug: 'lan-troubleshooting-tools',
  },
  {
    id: 'bsod_hardware',
    title: '电脑蓝屏、死机与温度监测',
    shortLabel: '蓝屏与硬件体检',
    summary: '排查 CPU/GPU 过热降频、核对内存条频率与主控型号，定位硬件兼容及供电瓶颈。',
    badge: '硬件体检',
    accentTone: 'rose',
    safetyWarning: '遇到反复蓝屏请优先记录蓝屏代码或导出 Minidump 日志，再检查温度与内存稳定性，切忌盲目刷写主板 BIOS。',
    steps: ['空闲与高负载下实时监测 CPU/GPU/SSD 核心温度', '使用 CPU-Z 核验内存颗粒时序与通道匹配状态', '对照系统事件日志与近阶段更新的驱动逐一排查'],
    recommendedDomainSlug: 'hardware-check',
    toolSlugs: ['hwinfo', 'cpu-z'],
    tutorialSlugs: ['crystaldiskinfo-smart-health-check'],
    topicSlug: 'windows-sysinternals-guide',
  },
  {
    id: 'boot_install',
    title: '装机与原版启动盘制作',
    shortLabel: '启动盘与重装准备',
    summary: '制作纯净 UEFI/GPT 启动 U 盘，查询微软官方镜像下载途径并完成原厂 SHA-256 哈希比对。',
    badge: '装机部署',
    accentTone: 'emerald',
    safetyWarning: '启动盘写入过程将清除整个 U 盘内容；系统重装前务必备份所有用户资料与个人软件许可证密钥。',
    steps: ['预先备份原系统桌面、文档与浏览器数据', '前往微软官网获取原版镜像并执行 SHA-256 完整性核对', '使用 Rufus 等开源工具制作官方标准引导介质'],
    recommendedDomainSlug: 'boot-deploy',
    toolSlugs: ['rufus', 'windows-11', 'windows-10'],
    tutorialSlugs: ['rufus-win11-bypass-tpm-guide', 'how-to-verify-genuine-iso-checksums', 'clean-install-win11-guide'],
    topicSlug: 'genuine-microsoft-installation-media',
  },
  {
    id: 'uninstall_clean',
    title: '软件卸载与顽固残留清理',
    shortLabel: '深度卸载清理',
    summary: '解决常规卸载不彻底、残留后台服务、浏览器与安装目录冗余垃圾等问题。',
    badge: '系统清理',
    accentTone: 'slate',
    safetyWarning: '强力扫除注册表与关联文件夹时请逐条确认目录路径，防止误清理其他软件共用的运行环境。',
    steps: ['先用软件自带卸载程序完成标准退出与注销', '借助强力卸载器深度扫描剩余空文件夹与注册表键', '使用快速文件索引检索确认是否还有独立后台残留'],
    recommendedDomainSlug: 'sys-maintenance',
    toolSlugs: ['geek-uninstaller', 'everything', '7zip'],
    tutorialSlugs: ['geek-uninstaller-clean-remnants', 'bleachbit-windows-deep-clean-privacy'],
    topicSlug: 'software-clean-uninstallation',
  },
];

function enrichToolDto(base: CompactSoftwareDto, shaMap: Map<string, number>): SystemToolItemDto {
  const profile = TOOL_PROFILES[base.slug] || {
    domainSlug:
      base.categorySlug === 'hardware'
        ? 'hardware-check'
        : base.categorySlug === 'network'
          ? 'network-diag'
          : 'sys-maintenance',
    riskLevel: 'LOW' as RiskLevel,
    requireBackup: false,
    requireAdmin: false,
    riskNotice: null,
  };
  const domainDef = DOMAIN_DEFS.find((d) => d.slug === profile.domainSlug) || DOMAIN_DEFS[0];
  return {
    ...base,
    domainSlug: domainDef.slug,
    domainName: domainDef.name,
    riskLevel: profile.riskLevel,
    requireBackup: profile.requireBackup,
    requireAdmin: profile.requireAdmin,
    riskNotice: profile.riskNotice,
    verifiedSha256Count: shaMap.get(base.id) ?? 0,
  };
}

export class SystemToolsChannelService {
  static async getSystemToolsChannelData() {
    const now = new Date();

    const [
      toolsRaw,
      dlGroups,
      recommendationsRaw,
      topicsRaw,
      tutorialsRaw,
      comparisonsRaw,
      activeSourcesCount,
      approvedHealthySourcesCount,
      sha256SourcesCount,
      shaGroups,
    ] = await Promise.all([
      prisma.software.findMany({
        where: {
          status: ResourceStatus.PUBLISHED,
          isTestData: false,
          type: ResourceType.TOOL,
        },
        include: {
          category: true,
          versions: {
            orderBy: [{ isLatest: 'desc' }, { createdAt: 'desc' }],
            take: 1,
            include: {
              downloadSources: {
                where: { isActive: true },
                select: {
                  id: true,
                  verificationStatus: true,
                  reviewStatus: true,
                  lastCheckStatus: true,
                  sha256: true,
                },
              },
            },
          },
        },
        orderBy: [{ featuredOrder: 'asc' }, { viewCount: 'desc' }],
      }),
      prisma.downloadEvent.groupBy({
        by: ['softwareId'],
        where: { isTestEvent: false },
        _count: { softwareId: true },
      }),
      prisma.channelRecommendation.findMany({
        where: { channel: 'SYSTEM_TOOLS', isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.topic.findMany({
        where: {
          status: TopicStatus.PUBLISHED,
          NOT: { slug: { startsWith: 'topic-p3-' } },
        },
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { publishedAt: 'desc' }],
        include: {
          resources: {
            orderBy: { sortOrder: 'asc' },
            include: {
              software: {
                include: {
                  category: true,
                  versions: { where: { isLatest: true }, take: 1 },
                },
              },
            },
          },
        },
      }),
      prisma.tutorial.findMany({
        where: {
          status: 'PUBLISHED',
          NOT: { slug: { startsWith: 'tut-p3-' } },
        },
        orderBy: { publishedAt: 'desc' },
        include: {
          software: {
            select: {
              id: true,
              slug: true,
              name: true,
              iconUrl: true,
              type: true,
              status: true,
              isTestData: true,
              category: { select: { slug: true } },
            },
          },
        },
      }),
      prisma.softwareComparison.findMany({
        where: { status: ComparisonStatus.PUBLISHED },
        orderBy: { updatedAt: 'desc' },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              software: {
                select: { id: true, slug: true, name: true, status: true, isTestData: true, type: true, iconUrl: true },
              },
            },
          },
        },
      }),
      prisma.downloadSource.count({
        where: {
          isActive: true,
          version: {
            software: {
              status: ResourceStatus.PUBLISHED,
              isTestData: false,
              type: ResourceType.TOOL,
            },
          },
        },
      }),
      prisma.downloadSource.count({
        where: {
          isActive: true,
          verificationStatus: 'VERIFIED',
          reviewStatus: 'APPROVED',
          lastCheckStatus: 'HEALTHY',
          version: {
            software: {
              status: ResourceStatus.PUBLISHED,
              isTestData: false,
              type: ResourceType.TOOL,
            },
          },
        },
      }),
      prisma.downloadSource.count({
        where: {
          isActive: true,
          sha256: { not: null },
          version: {
            software: {
              status: ResourceStatus.PUBLISHED,
              isTestData: false,
              type: ResourceType.TOOL,
            },
          },
        },
      }),
      Promise.resolve([] as Array<{ softwareId: string; count: number }>),
    ]);

    void shaGroups;

    const dlCountMap = new Map<string, number>();
    const shaPerTool = new Map<string, number>();
    const toolIdsSet = new Set(toolsRaw.map((t) => t.id));
    let totalToolDownloadEvents = 0;

    for (const g of dlGroups) {
      dlCountMap.set(g.softwareId, g._count.softwareId);
      if (toolIdsSet.has(g.softwareId)) {
        totalToolDownloadEvents += g._count.softwareId;
      }
    }
    for (const rawTool of toolsRaw) {
      const latestVer = rawTool.versions?.[0];
      const shaCount = (latestVer?.downloadSources || []).filter((s) => Boolean(s.sha256)).length;
      shaPerTool.set(rawTool.id, shaCount);
    }

    const allTools: SystemToolItemDto[] = toolsRaw.map((sw) =>
      enrichToolDto(toCompactSoftware(sw, dlCountMap), shaPerTool)
    );
    const toolById = new Map(allTools.map((t) => [t.id, t]));
    const toolBySlug = new Map(allTools.map((t) => [t.slug, t]));

    const activeRecs = recommendationsRaw.filter((rec) => isWithinSchedule(rec, now));

    // 1. 合法系统维护相关专题 (至少包含 1 款已发布非测试工具，避免空专题与无关游戏专题)
    const maintenanceTopics = topicsRaw
      .map((t) => {
        const validResources = t.resources
          .map((r) => r.software)
          .filter(
            (s) =>
              s &&
              s.status === ResourceStatus.PUBLISHED &&
              !s.isTestData &&
              s.type !== ResourceType.GAME
          );
        const toolMatches = validResources.filter((s) => s.type === ResourceType.TOOL);
        return {
          id: t.id,
          slug: t.slug,
          title: t.title,
          description: t.description,
          coverUrl: SYSTEM_TOPIC_COVERS[t.slug] || '/images/system-tools/hero-maintenance.svg',
          isFeatured: t.isFeatured,
          publishedAt: (t.publishedAt || t.createdAt).toISOString(),
          resourceCount: validResources.length,
          toolMatchesCount: toolMatches.length,
          previewSoftwares: validResources.slice(0, 4).map((s) => ({
            slug: s.slug,
            name: s.name,
            iconUrl: s.iconUrl,
            categorySlug: s.category?.slug || 'sys-tools',
            latestVersion: s.versions?.[0]?.version || null,
          })),
        };
      })
      .filter((t) => t.slug !== 'open-source-games-collection' && t.toolMatchesCount >= 1)
      .sort((a, b) => {
        const ai = SYSTEM_TOPIC_ORDER.indexOf(a.slug);
        const bi = SYSTEM_TOPIC_ORDER.indexOf(b.slug);
        const aScore = ai === -1 ? 99 : ai;
        const bScore = bi === -1 ? 99 : bi;
        return aScore - bScore;
      });
    const topicById = new Map(maintenanceTopics.map((t) => [t.id, t]));
    const topicBySlug = new Map(maintenanceTopics.map((t) => [t.slug, t]));

    // 2. Hero 大图展位 (优先读取后台 SYSTEM_TOOLS/HERO 推荐，否则选取 3–4 个真实维护专题，少于 2 个自动呈现静态 Banner)
    const heroSlides: HeroSlideDto[] = [];
    const seenHeroKeys = new Set<string>();
    const heroRecs = activeRecs.filter((r) => r.slot === 'HERO');

    for (let i = 0; i < heroRecs.length && heroSlides.length < 4; i++) {
      const rec = heroRecs[i];
      if (rec.targetType === 'TOPIC' && topicById.has(rec.targetId)) {
        const topic = topicById.get(rec.targetId)!;
        const key = `TOPIC:${topic.id}`;
        if (seenHeroKeys.has(key)) continue;
        seenHeroKeys.add(key);
        heroSlides.push({
          id: rec.id,
          title: conciseHeroText(rec.title || topic.title, 30),
          subtitle: conciseHeroText(rec.subtitle || topic.description, 56),
          badge: rec.badgeText || '系统维护专题',
          targetUrl: `/topics/${topic.slug}`,
          targetType: 'TOPIC',
          coverImage: rec.coverImage || topic.coverUrl,
          theme: SLIDE_THEMES[heroSlides.length % 3],
          statsText: `含 ${topic.resourceCount} 款相关资源`,
          previewSoftwares: topic.previewSoftwares,
        });
      } else if (rec.targetType === 'SOFTWARE' && toolById.has(rec.targetId)) {
        const tool = toolById.get(rec.targetId)!;
        const key = `SOFTWARE:${tool.id}`;
        if (seenHeroKeys.has(key)) continue;
        seenHeroKeys.add(key);
        heroSlides.push({
          id: rec.id,
          title: conciseHeroText(rec.title || tool.name, 30),
          subtitle: conciseHeroText(rec.subtitle || tool.summary, 56),
          badge: rec.badgeText || '核心维护工具',
          targetUrl: `/software/${tool.slug}`,
          targetType: 'SOFTWARE',
          coverImage: rec.coverImage || SYSTEM_TOPIC_COVERS['win11-essential-tools'],
          theme: SLIDE_THEMES[heroSlides.length % 3],
          statsText: tool.hasVerifiedSource ? '含已审核健康直连来源' : '已登记官方渠道',
          previewSoftwares: [
            {
              slug: tool.slug,
              name: tool.name,
              iconUrl: tool.iconUrl,
              categorySlug: tool.categorySlug,
              latestVersion: tool.latestVersion,
            },
          ],
        });
      }
    }

    for (const topic of maintenanceTopics) {
      if (heroSlides.length >= 4) break;
      const key = `TOPIC:${topic.id}`;
      if (seenHeroKeys.has(key)) continue;
      seenHeroKeys.add(key);
      heroSlides.push({
        id: `sys-hero-${topic.slug}`,
        title: conciseHeroText(topic.title, 30),
        subtitle: conciseHeroText(topic.description, 56),
        badge: topic.isFeatured ? '维护专题精粹' : '实操专题合集',
        targetUrl: `/topics/${topic.slug}`,
        targetType: 'TOPIC',
        coverImage: topic.coverUrl,
        theme: SLIDE_THEMES[heroSlides.length % 3],
        statsText: `包含 ${topic.resourceCount} 款关联资源`,
        previewSoftwares: topic.previewSoftwares,
      });
    }

    // 3. 右侧「维修常用工具」 (2x4 = 8 款实操实用工具，优先后台 WEEKLY_PICK，其次精选非 Windows 镜像的核心排障工具)
    const utilityOrderSlugs = [
      'everything',
      'diskgenius',
      'hwinfo',
      'cpu-z',
      'wireshark',
      'rufus',
      'geek-uninstaller',
      '7zip',
      'git',
      'ab-download-manager',
    ];
    const commonPoolRaw = [
      ...utilityOrderSlugs.map((slug) => toolBySlug.get(slug)).filter((x): x is SystemToolItemDto => Boolean(x)),
      ...allTools.filter((t) => !utilityOrderSlugs.includes(t.slug)),
    ];
    const commonToolsPicked = pickChannelSoftwares({
      recs: activeRecs.filter((r) => r.slot === 'WEEKLY_PICK' && r.targetType === 'SOFTWARE'),
      pool: commonPoolRaw,
      swMap: toolById,
      limit: 8,
      maxPerFamily: 1,
    });
    const commonTools: SystemToolItemDto[] = commonToolsPicked.map((item) =>
      toolById.get(item.id)
        ? { ...toolById.get(item.id)!, badgeText: item.badgeText, editorialNote: item.editorialNote }
        : enrichToolDto(item, shaPerTool)
    );

    // 4. 编辑精选工具 (6 款技术价值突出的工具，优先未在「维修常用工具」重复出现的工具，且严限同系列数量)
    const commonIds = new Set(commonTools.map((t) => t.id));
    const editorPoolRaw: SystemToolItemDto[] = [
      ...allTools.filter((t) => !commonIds.has(t.id) && !t.slug.startsWith('windows-')),
      ...allTools.filter((t) => !commonIds.has(t.id) && t.slug === 'windows-11'),
      ...allTools.filter((t) => commonIds.has(t.id) && t.hasVerifiedSource),
      ...allTools.filter((t) => commonIds.has(t.id) && !t.hasVerifiedSource),
    ];
    const editorPickedBase = pickChannelSoftwares({
      recs: activeRecs.filter((r) => r.slot === 'EDITOR_PICK' && r.targetType === 'SOFTWARE'),
      pool: editorPoolRaw,
      swMap: toolById,
      limit: 6,
      maxPerFamily: 1,
    });
    const editorPicks: SystemToolItemDto[] = editorPickedBase.map((item) =>
      toolById.get(item.id)
        ? { ...toolById.get(item.id)!, badgeText: item.badgeText, editorialNote: item.editorialNote }
        : enrichToolDto(item, shaPerTool)
    );

    // 5. 维护教程过滤 (排除 P3 测试教程与内部合规说明书，仅留系统/硬件/网络/装机实操)
    const maintenanceTutorials = tutorialsRaw
      .filter((t) => {
        if (INTERNAL_POLICY_TUTORIAL_SLUGS.has(t.slug)) return false;
        if (t.software && (t.software.status !== ResourceStatus.PUBLISHED || t.software.isTestData || t.software.type === ResourceType.GAME)) {
          return false;
        }
        return (
          MAINTENANCE_TUTORIAL_SLUGS.has(t.slug) ||
          t.software?.type === ResourceType.TOOL ||
          ['sys-tools', 'hardware', 'network', 'security', 'drivers'].includes(t.software?.category?.slug || '')
        );
      })
      .map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        summary: t.summary,
        viewCount: t.viewCount,
        publishedAt: (t.publishedAt || t.createdAt).toISOString(),
        requireBackup: HIGH_RISK_TUTORIAL_SLUGS.has(t.slug),
        requireAdmin: HIGH_RISK_TUTORIAL_SLUGS.has(t.slug) || t.slug.includes('wireshark') || t.slug.includes('autoruns'),
        software: t.software
          ? { slug: t.software.slug, name: t.software.name, iconUrl: t.software.iconUrl }
          : null,
      }));
    const tutorialBySlug = new Map(maintenanceTutorials.map((t) => [t.slug, t]));

    // 6. 6 大电脑故障场景导航 (严格绑定真实已发布工具、教程、专题；工具数为空则自动过滤)
    const scenarios: ToolScenarioDto[] = SCENARIO_BLUEPRINTS.map((bp) => {
      const matchedTools = bp.toolSlugs
        .map((slug) => toolBySlug.get(slug))
        .filter((x): x is SystemToolItemDto => Boolean(x));
      const matchedTuts = bp.tutorialSlugs
        .map((slug) => tutorialBySlug.get(slug))
        .filter((x): x is (typeof maintenanceTutorials)[number] => Boolean(x))
        .map((t) => ({
          id: t.id,
          slug: t.slug,
          title: t.title,
          summary: t.summary,
          publishedAt: t.publishedAt,
          requireBackup: t.requireBackup,
        }));
      const topicObj = bp.topicSlug ? topicBySlug.get(bp.topicSlug) : null;
      return {
        id: bp.id,
        title: bp.title,
        shortLabel: bp.shortLabel,
        summary: bp.summary,
        badge: bp.badge,
        accentTone: bp.accentTone,
        safetyWarning: bp.safetyWarning,
        steps: bp.steps,
        recommendedDomainSlug: bp.recommendedDomainSlug,
        tools: matchedTools,
        tutorials: matchedTuts,
        relatedTopic: topicObj
          ? { slug: topicObj.slug, title: topicObj.title, resourceCount: topicObj.resourceCount }
          : null,
      };
    }).filter((sc) => sc.tools.length > 0);

    // 7. 专业工具分类分区 (每个工具只归属 1 个核心专业分类，避免在各区重复摆同一批软件)
    const domainBlocks = DOMAIN_DEFS.map((def) => {
      const domainTools = allTools
        .filter((t) => t.domainSlug === def.slug)
        .sort((a, b) => Number(b.hasVerifiedSource) - Number(a.hasVerifiedSource) || b.viewCount - a.viewCount);
      const relatedTopic =
        def.slug === 'disk-recovery'
          ? topicBySlug.get('disk-health-diagnosis') || null
          : def.slug === 'network-diag'
            ? topicBySlug.get('lan-troubleshooting-tools') || null
            : def.slug === 'sys-maintenance'
              ? topicBySlug.get('software-clean-uninstallation') || null
              : def.slug === 'boot-deploy'
                ? topicBySlug.get('genuine-microsoft-installation-media') || null
                : topicBySlug.get('win11-essential-tools') || null;
      return {
        slug: def.slug,
        name: def.name,
        description: def.description,
        filterCategorySlug: def.filterCategorySlug,
        safetyNote: def.safetyNote,
        totalCount: domainTools.length,
        tools: domainTools.slice(0, 6),
        relatedTopic: relatedTopic ? { slug: relatedTopic.slug, title: relatedTopic.title } : null,
      };
    }).filter((b) => b.totalCount > 0);

    // 8. 真实榜单 (严格剔除 0 计数项，决不伪造流量或强制凑满 TOP 10)
    const mostViewed = [...allTools]
      .filter((t) => t.viewCount > 0)
      .sort((a, b) => b.viewCount - a.viewCount || b.downloadCount - a.downloadCount)
      .slice(0, 10);

    const mostDownloaded = [...allTools]
      .filter((t) => t.downloadCount > 0)
      .sort((a, b) => b.downloadCount - a.downloadCount || b.viewCount - a.viewCount)
      .slice(0, 10);

    // 9. 维修专题精选 (优先运营配置 TOPIC_PICK，展示真实已发布专题)
    const topicPickIds = activeRecs
      .filter((r) => r.slot === 'TOPIC_PICK' && r.targetType === 'TOPIC')
      .map((r) => r.targetId);
    const hotTopics = [
      ...topicPickIds.map((id) => topicById.get(id)!).filter(Boolean),
      ...maintenanceTopics.filter((t) => !topicPickIds.includes(t.id)),
    ].slice(0, 6);

    // 10. 对比评测 (仅展示含系统工具的有效发布评测)
    const validComparisons = comparisonsRaw
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        summary: c.summary,
        updatedAt: c.updatedAt.toISOString(),
        softwares: c.items
          .filter((it) => it.software.status === ResourceStatus.PUBLISHED && !it.software.isTestData)
          .map((it) => ({
            slug: it.software.slug,
            name: it.software.name,
            iconUrl: it.software.iconUrl,
            type: it.software.type,
          })),
      }))
      .filter((c) => c.softwares.some((s) => s.type === ResourceType.TOOL))
      .slice(0, 4);

    // 11. 最近更新 (严格区分：原厂发布日 releaseDate vs 平台首次上架日 catalogedAt)
    const versionUpdates = [...allTools]
      .filter((t) => Boolean(t.latestVersion && t.releaseDate))
      .sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''))
      .slice(0, 8);

    const newlyCataloged = [...allTools]
      .sort((a, b) => new Date(b.catalogedAt).getTime() - new Date(a.catalogedAt).getTime())
      .slice(0, 8);

    const utilityToolsCount = allTools.filter((t) => !t.slug.startsWith('windows-')).length;
    const highRiskToolsCount = allTools.filter((t) => t.riskLevel === 'HIGH').length;

    return {
      meta: {
        channel: 'SYSTEM_TOOLS',
        totalToolsCount: allTools.length,
        utilityToolsCount,
        highRiskToolsCount,
        registeredSourcesCount: activeSourcesCount,
        approvedHealthySourcesCount,
        pendingSourcesCount: Math.max(0, activeSourcesCount - approvedHealthySourcesCount),
        sha256VerifiedCount: sha256SourcesCount,
        topicsCount: maintenanceTopics.length,
        tutorialsCount: maintenanceTutorials.length,
        totalDownloadEvents: totalToolDownloadEvents,
        viewStatsLabel: '详情页浏览热度（非下载次数）',
        downloadStatsLabel: '站内非测试下载触发事件（非完成传输量）',
      },
      heroSlides,
      commonTools,
      scenarios,
      domainBlocks,
      editorPicks,
      leaderboards: {
        mostViewed,
        mostDownloaded,
      },
      hotTopics,
      tutorials: maintenanceTutorials.slice(0, 8),
      comparisons: validComparisons,
      latestUpdates: {
        versionUpdates,
        newlyCataloged,
      },
    };
  }
}
