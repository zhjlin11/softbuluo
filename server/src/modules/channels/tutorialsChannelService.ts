import { prisma } from '../../db';
import { ResourceStatus } from '@prisma/client';

export type TutorialDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type TutorialRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TutorialCategoryMeta {
  id: string;
  name: string;
  description: string;
  count: number;
}

export interface EnrichedTutorialDto {
  id: string;
  title: string;
  slug: string;
  summary: string;
  coverUrl: string | null;
  status: string;
  viewCount: number;
  publishedAt: string | null;
  updatedAt: string;
  category: string;
  categoryName: string;
  difficulty: TutorialDifficulty;
  difficultyLabel: string;
  platform: string;
  riskLevel: TutorialRiskLevel;
  tags: string[];
  readingMinutes: number;
  isHighRisk: boolean;
  preflightChecklist: string[];
  software: {
    id: string;
    name: string;
    slug: string;
    iconUrl: string | null;
    developer: string | null;
    category?: string | null;
    currentVersion?: string | null;
  } | null;
}

export interface QuickTroubleshootEntry {
  id: string;
  problem: string;
  description: string;
  slug: string;
  category: string;
  badge: string;
}

export interface TutorialHeading {
  id: string;
  level: 2 | 3;
  text: string;
}

// 真实 27 篇已发布教程的技术元数据映射字典
const TUTORIAL_METADATA_MAP: Record<
  string,
  {
    category: string;
    categoryName: string;
    difficulty: TutorialDifficulty;
    difficultyLabel: string;
    platform: string;
    riskLevel: TutorialRiskLevel;
    tags: string[];
    readingMinutes: number;
    preflightChecklist: string[];
  }
> = {
  'clean-install-win11-guide': {
    category: 'windows',
    categoryName: 'Windows 系统',
    difficulty: 'BEGINNER',
    difficultyLabel: '入门友好',
    platform: 'Windows 11',
    riskLevel: 'MEDIUM',
    tags: ['系统安装', 'Win11', '原版镜像', '纯净装机'],
    readingMinutes: 6,
    preflightChecklist: ['已备份 C 盘及桌面全部重要数据', '已准备 8GB 以上空白 U 盘', '电脑已连接电源且网络畅通'],
  },
  '7zip-aes256-encryption-tutorial': {
    category: 'office',
    categoryName: '办公与效率',
    difficulty: 'BEGINNER',
    difficultyLabel: '入门友好',
    platform: 'Windows 通用',
    riskLevel: 'LOW',
    tags: ['7-Zip', 'AES-256', '文件加密', '密码保护'],
    readingMinutes: 5,
    preflightChecklist: ['已安装 7-Zip 压缩软件', '确认要加密的原文件处于可读状态'],
  },
  'rufus-win11-bypass-tpm-guide': {
    category: 'windows',
    categoryName: 'Windows 系统',
    difficulty: 'INTERMEDIATE',
    difficultyLabel: '进阶实操',
    platform: 'Windows 11 / 10',
    riskLevel: 'HIGH',
    tags: ['Rufus', '启动盘', 'TPM2.0', 'Win11安装'],
    readingMinutes: 8,
    preflightChecklist: ['重要警告：写入将格式化清空 U 盘所有数据，务必先备份！', '已下载微软官方原版 Windows 11 ISO 镜像', '确认主板支持 UEFI 启动模式'],
  },
  'everything-advanced-search-syntax': {
    category: 'office',
    categoryName: '办公与效率',
    difficulty: 'BEGINNER',
    difficultyLabel: '入门友好',
    platform: 'Windows 11 / 10',
    riskLevel: 'LOW',
    tags: ['Everything', '文件搜索', '正则表达式', '办公效率'],
    readingMinutes: 6,
    preflightChecklist: ['已安装 Everything 并保持后台运行以保证实时索引构建'],
  },
  'crystaldiskinfo-smart-health-check': {
    category: 'troubleshoot',
    categoryName: '电脑维修与排障',
    difficulty: 'INTERMEDIATE',
    difficultyLabel: '进阶实操',
    platform: 'Windows 通用',
    riskLevel: 'LOW',
    tags: ['硬盘检测', 'SMART', 'SSD寿命', '健康度'],
    readingMinutes: 7,
    preflightChecklist: ['以管理员身份运行以获取底层磁盘控制器完整 S.M.A.R.T. 寄存器参数'],
  },
  'wireshark-http-tcp-handshake-capture': {
    category: 'network',
    categoryName: '网络技术',
    difficulty: 'ADVANCED',
    difficultyLabel: '专业技术',
    platform: '跨平台 (Win/Mac/Linux)',
    riskLevel: 'LOW',
    tags: ['Wireshark', '网络抓包', 'TCP握手', '网络排障'],
    readingMinutes: 10,
    preflightChecklist: ['以管理员身份运行并安装 Npcap 捕获驱动', '选择当前承载网络流量的正确物理/无线网卡'],
  },
  'sysinternals-autoruns-clean-startup': {
    category: 'troubleshoot',
    categoryName: '电脑维修与排障',
    difficulty: 'INTERMEDIATE',
    difficultyLabel: '进阶实操',
    platform: 'Windows 11 / 10',
    riskLevel: 'HIGH',
    tags: ['自启治理', '流氓软件', '开机加速', 'Sysinternals'],
    readingMinutes: 8,
    preflightChecklist: ['以管理员权限启动 Autoruns', '在 Options 菜单中勾选 Hide Microsoft Entries 过滤核心系统服务', '建议操作前创建系统还原点以防误禁用'],
  },
  'geek-uninstaller-clean-remnants': {
    category: 'troubleshoot',
    categoryName: '电脑维修与排障',
    difficulty: 'BEGINNER',
    difficultyLabel: '入门友好',
    platform: 'Windows 11 / 10',
    riskLevel: 'MEDIUM',
    tags: ['Geek Uninstaller', '强力卸载', '注册表清理', '无残留'],
    readingMinutes: 5,
    preflightChecklist: ['目标软件已退出常驻托盘与后台进程'],
  },
  'obs-studio-game-recording-settings': {
    category: 'dev',
    categoryName: '开发与创作',
    difficulty: 'INTERMEDIATE',
    difficultyLabel: '进阶实操',
    platform: 'Windows 11 / 10',
    riskLevel: 'LOW',
    tags: ['OBS Studio', '游戏录屏', '硬件编码', '60FPS'],
    readingMinutes: 8,
    preflightChecklist: ['显卡驱动已更新至官方稳定版', '具备独立的麦克风与桌面音频采集设备'],
  },
  'rustdesk-self-hosted-relay-guide': {
    category: 'network',
    categoryName: '网络技术',
    difficulty: 'ADVANCED',
    difficultyLabel: '专业技术',
    platform: 'Linux 服务器 + Windows 客户端',
    riskLevel: 'MEDIUM',
    tags: ['RustDesk', '远程桌面', '自建中继', '私有部署'],
    readingMinutes: 12,
    preflightChecklist: ['拥有一台具备固定公网 IP 的云服务器', '已在云安全组中放通 21115-21119 (TCP/UDP) 端口', '掌握基本的 SSH 与 Docker 命令'],
  },
  'git-ssh-key-github-windows-config': {
    category: 'dev',
    categoryName: '开发与创作',
    difficulty: 'ADVANCED',
    difficultyLabel: '专业技术',
    platform: 'Windows 11 / 10',
    riskLevel: 'LOW',
    tags: ['Git', 'SSH密钥', 'GitHub', '免密连接'],
    readingMinutes: 7,
    preflightChecklist: ['已安装 Git for Windows', '拥有正常可登录的 GitHub / GitLab 账户'],
  },
  '7zip-ultra-compression-parameters': {
    category: 'office',
    categoryName: '办公与效率',
    difficulty: 'INTERMEDIATE',
    difficultyLabel: '进阶实操',
    platform: 'Windows / 通用',
    riskLevel: 'LOW',
    tags: ['7-Zip', '极限压缩', 'LZMA2', '多核心优化'],
    readingMinutes: 6,
    preflightChecklist: ['建议机器具备至少 4GB 空闲内存以供 128MB 以上字典分配'],
  },
  'putty-winscp-ssh-keys-workflow': {
    category: 'network',
    categoryName: '网络技术',
    difficulty: 'ADVANCED',
    difficultyLabel: '专业技术',
    platform: 'Windows / Linux',
    riskLevel: 'LOW',
    tags: ['PuTTY', 'WinSCP', 'SSH终端', '极速文件传输'],
    readingMinutes: 6,
    preflightChecklist: ['已获取远程 Linux 服务器 IP 与初始端口', '已在本地安装 PuTTY 及 WinSCP'],
  },
  'libreoffice-ms-office-compatibility': {
    category: 'office',
    categoryName: '办公与效率',
    difficulty: 'BEGINNER',
    difficultyLabel: '入门友好',
    platform: '跨平台 (Win/Mac/Linux)',
    riskLevel: 'LOW',
    tags: ['LibreOffice', 'Office兼容', '开源办公', '排版字体'],
    readingMinutes: 5,
    preflightChecklist: ['已安装最新 LibreOffice 稳定版', '建议在系统中安装常用微软核心中文字体'],
  },
  'obsidian-second-brain-knowledge-workflow': {
    category: 'dev',
    categoryName: '开发与创作',
    difficulty: 'INTERMEDIATE',
    difficultyLabel: '进阶实操',
    platform: '跨平台 (Win/Mac/Linux)',
    riskLevel: 'LOW',
    tags: ['Obsidian', '双链笔记', '第二大脑', '本地Markdown'],
    readingMinutes: 8,
    preflightChecklist: ['选择一个稳定的本地文件夹作为知识库 (Vault) 存储路径'],
  },
  'screentogif-tutorial-frame-editing': {
    category: 'office',
    categoryName: '办公与效率',
    difficulty: 'BEGINNER',
    difficultyLabel: '入门友好',
    platform: 'Windows 11 / 10',
    riskLevel: 'LOW',
    tags: ['ScreenToGif', '动图制作', '逐帧编辑', '录屏教学'],
    readingMinutes: 5,
    preflightChecklist: ['已下载 ScreenToGif 单文件便携版或安装版'],
  },
  'handbrake-video-compression-av1-hevc': {
    category: 'office',
    categoryName: '办公与效率',
    difficulty: 'INTERMEDIATE',
    difficultyLabel: '进阶实操',
    platform: '跨平台 (Win/Mac/Linux)',
    riskLevel: 'LOW',
    tags: ['HandBrake', '视频压制', 'AV1', 'HEVC瘦身'],
    readingMinutes: 7,
    preflightChecklist: ['确认待压缩源视频无损坏', '电脑散热环境良好（转码期间 CPU/GPU 占用较高）'],
  },
  'bleachbit-windows-deep-clean-privacy': {
    category: 'troubleshoot',
    categoryName: '电脑维修与排障',
    difficulty: 'INTERMEDIATE',
    difficultyLabel: '进阶实操',
    platform: 'Windows / Linux',
    riskLevel: 'MEDIUM',
    tags: ['BleachBit', '深度清理', '隐私擦除', '痕迹清除'],
    readingMinutes: 6,
    preflightChecklist: ['清理前请保存所有正在编辑的工作并关闭所有正在运行的浏览器'],
  },
  'ventoy-custom-multiboot-usb': {
    category: 'windows',
    categoryName: 'Windows 系统',
    difficulty: 'ADVANCED',
    difficultyLabel: '专业技术',
    platform: 'Windows / Linux',
    riskLevel: 'HIGH',
    tags: ['Ventoy', '多系统启动', 'U盘制作', 'PE维护'],
    readingMinutes: 9,
    preflightChecklist: ['首次向 U 盘写入 Ventoy 会完全格式化 U 盘，必须提前备份已有文件！', '准备容量至少 16GB 的 USB 3.0 以上高速 U 盘'],
  },
  'dbeaver-sql-database-management-workflow': {
    category: 'dev',
    categoryName: '开发与创作',
    difficulty: 'ADVANCED',
    difficultyLabel: '专业技术',
    platform: '跨平台',
    riskLevel: 'LOW',
    tags: ['DBeaver', 'SQL数据库', '可视化ER图', 'PostgreSQL'],
    readingMinutes: 8,
    preflightChecklist: ['具备测试数据库的 Host、端口、数据库名及账号密码'],
  },
  'openra-red-alert-multiplayer-setup': {
    category: 'games',
    categoryName: '游戏运行与重制',
    difficulty: 'INTERMEDIATE',
    difficultyLabel: '进阶实操',
    platform: '跨平台 (Win/Mac/Linux)',
    riskLevel: 'LOW',
    tags: ['OpenRA', '红色警戒', '局域网联机', '4K宽屏适配'],
    readingMinutes: 6,
    preflightChecklist: ['已安装 OpenRA 游戏引擎', '联机双方电脑已接入同一局域网并放通防火墙提示'],
  },
  'sumatrapdf-ebook-mobi-epub-reading': {
    category: 'office',
    categoryName: '办公与效率',
    difficulty: 'BEGINNER',
    difficultyLabel: '入门友好',
    platform: 'Windows 11 / 10',
    riskLevel: 'LOW',
    tags: ['SumatraPDF', '极速阅读', '全格式轻量', '护眼模式'],
    readingMinutes: 4,
    preflightChecklist: ['已下载 Sumatra PDF 绿色便携版'],
  },
  'developer-verification-guide': {
    category: 'policy',
    categoryName: '软游部落规范',
    difficulty: 'BEGINNER',
    difficultyLabel: '入门友好',
    platform: 'Web 通用',
    riskLevel: 'LOW',
    tags: ['开发者认证', '官方入驻', '软件发布', '开源规范'],
    readingMinutes: 5,
    preflightChecklist: ['拥有软件项目官方网站管理权限或开源托管仓库所有权'],
  },
  'software-claim-verification-tutorial': {
    category: 'policy',
    categoryName: '软游部落规范',
    difficulty: 'ADVANCED',
    difficultyLabel: '专业技术',
    platform: 'DNS / 网站根目录',
    riskLevel: 'LOW',
    tags: ['所有权认领', 'DNS TXT', '.well-known', '安全校验'],
    readingMinutes: 6,
    preflightChecklist: ['拥有域名的 DNS 解析控制台权限或网站根目录的写权限'],
  },
  'community-guidelines-and-feedback-rules': {
    category: 'policy',
    categoryName: '软游部落规范',
    difficulty: 'BEGINNER',
    difficultyLabel: '入门友好',
    platform: '通用',
    riskLevel: 'LOW',
    tags: ['社区准则', '问题反馈', '错误日志', '高质量提问'],
    readingMinutes: 4,
    preflightChecklist: ['准备好完整的错误报错截图与 Windows 详细系统版本号'],
  },
  'official-download-source-policy': {
    category: 'policy',
    categoryName: '软游部落规范',
    difficulty: 'BEGINNER',
    difficultyLabel: '入门友好',
    platform: '通用',
    riskLevel: 'LOW',
    tags: ['下载规范', '安全白皮书', '直链管理', 'SHA256核验'],
    readingMinutes: 5,
    preflightChecklist: ['阅读并理解软游部落正版原厂分发与哈希防篡改规范'],
  },
  'how-to-verify-genuine-iso-checksums': {
    category: 'windows',
    categoryName: 'Windows 系统',
    difficulty: 'INTERMEDIATE',
    difficultyLabel: '进阶实操',
    platform: 'Windows 11 / 10',
    riskLevel: 'LOW',
    tags: ['SHA256', 'ISO校验', 'Get-FileHash', '原版系统检验'],
    readingMinutes: 7,
    preflightChecklist: ['待验证的安装包或 ISO 镜像文件已完整下载至本地硬盘'],
  },
};

const CATEGORIES_DEF: Array<{ id: string; name: string; description: string }> = [
  { id: 'all', name: '全部实操教程', description: '汇聚系统安装、硬件维修、网络技术与办公生产力全面实操指南' },
  { id: 'windows', name: 'Windows 系统', description: 'Windows 11/10 纯净装机、启动 U 盘制作、原版镜像哈希核验' },
  { id: 'troubleshoot', name: '电脑维修与排障', description: '蓝屏诊断、SSD 寿命监测、开机自启动治理与强力卸载残留' },
  { id: 'network', name: '网络技术与排障', description: 'Wireshark 协议分析、自建 RustDesk 远控与 SSH 密钥连接' },
  { id: 'office', name: '办公与效率', description: 'Everything 秒搜、7-Zip 极限压缩、视频无损瘦身与轻量阅读' },
  { id: 'dev', name: '开发与创作', description: 'Obsidian 知识图谱、Git 免密配置、DBeaver 可视化与 OBS 录屏' },
  { id: 'games', name: '游戏运行与重制', description: '开源经典游戏引擎重制、4K 宽屏适配与局域网多人联机' },
  { id: 'policy', name: '平台规范与指南', description: '官方下载来源规范、开发者入驻、域名 TXT 认领与安全白皮书' },
];

export class TutorialsChannelService {
  /**
   * 获取教程频道首页门户聚合数据
   */
  static async getTutorialsChannelData(query: {
    category?: string;
    difficulty?: string;
    platform?: string;
    q?: string;
    sort?: string;
    page?: string | number;
    limit?: string | number;
  }) {
    const page = Math.max(1, typeof query.page === 'number' ? query.page : parseInt(query.page || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, typeof query.limit === 'number' ? query.limit : parseInt(query.limit || '12', 10) || 12));
    const activeCategory = (query.category || 'all').toLowerCase();
    const activeDifficulty = (query.difficulty || 'ALL').toUpperCase();
    const activePlatform = (query.platform || 'ALL').toUpperCase();
    const keyword = (query.q || '').trim().toLowerCase();
    const sort = (query.sort || 'latest').toLowerCase();

    // 1. 获取所有 PUBLISHED 教程，严格排除草稿
    const rawTutorials = await prisma.tutorial.findMany({
      where: {
        status: 'PUBLISHED',
      },
      orderBy: { publishedAt: 'desc' },
      include: {
        software: {
          select: {
            id: true,
            name: true,
            slug: true,
            iconUrl: true,
            developer: true,
            category: { select: { name: true } },
            isTestData: true,
            status: true,
            versions: {
              where: { isLatest: true },
              take: 1,
              select: { version: true },
            },
          },
        },
      },
    });

    // 2. 映射丰富字段，并进行数据隔离与元数据补全
    const enrichedTutorials: EnrichedTutorialDto[] = rawTutorials.map((tut) => {
      const meta = TUTORIAL_METADATA_MAP[tut.slug] || {
        category: 'windows',
        categoryName: '综合教程',
        difficulty: 'BEGINNER',
        difficultyLabel: '入门友好',
        platform: 'Windows 通用',
        riskLevel: 'LOW',
        tags: ['实用指南', '软件教程'],
        readingMinutes: 5,
        preflightChecklist: ['操作前建议确认当前操作系统环境正常'],
      };

      // 关联软件安全隔离校验：如软件处于测试数据或未发布，则不予在前台对外曝光
      let softwareDto = null;
      if (tut.software && !tut.software.isTestData && tut.software.status === ResourceStatus.PUBLISHED) {
        softwareDto = {
          id: tut.software.id,
          name: tut.software.name,
          slug: tut.software.slug,
          iconUrl: tut.software.iconUrl,
          developer: tut.software.developer,
          category: tut.software.category?.name || null,
          currentVersion: tut.software.versions[0]?.version || null,
        };
      }

      return {
        id: tut.id,
        title: tut.title,
        slug: tut.slug,
        summary: tut.summary,
        coverUrl: tut.coverUrl,
        status: tut.status,
        viewCount: tut.viewCount,
        publishedAt: tut.publishedAt ? tut.publishedAt.toISOString() : null,
        updatedAt: tut.updatedAt.toISOString(),
        category: meta.category,
        categoryName: meta.categoryName,
        difficulty: meta.difficulty,
        difficultyLabel: meta.difficultyLabel,
        platform: meta.platform,
        riskLevel: meta.riskLevel,
        isHighRisk: meta.riskLevel === 'HIGH',
        tags: meta.tags,
        readingMinutes: meta.readingMinutes,
        preflightChecklist: meta.preflightChecklist,
        software: softwareDto,
      };
    });

    // 3. 计算每个真实分类下的教程数量
    const categoryCounts: Record<string, number> = { all: enrichedTutorials.length };
    for (const c of CATEGORIES_DEF) {
      if (c.id !== 'all') {
        categoryCounts[c.id] = enrichedTutorials.filter((t) => t.category === c.id).length;
      }
    }

    const categoriesWithCount: TutorialCategoryMeta[] = CATEGORIES_DEF.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      count: categoryCounts[c.id] || 0,
    }));

    // 4. 多维条件过滤
    let filtered = enrichedTutorials.filter((item) => {
      // 分类筛选
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      // 难度筛选
      if (activeDifficulty !== 'ALL' && item.difficulty !== activeDifficulty) {
        return false;
      }
      // 平台筛选
      if (activePlatform !== 'ALL') {
        const plat = item.platform.toLowerCase();
        if (activePlatform === 'WIN11' && !plat.includes('11')) return false;
        if (activePlatform === 'WIN10' && !plat.includes('10') && !plat.includes('通用')) return false;
        if (activePlatform === 'CROSS' && !plat.includes('跨平台')) return false;
      }
      // 关键词检索（标题、摘要、标签、关联软件名）
      if (keyword) {
        const matchTitle = item.title.toLowerCase().includes(keyword);
        const matchSummary = item.summary.toLowerCase().includes(keyword);
        const matchTags = item.tags.some((t) => t.toLowerCase().includes(keyword));
        const matchSoftware = item.software?.name.toLowerCase().includes(keyword) || false;
        if (!matchTitle && !matchSummary && !matchTags && !matchSoftware) {
          return false;
        }
      }
      return true;
    });

    // 5. 排序逻辑
    filtered.sort((a, b) => {
      if (sort === 'views') {
        return b.viewCount - a.viewCount;
      }
      if (sort === 'updated') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      // 默认 latest
      const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return timeB - timeA;
    });

    // 6. 分页计算
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;
    const pagedItems = filtered.slice(skip, skip + limit);

    // 7. 精选 Hero 教程（优先选用官方原版装机或 Rufus 经典实操）
    const heroTutorial =
      enrichedTutorials.find((t) => t.slug === 'clean-install-win11-guide') ||
      enrichedTutorials.find((t) => t.slug === 'rufus-win11-bypass-tpm-guide') ||
      enrichedTutorials[0];

    // 8. 热门常见问题排障快捷入口（真实关联已发布教程，绝不放置空链接）
    const quickTroubleshooting: QuickTroubleshootEntry[] = [
      {
        id: 'qt-1',
        problem: '电脑频繁蓝屏、卡死怎么查硬件寿命？',
        description: '解读 SSD S.M.A.R.T. 健康度、坏道预警与通电时间指标。',
        slug: 'crystaldiskinfo-smart-health-check',
        category: 'troubleshoot',
        badge: '硬件检测',
      },
      {
        id: 'qt-2',
        problem: 'Windows 11 如何避开流氓 PE 纯净重装？',
        description: '告别第三方捆绑流氓推广，手把手制作原厂纯净安装环境。',
        slug: 'clean-install-win11-guide',
        category: 'windows',
        badge: '原版装机',
      },
      {
        id: 'qt-3',
        problem: '老电脑如何制作绕过 TPM 2.0 的安装 U 盘？',
        description: '利用 Rufus 一键跳过硬件检测与在线微软账户强行绑定要求。',
        slug: 'rufus-win11-bypass-tpm-guide',
        category: 'windows',
        badge: '启动制作',
      },
      {
        id: 'qt-4',
        problem: '开机卡慢、顽固弹窗自启动项怎么彻底清理？',
        description: '微软 Sysinternals Autoruns 地毯式排查排查启动隐藏项。',
        slug: 'sysinternals-autoruns-clean-startup',
        category: 'troubleshoot',
        badge: '系统加速',
      },
      {
        id: 'qt-5',
        problem: '局域网掉线或接口超时怎么抓包排查？',
        description: 'Wireshark 从三次握手、SYN/ACK 到 HTTP 报文深层拆解。',
        slug: 'wireshark-http-tcp-handshake-capture',
        category: 'network',
        badge: '网络排障',
      },
      {
        id: 'qt-6',
        problem: '如何自建不受限的私有远程桌面中继服务？',
        description: '基于开源 RustDesk 搭建专属高带宽、低延迟安全中继网关。',
        slug: 'rustdesk-self-hosted-relay-guide',
        category: 'network',
        badge: '远程办公',
      },
    ];

    // 9. 聚合统计指标
    const totalViews = enrichedTutorials.reduce((acc, cur) => acc + (cur.viewCount || 0), 0);

    return {
      success: true,
      data: {
        hero: heroTutorial,
        quickTroubleshooting,
        categories: categoriesWithCount,
        items: pagedItems,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        stats: {
          totalTutorials: enrichedTutorials.length,
          totalCategories: categoriesWithCount.length - 1, // 排除 'all'
          totalViews,
          verifiedGuidesCount: enrichedTutorials.length,
        },
      },
    };
  }

  /**
   * 获取教程详情（沉浸式阅读器完整数据，含目录标题提取、前置条件、风险提示、P8.8 关联软件与相关推荐）
   */
  static async getTutorialDetail(slug: string) {
    const tutorial = await prisma.tutorial.findUnique({
      where: { slug },
      include: {
        software: {
          select: {
            id: true,
            name: true,
            slug: true,
            iconUrl: true,
            developer: true,
            summary: true,
            isTestData: true,
            status: true,
            category: { select: { name: true } },
            versions: {
              where: { isLatest: true },
              take: 1,
              include: {
                downloadSources: {
                  where: { isActive: true },
                  select: {
                    id: true,
                    sourceName: true,
                    sourceType: true,
                    url: true,
                    platform: true,
                    verificationStatus: true,
                    sha256: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tutorial || tutorial.status !== 'PUBLISHED') {
      return null;
    }

    // 更新真实阅读计数
    await prisma.tutorial.update({
      where: { id: tutorial.id },
      data: { viewCount: { increment: 1 } },
    });

    const meta = TUTORIAL_METADATA_MAP[tutorial.slug] || {
      category: 'windows',
      categoryName: '综合教程',
      difficulty: 'BEGINNER',
      difficultyLabel: '入门友好',
      platform: 'Windows 通用',
      riskLevel: 'LOW',
      tags: ['实用指南', '软件教程'],
      readingMinutes: 5,
      preflightChecklist: ['操作前建议确认当前操作系统环境正常'],
    };

    // 从真实 Markdown 提取 H2 和 H3 标题作为目录（TOC）
    const headings: TutorialHeading[] = [];
    const lines = tutorial.content.split('\n');
    let headingIndex = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ')) {
        const text = trimmed.replace(/^##\s+/, '').replace(/\*\*/g, '').trim();
        headings.push({
          id: `heading-${headingIndex++}`,
          level: 2,
          text,
        });
      } else if (trimmed.startsWith('### ')) {
        const text = trimmed.replace(/^###\s+/, '').replace(/\*\*/g, '').trim();
        headings.push({
          id: `heading-${headingIndex++}`,
          level: 3,
          text,
        });
      }
    }

    // 关联软件安全隔离
    let softwareDto = null;
    if (tutorial.software && !tutorial.software.isTestData && tutorial.software.status === ResourceStatus.PUBLISHED) {
      const latestVer = tutorial.software.versions[0] || null;
      softwareDto = {
        id: tutorial.software.id,
        name: tutorial.software.name,
        slug: tutorial.software.slug,
        iconUrl: tutorial.software.iconUrl,
        developer: tutorial.software.developer,
        summary: tutorial.software.summary,
        category: tutorial.software.category?.name || null,
        latestVersion: latestVer?.version || null,
        downloadSources: latestVer?.downloadSources || [],
      };
    }

    // 获取同分类下的推荐文章（排除当前文章，取最多 4 篇）
    const allCandidates = await prisma.tutorial.findMany({
      where: {
        status: 'PUBLISHED',
        slug: { not: slug },
      },
      take: 20,
      orderBy: { viewCount: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        coverUrl: true,
        publishedAt: true,
        viewCount: true,
      },
    });

    const related = allCandidates
      .filter((item) => {
        const itemMeta = TUTORIAL_METADATA_MAP[item.slug];
        return itemMeta && itemMeta.category === meta.category;
      })
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        summary: item.summary,
        coverUrl: item.coverUrl,
        publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
        categoryName: meta.categoryName,
        difficultyLabel: TUTORIAL_METADATA_MAP[item.slug]?.difficultyLabel || '实用教程',
      }));

    // 获取上一篇与下一篇教程
    const allPublished = await prisma.tutorial.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'asc' },
      select: { slug: true, title: true },
    });
    const currentIndex = allPublished.findIndex((t) => t.slug === slug);
    const prevTutorial = currentIndex > 0 ? allPublished[currentIndex - 1] : null;
    const nextTutorial = currentIndex >= 0 && currentIndex < allPublished.length - 1 ? allPublished[currentIndex + 1] : null;

    return {
      id: tutorial.id,
      title: tutorial.title,
      slug: tutorial.slug,
      summary: tutorial.summary,
      content: tutorial.content,
      coverUrl: tutorial.coverUrl,
      viewCount: tutorial.viewCount + 1,
      publishedAt: tutorial.publishedAt ? tutorial.publishedAt.toISOString() : null,
      updatedAt: tutorial.updatedAt.toISOString(),
      seoTitle: tutorial.seoTitle,
      seoKeywords: tutorial.seoKeywords,
      seoDescription: tutorial.seoDescription,
      category: meta.category,
      categoryName: meta.categoryName,
      difficulty: meta.difficulty,
      difficultyLabel: meta.difficultyLabel,
      platform: meta.platform,
      riskLevel: meta.riskLevel,
      isHighRisk: meta.riskLevel === 'HIGH',
      tags: meta.tags,
      readingMinutes: meta.readingMinutes,
      preflightChecklist: meta.preflightChecklist,
      headings,
      software: softwareDto,
      relatedTutorials: related,
      prevTutorial,
      nextTutorial,
    };
  }
}
