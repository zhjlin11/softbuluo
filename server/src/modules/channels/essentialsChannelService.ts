import { ComparisonStatus, ResourceStatus, ResourceType, TopicStatus } from '@prisma/client';
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

export type EssentialsRiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface EssentialsPlanSoftwareDto extends CompactSoftwareDto {
  groupName: string;
  installOrder: number;
  rolePurpose: string;
  installTip: string;
  riskLevel: EssentialsRiskLevel;
  requireBackup: boolean;
  riskNotice: string | null;
}

export interface EssentialsSetupPlanDto {
  id: string;
  title: string;
  shortName: string;
  tagline: string;
  targetUsers: string;
  accentTone: 'blue' | 'emerald' | 'indigo' | 'violet' | 'sky' | 'amber';
  illustrationType: 'office' | 'gaming' | 'creative' | 'developer' | 'student' | 'repair';
  installAdvice: string;
  driverAdvice: string;
  recommendedCount: number;
  groups: string[];
  items: EssentialsPlanSoftwareDto[];
  externalChannelHints: Array<{
    title: string;
    channelLabel: string;
    description: string;
    url?: string;
    internalRoute?: string;
  }>;
}

export interface EssentialsInstallStepDto {
  step: number;
  id: string;
  title: string;
  shortLabel: string;
  summary: string;
  checklist: string[];
  complianceWarning: string | null;
  isHighRisk: boolean;
  relatedSoftwares: Array<{ slug: string; name: string }>;
  relatedTutorials: Array<{ slug: string; title: string }>;
}

export interface EssentialsToolboxGroupDto {
  id: string;
  title: string;
  description: string;
  isHighRisk: boolean;
  safetyNotice: string;
  tools: Array<
    CompactSoftwareDto & {
      riskLevel: EssentialsRiskLevel;
      requireBackup: boolean;
      requireAdmin: boolean;
      riskNotice: string | null;
    }
  >;
}

export interface EssentialsCategoryShelfDto {
  id: string;
  slug: string;
  name: string;
  description: string;
  totalCount: number;
  softwares: CompactSoftwareDto[];
}

export interface EssentialsChannelData {
  channel: 'ESSENTIALS';
  meta: {
    totalPublishedSoftwareCount: number;
    totalDesktopCount: number;
    totalToolsCount: number;
    registeredSourcesCount: number;
    approvedHealthySourcesCount: number;
    pendingSourcesCount: number;
    sha256VerifiedCount: number;
    topicsCount: number;
    tutorialsCount: number;
    totalDownloadEvents: number;
    draftQueueCount: number;
    viewStatsLabel: string;
    downloadStatsLabel: string;
    checklistSecurityNotice: string;
    generatedAt: string;
  };
  stageNav: Array<{ id: string; label: string }>;
  heroSlides: HeroSlideDto[];
  quickTools: CompactSoftwareDto[];
  setupPlans: EssentialsSetupPlanDto[];
  installWorkflow: EssentialsInstallStepDto[];
  toolboxGroups: EssentialsToolboxGroupDto[];
  categoryShelves: EssentialsCategoryShelfDto[];
  editorPicks: CompactSoftwareDto[];
  leaderboards: {
    mostViewed: CompactSoftwareDto[];
    mostDownloaded: CompactSoftwareDto[];
  };
  hotTopics: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    coverUrl: string;
    isFeatured: boolean;
    publishedAt: string;
    resourceCount: number;
    previewSoftwares: Array<{
      slug: string;
      name: string;
      iconUrl: string | null;
      categorySlug: string;
    }>;
  }>;
  tutorials: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    viewCount: number;
    publishedAt: string;
    isHighRisk: boolean;
    software: {
      slug: string;
      name: string;
      iconUrl: string | null;
    } | null;
  }>;
  comparisons: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    updatedAt: string;
    softwares: Array<{ slug: string; name: string; iconUrl: string | null }>;
  }>;
  latestUpdates: {
    versionUpdates: CompactSoftwareDto[];
    newlyCataloged: CompactSoftwareDto[];
  };
}

const TOOL_RISK_META: Record<
  string,
  { riskLevel: EssentialsRiskLevel; requireBackup: boolean; requireAdmin: boolean; riskNotice: string | null }
> = {
  diskgenius: {
    riskLevel: 'HIGH',
    requireBackup: true,
    requireAdmin: true,
    riskNotice: '高危分区/恢复工具：调整分区表或写盘前务必备份重要数据，切勿将恢复文件存回原分区。',
  },
  rufus: {
    riskLevel: 'HIGH',
    requireBackup: true,
    requireAdmin: true,
    riskNotice: '制作启动 U 盘将格式化并永久清除目标移动磁盘全部数据，请反复确认盘符。',
  },
  'geek-uninstaller': {
    riskLevel: 'MEDIUM',
    requireBackup: true,
    requireAdmin: true,
    riskNotice: '强制删除残留注册表前建议先确认软件安装目录，避免误清共享组件。',
  },
  wireshark: {
    riskLevel: 'MEDIUM',
    requireBackup: false,
    requireAdmin: true,
    riskNotice: '抓包驱动安装与实时抓包通常需要管理员权限，仅建议用于本机及授权排障网络。',
  },
};

const QUICK_TOOL_PRIORITY_SLUGS = [
  'rufus',
  'everything',
  '7zip',
  'hwinfo',
  'cpu-z',
  'diskgenius',
  'geek-uninstaller',
  'chrome',
];

interface PlanSpec {
  id: string;
  title: string;
  shortName: string;
  tagline: string;
  targetUsers: string;
  accentTone: EssentialsSetupPlanDto['accentTone'];
  illustrationType: EssentialsSetupPlanDto['illustrationType'];
  installAdvice: string;
  driverAdvice: string;
  entries: Array<{
    slug: string;
    groupName: string;
    rolePurpose: string;
    installTip: string;
  }>;
  externalChannelHints: EssentialsSetupPlanDto['externalChannelHints'];
}

const SETUP_PLAN_SPECS: PlanSpec[] = [
  {
    id: 'office',
    title: '日常办公电脑',
    shortName: '日常办公',
    tagline: '聚焦文档表格协同、无广告解压、极速本地文件定位与浏览器多任务稳定性。',
    targetUsers: '企业行政、财务运营、文员写作及常规居家日常电脑用户',
    accentTone: 'blue',
    illustrationType: 'office',
    installAdvice: '建议先安装解压与检索底座，再按需选择微软 Office（需自备正版授权）或开源免费的 LibreOffice。',
    driverAdvice: '日常办公本优先使用 Windows Update 与笔记本品牌官方支持中心更新 BIOS、无线网卡与打印机驱动。',
    entries: [
      { slug: 'chrome', groupName: '必备基础', rolePurpose: 'Web 协同办公与企业云端系统主力浏览器', installTip: '从官网下载并开启书签同步，谨慎安装来路不明扩展' },
      { slug: '7zip', groupName: '必备基础', rolePurpose: '高压缩比开源无广告归档解压缩工具', installTip: '安装后关联 .zip/.7z/.rar 格式，避开捆绑解压软件' },
      { slug: 'everything', groupName: '必备基础', rolePurpose: '十万级合同、发票、报表秒级本地检索', installTip: '建议勾选开机静默运行并配置常用快捷键' },
      { slug: 'libreoffice', groupName: '办公与效率', rolePurpose: '完全免费开源文档、表格、演示全套办公套件', installTip: '零订阅费用，适合无商业 Office 许可的个人与机构' },
      { slug: 'office-2024', groupName: '办公与效率', rolePurpose: '微软 Office 2024 原版获取引导（需自备合法许可）', installTip: '仅通过微软官方通道获取安装介质并遵守商业许可条款' },
      { slug: 'peazip', groupName: '办公与效率', rolePurpose: '支持跨平台归档与文件加密分卷备份的工具', installTip: '适合跨团队交换受 AES 加密保护的内部压缩文档' },
      { slug: 'ab-download-manager', groupName: '网络与下载', rolePurpose: '高速开源多线程大文件下载与队列管理器', installTip: '适合稳定拉取大型系统更新补丁与办公素材包' },
    ],
    externalChannelHints: [
      {
        title: 'Windows Update 与打印机厂商官方驱动入口',
        channelLabel: '系统/硬件官方渠道',
        description: '办公机及公司共享打印机请从品牌官网支持页或 Windows Update 自动获取驱动，避免未知第三方驱动下载器。',
        url: 'https://support.microsoft.com/zh-cn/windows',
      },
    ],
  },
  {
    id: 'gaming',
    title: '游戏娱乐电脑',
    shortName: '游戏娱乐',
    tagline: '涵盖新机硬件温度与配置核验、60FPS 游戏录屏推流、媒体回放与正版游戏入口指引。',
    targetUsers: 'PC 玩家、新配组装台式机/游戏本用户与游戏实况录屏玩家',
    accentTone: 'emerald',
    illustrationType: 'gaming',
    installAdvice: '新装配游戏主机建议先运行 HWiNFO64 与 CPU-Z 确认硬件型号、内存双通道与满载散热状态。',
    driverAdvice: '显卡驱动强烈建议直接前往 NVIDIA GeForce、AMD Software 或 Intel 官网获取 WHQL 认证驱动，勿轻信跑分软件自动更新。',
    entries: [
      { slug: 'hwinfo', groupName: '硬件监测与验机', rolePurpose: '实时监控显卡热点、CPU 功耗墙与供电电压曲线', installTip: '运行大型游戏或烤机前开启传感器窗口记录最高温度' },
      { slug: 'cpu-z', groupName: '硬件监测与验机', rolePurpose: '权威核对处理器步进、主板型号与内存 XMP/EXPO 时序', installTip: '重点核实内存是否双通道及运行频率达标' },
      { slug: 'obs-studio', groupName: '影音与录屏', rolePurpose: '开源专业低占用 60FPS 游戏录屏与直播推流套件', installTip: '优先选择 NVENC/AMF 硬件编码器以减小游戏帧率损失' },
      { slug: 'vlc', groupName: '影音与录屏', rolePurpose: '本地高码率游戏实况回放与 HDR 视频全格式播放器', installTip: '免额外解码器包，直接检验 OBS 录制画面清晰度' },
      { slug: '7zip', groupName: '必备基础', rolePurpose: '高速解压大型游戏模组、开源游戏整合包与补丁', installTip: '多线程压缩解压体验稳定，完全零广告弹窗' },
      { slug: 'chrome', groupName: '必备基础', rolePurpose: '查阅游戏攻略社区、正版平台商店页与核对源码发布页', installTip: '开启硬件加速提升网页视频与社区图集浏览流畅度' },
      { slug: 'ab-download-manager', groupName: '网络与下载', rolePurpose: '大体积开源游戏包体及硬件驱动文件稳定下载管理', installTip: '支持断点续传，防止大文件网络波动重下' },
    ],
    externalChannelHints: [
      {
        title: 'NVIDIA / AMD / Intel 显卡官方驱动通道',
        channelLabel: '官方驱动指引',
        description: '确保使用 WHQL 官方正式版显卡驱动释放 DirectX/Vulkan 性能，切勿安装来路不明魔改驱动。',
        url: 'https://www.nvidia.cn/Download/index.aspx',
      },
      {
        title: '软游部落正版与开源游戏中心',
        channelLabel: '站内专题频道',
        description: '前往软游部落游戏中心发现免费开源独立游戏与正规 Steam / Itch.io / 官网获取入口。',
        internalRoute: '/games',
      },
    ],
  },
  {
    id: 'creative',
    title: '设计剪辑电脑',
    shortName: '设计剪辑',
    tagline: '聚焦开源 3D 建模渲染、高清屏幕录屏制作、视频审片解码及大型工程资产检索。',
    targetUsers: '视觉设计师、三维动画师、自媒体视频剪辑与技术内容创作者',
    accentTone: 'violet',
    illustrationType: 'creative',
    installAdvice: '建议单独规划高速 NVMe SSD 作为工程缓存盘，定期通过 7-Zip / PeaZip 归档工程源码与贴图资产。',
    driverAdvice: '使用 GPU 加速渲染（如 Blender Cycles/OptiX）请从 NVIDIA Studio 或 AMD Pro 官方渠道获取工作室驱动。',
    entries: [
      { slug: 'blender', groupName: '创作与渲染', rolePurpose: '全球顶尖开源 3D 建模、绑定、动画、合成与渲染套件', installTip: '支持 GPU CUDA/OptiX/HIP 加速，建议结合官方英文界面对照手册' },
      { slug: 'obs-studio', groupName: '创作与渲染', rolePurpose: '无水印高清多音轨屏幕录制与软件实操演示采集', installTip: '分开录制麦克风与桌面音轨以便后期剪辑降噪混音' },
      { slug: 'vlc', groupName: '影音与审核', rolePurpose: '多编码格式原片素材预审与字幕同步回放工具', installTip: '支持逐帧步进与色彩空间快速校验' },
      { slug: 'everything', groupName: '资产与文件', rolePurpose: '跨硬盘瞬时查找数以万计 .blend/.png/.mp4 素材', installTip: '按扩展名后缀与目录前缀极速定位历史素材版本' },
      { slug: 'hwinfo', groupName: '系统维护', rolePurpose: '监测长时间 3D 渲染与导出阶段的显存与供电温度', installTip: '防止笔记本渲染过热降频或台式机散热异常' },
      { slug: '7zip', groupName: '资产与文件', rolePurpose: '项目成片、工程文件分卷高压缩归档交付', installTip: '对外发送项目资产包时可开启文件名加密提高保密性' },
      { slug: 'ab-download-manager', groupName: '网络与下载', rolePurpose: '开源渲染器插件包与高分辨率纹理素材批量极速下载', installTip: '按项目归类下载存储路径减少桌面杂乱' },
    ],
    externalChannelHints: [
      {
        title: 'NVIDIA Studio / GPU 硬件官方驱动通道',
        channelLabel: '创作稳定性优先',
        description: '创意生产力用户建议选用厂商 Studio 分支认证驱动以优化建模渲染软件兼容性。',
        url: 'https://www.nvidia.com/en-us/studio/',
      },
    ],
  },
  {
    id: 'developer',
    title: '程序员开发电脑',
    shortName: '程序开发',
    tagline: '构建开箱即用的现代代码编辑器、Git 版本管理、网络报文调试与安全文件传输工程底座。',
    targetUsers: '前后端工程师、全栈开发者、运维研发与计算机相关从业者',
    accentTone: 'indigo',
    illustrationType: 'developer',
    installAdvice: '代码仓建议存放在非系统盘英文路径（如 D:\\Workspace）；配置 Git 时启用 SSH 密钥替代传统口令推送。',
    driverAdvice: '开发电脑需确认硬件虚拟化支持（BIOS 开启 VT-x/AMD-V），并保持系统安全更新及时跟进。',
    entries: [
      { slug: 'vscode', groupName: '核心研发工具', rolePurpose: '全生态扩展插件与集成调试支持的跨平台代码编辑器', installTip: '使用账户或导出 extensions.json 管理开发插件组' },
      { slug: 'git', groupName: '核心研发工具', rolePurpose: '分布式版本控制工具与内置 Git Bash 命令行环境', installTip: '安装后及时配置 user.name/email 与 SSH Ed25519 密钥' },
      { slug: 'sublime-text', groupName: '核心研发工具', rolePurpose: '百兆超大系统日志秒级打开与极速多光标文本编辑', installTip: '轻量补充工具，处理巨型 SQL 转储或编译输出尤为高效' },
      { slug: 'wireshark', groupName: '网络与调试', rolePurpose: '底层 TCP/TLS 握手、HTTP 报文抓包排查接口异常利器', installTip: '配合过滤器表达式快速锁定局部联调测试端口流量' },
      { slug: 'filezilla', groupName: '网络与调试', rolePurpose: '安全直观的 SFTP / FTPS 跨主机文件上传维护客户端', installTip: '连接服务器务必使用 SFTP/SSH 密钥协议，禁止明文 FTP' },
      { slug: 'everything', groupName: '必备基础', rolePurpose: '在庞大的 node_modules 与源码库中瞬时检索特定配置文件', installTip: '可结合路径排除规则减少临时构建产物干扰' },
      { slug: '7zip', groupName: '必备基础', rolePurpose: '原生高效解压 .tar.gz / .tar.xz 源码发布归档包', installTip: '命令行 7z.exe 也可用于本地构建打包脚本' },
    ],
    externalChannelHints: [
      {
        title: 'Windows 环境 Git SSH 密钥配置实战',
        channelLabel: '站内配套教程',
        description: '完成 Git 安装后可循序阅读站内 SSH 密钥生成与代码仓库免密连接教程。',
        internalRoute: '/tutorials/git-ssh-key-github-windows-config',
      },
    ],
  },
  {
    id: 'student',
    title: '学生学习电脑',
    shortName: '学生学习',
    tagline: '兼顾毕业论文排版、开源零费办公、文献网页检索、编程入门实践与多媒体课程回放。',
    targetUsers: '高校本科生、研究生、科研入门与考证备考人群',
    accentTone: 'sky',
    illustrationType: 'student',
    installAdvice: '重要论文与实验代码务必遵循“本地双备份 + Git/网盘异地同步”，安装免费开源软件可完全免除盗版安全风险。',
    driverAdvice: '校园宿舍/实验室网络环境下，务必只通过学校校园网官方认证客户端与 Windows Update 更新无线网卡驱动。',
    entries: [
      { slug: 'chrome', groupName: '必备基础', rolePurpose: '论文文献数据库检索、学术翻译扩展与网课清晰兼容访问', installTip: '建议建立“学术科研”专属配置档案隔离娱乐标签页' },
      { slug: 'libreoffice', groupName: '办公与文档', rolePurpose: '100% 免费开源跨平台实验报告、表格与毕业演示套件', installTip: '配合微软字体优化设置提升与学校提交格式的兼容度' },
      { slug: 'office-2021', groupName: '办公与文档', rolePurpose: '高校正版校园许可或个人已购 Office 安装通道参考', installTip: '优先咨询所在高校信息化中心是否免费提供校园正版激活授权' },
      { slug: 'vscode', groupName: '学习与实验', rolePurpose: 'Python / C++ / Web 课程作业及 LaTeX 论文编写利器', installTip: '轻量低资源占用，一台电脑通吃绝大部分计算机实验课程' },
      { slug: 'peazip', groupName: '必备基础', rolePurpose: '直观易用的开源加密解压工具，安全处理同学互传课件包', installTip: '避免校园共享网盘下载包被恶意捆绑下载器误导' },
      { slug: 'everything', groupName: '必备基础', rolePurpose: '按课程名与日期瞬间找到历年课件、复习提纲与参考书 PDF', installTip: '考试周复习查找全盘资料的效率神器' },
      { slug: 'vlc', groupName: '影音播放', rolePurpose: '流畅播放倍速课程录像与外语听力音频，完全零广告弹窗', installTip: '支持快捷键精确调速（0.5x ~ 2.0x）及字幕微调' },
    ],
    externalChannelHints: [
      {
        title: 'LibreOffice 与 Microsoft Office 排版兼容实操',
        channelLabel: '站内学习指南',
        description: '学习如何使用开源免费套件无缝打开并导出高校标准作业与论文模板。',
        internalRoute: '/tutorials/libreoffice-ms-office-compatibility',
      },
    ],
  },
  {
    id: 'repair_station',
    title: '电脑维修工作站',
    shortName: '电脑维修站',
    tagline: '面向装机与维修人员：原版 Windows 介质引导、启动盘制作、磁盘分区救援与顽固软件深度卸载。',
    targetUsers: 'IT 支持工程师、电脑维修店技术员、机房维护与重装进阶玩家',
    accentTone: 'amber',
    illustrationType: 'repair',
    installAdvice: '高风险维修前必须执行：1) 与机主确认资料备份；2) 校验原版系统镜像 SHA-256；3) 分区写盘核对物理磁盘编号。',
    driverAdvice: '装机重装后严禁默认打包第三方全家桶驱动工具；先安装网卡官方驱动联网后走 Windows Update 与品牌官网通道。',
    entries: [
      { slug: 'windows-11', groupName: '系统镜像与启动盘', rolePurpose: '微软官方 Windows 11 24H2 原版镜像与 MediaCreationTool 获取入口', installTip: '下载后请通过 Get-FileHash 核对 SHA-256 指纹再制盘' },
      { slug: 'windows-10', groupName: '系统镜像与启动盘', rolePurpose: '经典老硬件兼容方案：Windows 10 22H2 官方原版介质引导', installTip: '适度区分官方工具与公开校验索引，严禁诱导未经授权激活方法' },
      { slug: 'rufus', groupName: '系统镜像与启动盘', rolePurpose: '高可靠性 USB 启动安装盘刻录与 UEFI/GPT 引导制作神器', installTip: '【高风险】写入操作将完全清空目标 U 盘所有数据，必先查验盘符' },
      { slug: 'diskgenius', groupName: '磁盘与硬件排查', rolePurpose: '无损分区、丢失引导扇区修复与误删数据扫描救援标杆', installTip: '【高风险】恢复数据严禁回写受损原分区，变动分区前务必备份' },
      { slug: 'hwinfo', groupName: '磁盘与硬件排查', rolePurpose: '主板 VRM、电源电压波动与固态硬盘 SMART 健康全面采集', installTip: '快速判定随机重启/花屏故障属于散热问题还是供电缺陷' },
      { slug: 'cpu-z', groupName: '磁盘与硬件排查', rolePurpose: '核实主板 BIOS 日期、CPU 真实体质、内存频率与供电参数', installTip: '便携版本免安装即可装入维修 U 盘随身携带运行' },
      { slug: 'geek-uninstaller', groupName: '系统与网络维修', rolePurpose: '便携免安装卸载顽固推广软件并强力扫描清理注册表残余', installTip: '谨慎核对扫描出的注册表节点路径再点击清理' },
      { slug: 'wireshark', groupName: '系统与网络维修', rolePurpose: '抓包排查局域网 DHCP、DNS 与 TLS 连接故障原因', installTip: '快速定位新装系统“已连接无网络”或代理端口阻塞问题' },
      { slug: 'everything', groupName: '系统与网络维修', rolePurpose: '在崩溃待救系统盘中毫秒搜寻机主遗留桌面、文档与证书备份', installTip: '挂载故障硬盘为从盘后即可通过路径索引快速救出数据' },
      { slug: '7zip', groupName: '系统与网络维修', rolePurpose: '高速打包移交机主资料备份归档并支持标准 AES-256 加密', installTip: '打包大规模备份文件时建议开启校验归档完整性' },
    ],
    externalChannelHints: [
      {
        title: '系统重装前 SHA-256 校验与纯净安装规范',
        channelLabel: '装机技术文档',
        description: '完整遵循安全合规原版系统部署检查表，不跳过 Secure Boot 安全基线或采用盗版激活器。',
        internalRoute: '/tutorials/clean-install-win11-guide',
      },
    ],
  },
];

const TOPIC_COVER_MAP: Record<string, string> = {
  'win11-essential-tools': '/images/essentials/hero-essentials-win11.svg',
  'open-source-office-suite': '/images/essentials/hero-essentials-office.svg',
  'genuine-microsoft-installation-media': '/images/essentials/hero-essentials-boot.svg',
  'disk-health-diagnosis': '/images/essentials/hero-essentials-repair.svg',
  'software-clean-uninstallation': '/images/system-tools/hero-clean.svg',
  'windows-sysinternals-guide': '/images/system-tools/hero-sysinternals.svg',
  'lan-troubleshooting-tools': '/images/system-tools/hero-network-diag.svg',
  'video-editing-screen-recording': '/images/system-tools/hero-maintenance.svg',
  'printer-driver-setup-guide': '/images/system-tools/hero-boot-media.svg',
  'remote-desktop-tools-selection': '/images/system-tools/hero-maintenance.svg',
  'open-source-games-collection': '/images/games/hero-indie-collection.svg',
};

const ESSENTIALS_TOPIC_PRIORITY = [
  'win11-essential-tools',
  'genuine-microsoft-installation-media',
  'open-source-office-suite',
  'disk-health-diagnosis',
  'software-clean-uninstallation',
  'windows-sysinternals-guide',
  'printer-driver-setup-guide',
  'lan-troubleshooting-tools',
];

const ESSENTIALS_TUTORIAL_PRIORITY = [
  'clean-install-win11-guide',
  'how-to-verify-genuine-iso-checksums',
  'rufus-win11-bypass-tpm-guide',
  'geek-uninstaller-clean-remnants',
  'everything-advanced-search-syntax',
  '7zip-ultra-compression-parameters',
  '7zip-aes256-encryption-tutorial',
  'libreoffice-ms-office-compatibility',
  'git-ssh-key-github-windows-config',
  'wireshark-http-tcp-handshake-capture',
  'obs-studio-game-recording-settings',
];

const HIGH_RISK_TUTORIAL_SLUGS = new Set([
  'clean-install-win11-guide',
  'rufus-win11-bypass-tpm-guide',
  'geek-uninstaller-clean-remnants',
]);

export class EssentialsChannelService {
  static async getEssentialsChannelData(): Promise<EssentialsChannelData> {
    const now = new Date();

    const [
      categoriesRaw,
      softwaresRaw,
      draftQueueCount,
      dlGroups,
      recommendationsRaw,
      topicsRaw,
      tutorialsRaw,
      comparisonsRaw,
      activeSourcesCount,
      approvedHealthySourcesCount,
      sha256SourcesCount,
    ] = await Promise.all([
      prisma.category.findMany({
        where: { isVisible: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.software.findMany({
        where: {
          status: ResourceStatus.PUBLISHED,
          isTestData: false,
          type: { not: ResourceType.GAME },
        },
        include: {
          category: true,
          versions: {
            orderBy: [{ isLatest: 'desc' }, { createdAt: 'desc' }],
            take: 1,
            include: {
              downloadSources: {
                where: { isActive: true },
                select: { id: true, verificationStatus: true, reviewStatus: true, lastCheckStatus: true },
              },
            },
          },
        },
        orderBy: [{ featuredOrder: 'asc' }, { viewCount: 'desc' }, { name: 'asc' }],
      }),
      prisma.software.count({
        where: { status: ResourceStatus.DRAFT, isTestData: false },
      }),
      prisma.downloadEvent.groupBy({
        by: ['softwareId'],
        where: { isTestEvent: false },
        _count: { softwareId: true },
      }),
      prisma.channelRecommendation.findMany({
        where: { channel: 'ESSENTIALS', isActive: true },
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
            select: { id: true, slug: true, name: true, iconUrl: true, type: true, status: true, isTestData: true },
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
                select: { id: true, slug: true, name: true, status: true, isTestData: true, iconUrl: true },
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
              type: { not: ResourceType.GAME },
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
              type: { not: ResourceType.GAME },
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
              type: { not: ResourceType.GAME },
            },
          },
        },
      }),
    ]);

    const dlCountMap = new Map<string, number>();
    const swIdsSet = new Set(softwaresRaw.map((s) => s.id));
    let totalDownloadEvents = 0;
    for (const g of dlGroups) {
      dlCountMap.set(g.softwareId, g._count.softwareId);
      if (swIdsSet.has(g.softwareId)) {
        totalDownloadEvents += g._count.softwareId;
      }
    }

    const allSoftwares = softwaresRaw.map((s) => toCompactSoftware(s, dlCountMap));
    const swById = new Map(allSoftwares.map((s) => [s.id, s]));
    const swBySlug = new Map(allSoftwares.map((s) => [s.slug, s]));
    const activeRecs = recommendationsRaw.filter((rec) => isWithinSchedule(rec, now));

    // 1. 合法专题排序与本地 SVG 安全封面映射（绝不暴露测试专题或外链失效大图）
    const validTopics = topicsRaw
      .map((t) => {
        const validResources = t.resources
          .filter(
            (r) =>
              r.software &&
              r.software.status === ResourceStatus.PUBLISHED &&
              !r.software.isTestData &&
              r.software.type !== ResourceType.GAME
          )
          .map((r) => ({
            slug: r.software.slug,
            name: r.software.name,
            iconUrl: r.software.iconUrl,
            categorySlug: r.software.category?.slug || 'sys-tools',
            latestVersion: r.software.versions?.[0]?.version || null,
          }));
        return {
          id: t.id,
          slug: t.slug,
          title: t.title,
          description: t.description,
          coverUrl: TOPIC_COVER_MAP[t.slug] || '/images/essentials/hero-essentials-win11.svg',
          isFeatured: t.isFeatured,
          publishedAt: (t.publishedAt || t.createdAt).toISOString().slice(0, 10),
          resourceCount: validResources.length,
          previewSoftwares: validResources.slice(0, 4),
        };
      })
      .filter((t) => t.resourceCount > 0 && t.slug !== 'open-source-games-collection');

    const topicPriorityIndex = new Map(ESSENTIALS_TOPIC_PRIORITY.map((slug, idx) => [slug, idx]));
    validTopics.sort((a, b) => {
      const idxA = topicPriorityIndex.has(a.slug) ? topicPriorityIndex.get(a.slug)! : 99;
      const idxB = topicPriorityIndex.has(b.slug) ? topicPriorityIndex.get(b.slug)! : 99;
      if (idxA !== idxB) return idxA - idxB;
      return b.resourceCount - a.resourceCount;
    });

    const topicById = new Map(validTopics.map((t) => [t.id, t]));
    const topicBySlug = new Map(validTopics.map((t) => [t.slug, t]));

    // 2. Hero 大图轮播（优先 ESSENTIALS 后台 HERO 配置 -> 再兜底精选装机专题）
    const heroSlides: HeroSlideDto[] = [];
    const seenSlideKeys = new Set<string>();

    const heroRecs = activeRecs.filter((r) => r.slot === 'HERO');
    for (const rec of heroRecs) {
      if (heroSlides.length >= 4) break;
      if (rec.targetType === 'TOPIC') {
        const tp = topicById.get(rec.targetId);
        if (!tp || seenSlideKeys.has(`topic:${tp.id}`)) continue;
        seenSlideKeys.add(`topic:${tp.id}`);
        heroSlides.push({
          id: rec.id,
          title: conciseHeroText(rec.title || tp.title, 26),
          subtitle: conciseHeroText(rec.subtitle || tp.description, 44),
          badge: rec.badgeText || '装机方案专题',
          targetUrl: `/topics/${tp.slug}`,
          targetType: 'TOPIC',
          coverImage: rec.coverImage || tp.coverUrl,
          theme: SLIDE_THEMES[heroSlides.length % SLIDE_THEMES.length],
          statsText: `已核验收录 ${tp.resourceCount} 款`,
          previewSoftwares: tp.previewSoftwares.slice(0, 3),
        });
      } else if (rec.targetType === 'SOFTWARE') {
        const sw = swById.get(rec.targetId);
        if (!sw || seenSlideKeys.has(`sw:${sw.id}`)) continue;
        seenSlideKeys.add(`sw:${sw.id}`);
        heroSlides.push({
          id: rec.id,
          title: conciseHeroText(rec.title || sw.name, 26),
          subtitle: conciseHeroText(rec.subtitle || sw.summary, 44),
          badge: rec.badgeText || '装机焦点推荐',
          targetUrl: `/software/${sw.slug}`,
          targetType: 'SOFTWARE',
          coverImage: rec.coverImage || '/images/essentials/hero-essentials-win11.svg',
          theme: SLIDE_THEMES[heroSlides.length % SLIDE_THEMES.length],
          statsText: `${sw.categoryName}${sw.latestVersion ? ` · ${sw.latestVersion}` : ''}`,
          previewSoftwares: [
            {
              slug: sw.slug,
              name: sw.name,
              iconUrl: sw.iconUrl,
              categorySlug: sw.categorySlug,
              latestVersion: sw.latestVersion,
            },
          ],
        });
      }
    }

    const defaultHeroConfigs = [
      {
        slug: 'win11-essential-tools',
        badge: '新机必看指南',
        title: 'Windows 11 新电脑装机与初始化全景方案',
        subtitle: '按用途选定软件清单，避开恶意下载器与隐私广告推送。',
        cover: '/images/essentials/hero-essentials-win11.svg',
      },
      {
        slug: 'genuine-microsoft-installation-media',
        badge: '原版镜像指引',
        title: '正版系统安装镜像获取与 SHA-256 完整性校验',
        subtitle: '明确区分官方安装通道与第三方索引，守牢装机安全底线。',
        cover: '/images/essentials/hero-essentials-boot.svg',
      },
      {
        slug: 'open-source-office-suite',
        badge: '办公生产力',
        title: '零订阅免费开源办公与文档处理装机组合',
        subtitle: '结合 LibreOffice、高效检索与加密解压打造流畅工作台。',
        cover: '/images/essentials/hero-essentials-office.svg',
      },
      {
        slug: 'disk-health-diagnosis',
        badge: '硬件体检与维修',
        title: '装机验机、硬盘健康排查与应急维修工具箱',
        subtitle: '覆盖温度功耗监测、引导盘制作与高风险磁盘恢复警示。',
        cover: '/images/essentials/hero-essentials-repair.svg',
      },
    ];

    for (const cfg of defaultHeroConfigs) {
      if (heroSlides.length >= 4) break;
      const tp = topicBySlug.get(cfg.slug);
      if (!tp || seenSlideKeys.has(`topic:${tp.id}`)) continue;
      seenSlideKeys.add(`topic:${tp.id}`);
      heroSlides.push({
        id: `default-hero-${tp.id}`,
        title: cfg.title,
        subtitle: cfg.subtitle,
        badge: cfg.badge,
        targetUrl: `/topics/${tp.slug}`,
        targetType: 'TOPIC',
        coverImage: cfg.cover,
        theme: SLIDE_THEMES[heroSlides.length % SLIDE_THEMES.length],
        statsText: `专题收录 ${tp.resourceCount} 款正版软件`,
        previewSoftwares: tp.previewSoftwares.slice(0, 3),
      });
    }

    // 3. 右侧「装机常用工具」（8 款，优先后台 WEEKLY_PICK 配置）
    const quickTools: CompactSoftwareDto[] = [];
    const quickSeenIds = new Set<string>();
    const weeklyRecs = activeRecs.filter((r) => r.slot === 'WEEKLY_PICK' && r.targetType === 'SOFTWARE');
    for (const rec of weeklyRecs) {
      if (quickTools.length >= 8) break;
      const sw = swById.get(rec.targetId);
      if (!sw || quickSeenIds.has(sw.id)) continue;
      quickSeenIds.add(sw.id);
      quickTools.push({
        ...sw,
        badgeText: rec.badgeText || sw.badgeText,
        editorialNote: rec.subtitle || sw.editorialNote,
      });
    }
    for (const slug of QUICK_TOOL_PRIORITY_SLUGS) {
      if (quickTools.length >= 8) break;
      const sw = swBySlug.get(slug);
      if (!sw || quickSeenIds.has(sw.id)) continue;
      quickSeenIds.add(sw.id);
      quickTools.push(sw);
    }
    if (quickTools.length < 8) {
      for (const sw of allSoftwares) {
        if (quickTools.length >= 8) break;
        if (quickSeenIds.has(sw.id)) continue;
        quickSeenIds.add(sw.id);
        quickTools.push(sw);
      }
    }

    // 4. 6 大真实场景装机方案（仅绑定数据库已发布软件，绝对不虚构）
    const setupPlans: EssentialsSetupPlanDto[] = SETUP_PLAN_SPECS.map((spec) => {
      const items: EssentialsPlanSoftwareDto[] = [];
      const seenPlanSlugs = new Set<string>();
      const groupsOrder: string[] = [];

      for (const entry of spec.entries) {
        const sw = swBySlug.get(entry.slug);
        if (!sw || seenPlanSlugs.has(sw.slug)) continue;
        seenPlanSlugs.add(sw.slug);
        if (!groupsOrder.includes(entry.groupName)) {
          groupsOrder.push(entry.groupName);
        }
        const risk = TOOL_RISK_META[sw.slug] || {
          riskLevel: 'LOW' as EssentialsRiskLevel,
          requireBackup: false,
          requireAdmin: false,
          riskNotice: null,
        };
        items.push({
          ...sw,
          groupName: entry.groupName,
          installOrder: items.length + 1,
          rolePurpose: entry.rolePurpose,
          installTip: entry.installTip,
          riskLevel: risk.riskLevel,
          requireBackup: risk.requireBackup,
          riskNotice: risk.riskNotice,
        });
      }

      return {
        id: spec.id,
        title: spec.title,
        shortName: spec.shortName,
        tagline: spec.tagline,
        targetUsers: spec.targetUsers,
        accentTone: spec.accentTone,
        illustrationType: spec.illustrationType,
        installAdvice: spec.installAdvice,
        driverAdvice: spec.driverAdvice,
        recommendedCount: items.length,
        groups: groupsOrder,
        items,
        externalChannelHints: spec.externalChannelHints,
      };
    }).filter((plan) => plan.items.length > 0);

    // 5. 合法公开教程集合（过滤内部策略文案与测试前缀）
    const validTutorialsRaw = tutorialsRaw
      .filter((t) => !INTERNAL_POLICY_TUTORIAL_SLUGS.has(t.slug))
      .map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        summary: t.summary,
        viewCount: t.viewCount,
        publishedAt: (t.publishedAt || t.createdAt).toISOString().slice(0, 10),
        isHighRisk: HIGH_RISK_TUTORIAL_SLUGS.has(t.slug),
        software:
          t.software && t.software.status === ResourceStatus.PUBLISHED && !t.software.isTestData
            ? { slug: t.software.slug, name: t.software.name, iconUrl: t.software.iconUrl }
            : null,
      }));
    const tutBySlug = new Map(validTutorialsRaw.map((t) => [t.slug, t]));

    const tutPriority = new Map(ESSENTIALS_TUTORIAL_PRIORITY.map((slug, idx) => [slug, idx]));
    const tutorials = [...validTutorialsRaw]
      .sort((a, b) => {
        const pA = tutPriority.has(a.slug) ? tutPriority.get(a.slug)! : 99;
        const pB = tutPriority.has(b.slug) ? tutPriority.get(b.slug)! : 99;
        if (pA !== pB) return pA - pB;
        return b.publishedAt.localeCompare(a.publishedAt);
      })
      .slice(0, 10);

    // 6. 8 步「从零开始完成新电脑配置」标准流程（每步严格过滤真实存在链接）
    const pickSoftwaresBySlugs = (slugs: string[]) =>
      slugs
        .map((s) => swBySlug.get(s))
        .filter((s): s is CompactSoftwareDto => Boolean(s))
        .map((s) => ({ slug: s.slug, name: s.name }));
    const pickTutorialsBySlugs = (slugs: string[]) =>
      slugs
        .map((s) => tutBySlug.get(s))
        .filter((t): t is NonNullable<typeof t> => Boolean(t))
        .map((t) => ({ slug: t.slug, title: t.title }));

    const installWorkflow: EssentialsInstallStepDto[] = [
      {
        step: 1,
        id: 'step-hardware',
        title: '检查硬件与系统要求',
        shortLabel: '硬件兼容性',
        summary: '确认 CPU 架构、内存容量、可用磁盘空间、TPM 2.0 / Secure Boot 状态及当前网络与硬盘健康度。',
        checklist: ['核查至少 64 GB 可用系统盘空间与稳定网络连接', '新配主机建议核实处理器与内存条基础参数', '旧机重装前确认主板 UEFI 与磁盘健康状况'],
        complianceWarning: null,
        isHighRisk: false,
        relatedSoftwares: pickSoftwaresBySlugs(['hwinfo', 'cpu-z']),
        relatedTutorials: [],
      },
      {
        step: 2,
        id: 'step-backup',
        title: '备份重要数据与授权凭据',
        shortLabel: '备份数据',
        summary: '重装或调整磁盘前检查桌面、文档、下载目录、浏览器书签、项目源码及商业软件正版序列号。',
        checklist: ['将桌面与“文档”文件夹冷备份至移动硬盘或异地网盘', '导出浏览器书签并记录已购软件许可凭证', '对私密压缩归档可启用 7-Zip AES-256 加密保护'],
        complianceWarning: '系统重装会清除系统分区内原有文件，切勿未做完整备份直接格式化硬盘。',
        isHighRisk: true,
        relatedSoftwares: pickSoftwaresBySlugs(['7zip', 'everything']),
        relatedTutorials: pickTutorialsBySlugs(['7zip-aes256-encryption-tutorial']),
      },
      {
        step: 3,
        id: 'step-media',
        title: '下载官方系统安装资源',
        shortLabel: '官方系统介质',
        summary: '从微软官方发布渠道下载原版安装创建工具或 ISO 镜像，并用系统工具核对 SHA-256 哈希。',
        checklist: ['明确区分微软官方工具/官方 ISO 与第三方整理索引（例如 Massgrave 文档并非微软官网）', '安装镜像下载不等于自动取得 Windows 商业使用许可', '切勿从不明第三方下载站拉取“魔改精简系统包”'],
        complianceWarning: '请自备或核验合法系统授权，软游部落绝不提供或诱导任何绕过正版激活的工具。',
        isHighRisk: false,
        relatedSoftwares: pickSoftwaresBySlugs(['windows-11', 'windows-10']),
        relatedTutorials: pickTutorialsBySlugs(['how-to-verify-genuine-iso-checksums']),
      },
      {
        step: 4,
        id: 'step-usb',
        title: '制作可引导启动 U 盘',
        shortLabel: '制作启动盘',
        summary: '使用 Rufus 等经过源码公开或口碑核验的启动盘制作工具，将原版 ISO 写入 8GB+ 空白 U 盘。',
        checklist: ['确认目标系统分区表类型（现代主板统一推荐使用 UEFI + GPT）', '写入镜像前再三比对设备容量与盘符标签，避免误抹除数据盘', '勿轻信来历不明的广告流氓 PE 启动工具'],
        complianceWarning: '【高风险警告】制作启动 U 盘将格式化并清空所选 USB 存储器内全部现有文件！',
        isHighRisk: true,
        relatedSoftwares: pickSoftwaresBySlugs(['rufus']),
        relatedTutorials: pickTutorialsBySlugs(['rufus-win11-bypass-tpm-guide']),
      },
      {
        step: 5,
        id: 'step-install',
        title: '执行原版系统安装与分区',
        shortLabel: '安装系统',
        summary: '开机轻按主板引导快捷键（ASUS 按 F8、Gigabyte 按 F12、MSI 按 F11、Lenovo 按 F12）选择 UEFI 启动 U 盘；在 Windows 安装界面选择自定义，确认目标磁盘后在未分配空间新建 GPT 分区完成安装。',
        checklist: [
          '优先采用 UEFI 引导与 GPT 分区格式以支持安全启动（Secure Boot）与大容量磁盘',
          '注意识别原有系统盘与数据盘：品牌机可能带有 OEM 预装还原分区，切勿盲目全盘清空导致恢复镜像或个人数据丢失',
          '商业软件与操作系统应遵循正版合规使用规范，激活请使用官方购买的正版密钥',
        ],
        complianceWarning: '【数据安全警告】选择目标安装分区时务必仔细核对磁盘编号与分区大小，非必要切勿删除带有用户文件的非系统分区或 OEM 还原分区！',
        isHighRisk: true,
        relatedSoftwares: pickSoftwaresBySlugs(['diskgenius', 'windows-11']),
        relatedTutorials: pickTutorialsBySlugs(['clean-install-win11-guide']),
      },
      {
        step: 6,
        id: 'step-drivers',
        title: '配置官方硬件驱动与系统更新',
        shortLabel: '驱动配置',
        summary: '联网后第一时间通过 Windows Update 补齐基础系统补丁与核心驱动，再前往电脑品牌或芯片官网更新。',
        checklist: ['优先渠道：Windows Update → 电脑品牌官方支持中心 → NVIDIA/AMD/Intel 芯片官网', '避免使用会静默安装弹窗浏览器/助手插件的第三方“万能驱动打包”', '外设（打印机、数位板、声卡）统一从对应产品型号官网获取驱动'],
        complianceWarning: null,
        isHighRisk: false,
        relatedSoftwares: [],
        relatedTutorials: [],
      },
      {
        step: 7,
        id: 'step-apps',
        title: '按场景选择并安装必备软件',
        shortLabel: '安装必备软件',
        summary: '结合上方场景装机方案，按「浏览器/解压/检索 → 办公/开发/创作工具」顺序逐一进入官网通道安装。',
        checklist: ['避免第三方高速下载器勾选全家桶，逐项点选官方发布页面', '根据上方可勾选装机清单定制当前机器实际需要的应用', '大型开发环境或创意工程软件建议更改默认安装盘符至充足分区'],
        complianceWarning: null,
        isHighRisk: false,
        relatedSoftwares: pickSoftwaresBySlugs(['chrome', '7zip', 'everything', 'vscode']),
        relatedTutorials: pickTutorialsBySlugs(['everything-advanced-search-syntax', '7zip-ultra-compression-parameters']),
      },
      {
        step: 8,
        id: 'step-security',
        title: '完成基础安全配置与健康巡检',
        shortLabel: '安全配置',
        summary: '启用 Windows Defender 实时保护与系统还原点，核验常用浏览器隐私权限并监测新机初期散热温度。',
        checklist: ['保持 Windows Defender 实时保护与防火墙开启，勿随意安装来源不明“优化关防”工具', '为系统盘创建初始还原点或定期重要文件冷备份', '使用 HWiNFO64 确认空闲与高负载下 CPU/SSD 温度合理'],
        complianceWarning: null,
        isHighRisk: false,
        relatedSoftwares: pickSoftwaresBySlugs(['hwinfo', 'geek-uninstaller']),
        relatedTutorials: pickTutorialsBySlugs(['geek-uninstaller-clean-remnants']),
      },
    ];

    // 7. 专业装机与维修工具箱（按功能分箱，空分组自动省略，高风险标注明确提示）
    const makeToolboxTool = (sw: CompactSoftwareDto) => {
      const risk = TOOL_RISK_META[sw.slug] || {
        riskLevel: 'LOW' as EssentialsRiskLevel,
        requireBackup: false,
        requireAdmin: false,
        riskNotice: null,
      };
      return { ...sw, ...risk };
    };

    const toolboxGroups: EssentialsToolboxGroupDto[] = [
      {
        id: 'boot-media',
        title: '启动盘制作与原版介质',
        description: '原版镜像官方通道校验、UEFI/GPT 启动 USB 写入与版本引导。',
        isHighRisk: true,
        safetyNotice: '写盘前务必备份并核对 U 盘盘符；禁止使用夹带捆绑推广包的流氓 PE 工具。',
        tools: ['rufus', 'windows-11', 'windows-10', 'windows-ltsc']
          .map((s) => swBySlug.get(s))
          .filter((s): s is CompactSoftwareDto => Boolean(s))
          .map(makeToolboxTool),
      },
      {
        id: 'disk-partition',
        title: '磁盘分区与数据恢复',
        description: '无损调整分区大小、查找丢失引导表与受损分区紧急文件挽救。',
        isHighRisk: true,
        safetyNotice: '高危数据操作：任何分区调整或写入前均应全盘备份；恢复数据禁止存回原分区！',
        tools: ['diskgenius']
          .map((s) => swBySlug.get(s))
          .filter((s): s is CompactSoftwareDto => Boolean(s))
          .map(makeToolboxTool),
      },
      {
        id: 'hardware-check',
        title: '硬件检测与温度验机',
        description: '精准核验 CPU/内存参数规格及主机高负载温度、功耗墙曲线。',
        isHighRisk: false,
        safetyNotice: '压力温度测试建议确保散热器安装稳固并连接稳定电源。',
        tools: ['hwinfo', 'cpu-z']
          .map((s) => swBySlug.get(s))
          .filter((s): s is CompactSoftwareDto => Boolean(s))
          .map(makeToolboxTool),
      },
      {
        id: 'network-diag',
        title: '网络诊断与极速传输',
        description: '底层抓包排错、SSH/SFTP 安全文件互传与多线程直链下载管理。',
        isHighRisk: false,
        safetyNotice: '抓包通常需管理员权限并仅限本人/授权排障网络，请妥善保管服务器 SSH 凭据。',
        tools: ['wireshark', 'ab-download-manager', 'filezilla']
          .map((s) => swBySlug.get(s))
          .filter((s): s is CompactSoftwareDto => Boolean(s))
          .map(makeToolboxTool),
      },
      {
        id: 'file-archive',
        title: '文件索引与压缩归档',
        description: '全盘毫秒级 NTFS 秒搜、无广告开源解压缩与隐私文件高强度加密打包。',
        isHighRisk: false,
        safetyNotice: '涉及企业或个人文档归档建议使用 7-Zip AES-256 或 PeaZip 分卷加密。',
        tools: ['7zip', 'everything', 'peazip']
          .map((s) => swBySlug.get(s))
          .filter((s): s is CompactSoftwareDto => Boolean(s))
          .map(makeToolboxTool),
      },
      {
        id: 'uninstall-clean',
        title: '软件卸载与环境清理',
        description: '便携免安装卸载出厂预装应用与彻底扫描残余目录和注册表垃圾。',
        isHighRisk: true,
        safetyNotice: '强制深度卸载清理注册表项前需确认目标条目，防止误删公共运行库。',
        tools: ['geek-uninstaller', 'git']
          .map((s) => swBySlug.get(s))
          .filter((s): s is CompactSoftwareDto => Boolean(s))
          .map(makeToolboxTool),
      },
    ].filter((g) => g.tools.length > 0);

    // 8. 常用分类软件货架（按真实可见非空分类展示 4-6 款，去重，绝不生成空分类块）
    const categoryShelves: EssentialsCategoryShelfDto[] = categoriesRaw
      .filter((c) => c.slug !== 'games')
      .map((cat) => {
        const items = allSoftwares.filter((s) => s.categoryId === cat.id);
        return {
          id: cat.id,
          slug: cat.slug,
          name: cat.name,
          description: cat.description || `精选${cat.name}装机必备正版软件`,
          totalCount: items.length,
          softwares: items.slice(0, 6),
        };
      })
      .filter((shelf) => shelf.totalCount > 0);

    // 9. 编辑精选（避免与右侧快捷常用工具重样堆砌，优先后台 EDITOR_PICK）
    const editorRecs = activeRecs.filter((r) => r.slot === 'EDITOR_PICK' && r.targetType === 'SOFTWARE');
    const editorPool = allSoftwares.filter((s) => !quickSeenIds.has(s.id) && !s.slug.startsWith('windows-'));
    const editorPicks = pickChannelSoftwares({
      recs: editorRecs.map((r) => ({ targetId: r.targetId, badgeText: r.badgeText, subtitle: r.subtitle })),
      pool: editorPool.length >= 6 ? editorPool : allSoftwares,
      swMap: swById,
      limit: 8,
      maxPerFamily: 1,
    });

    // 10. 真实榜单（严格非测试过滤与低样本真实口径：绝不用 0 浏览或 0 下载虚构凑数）
    const mostViewed = [...allSoftwares]
      .filter((s) => s.viewCount > 0)
      .sort((a, b) => b.viewCount - a.viewCount || b.downloadCount - a.downloadCount)
      .slice(0, 10);
    const mostDownloaded = [...allSoftwares]
      .filter((s) => s.downloadCount > 0)
      .sort((a, b) => b.downloadCount - a.downloadCount || b.viewCount - a.viewCount)
      .slice(0, 10);

    // 11. 对比评测（合规已发布，关联至少 1 个非游戏正式资源）
    const comparisons = comparisonsRaw
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
          })),
      }))
      .filter((c) => c.softwares.length >= 1)
      .slice(0, 4);

    // 12. 最近更新（严格区分「版本发布日更新」与「平台最新收录上架」）
    const versionUpdates = [...allSoftwares]
      .filter((s) => Boolean(s.latestVersion))
      .sort((a, b) => {
        const dA = a.releaseDate || '';
        const dB = b.releaseDate || '';
        if (dA !== dB) return dB.localeCompare(dA);
        return b.updatedAt.localeCompare(a.updatedAt);
      })
      .slice(0, 8);

    const newlyCataloged = [...allSoftwares]
      .sort((a, b) => new Date(b.catalogedAt).getTime() - new Date(a.catalogedAt).getTime())
      .slice(0, 8);

    return {
      channel: 'ESSENTIALS',
      meta: {
        totalPublishedSoftwareCount: allSoftwares.length,
        totalDesktopCount: allSoftwares.filter((s) => s.type === ResourceType.SOFTWARE).length,
        totalToolsCount: allSoftwares.filter((s) => s.type === ResourceType.TOOL).length,
        registeredSourcesCount: activeSourcesCount,
        approvedHealthySourcesCount,
        pendingSourcesCount: Math.max(0, activeSourcesCount - approvedHealthySourcesCount),
        sha256VerifiedCount: sha256SourcesCount,
        topicsCount: validTopics.length,
        tutorialsCount: validTutorialsRaw.length,
        totalDownloadEvents,
        draftQueueCount,
        viewStatsLabel: '详情页真实浏览统计（非下载完成量）',
        downloadStatsLabel: '站内非测试下载触发事件（实际完成请以官方渠道为准）',
        checklistSecurityNotice:
          '勾选与导出装机清单仅作本地规划与参考，绝不会未经确认触发批量下载、获取管理员权限或运行安装脚本；商业软件需自行取得合法正版授权。',
        generatedAt: now.toISOString(),
      },
      stageNav: [
        { id: 'essentials-hero', label: '装机精选大图' },
        { id: 'essentials-plans', label: '选择装机方案' },
        { id: 'essentials-checklist', label: '勾选装机清单' },
        { id: 'essentials-workflow', label: '新机安装流程' },
        { id: 'essentials-toolbox', label: '装机维修工具箱' },
        { id: 'essentials-categories', label: '常用软件分类' },
        { id: 'essentials-guides', label: '专题与实战教程' },
        { id: 'essentials-catalog', label: '完整装机目录' },
      ],
      heroSlides,
      quickTools,
      setupPlans,
      installWorkflow,
      toolboxGroups,
      categoryShelves,
      editorPicks,
      leaderboards: {
        mostViewed,
        mostDownloaded,
      },
      hotTopics: validTopics.slice(0, 6),
      tutorials,
      comparisons,
      latestUpdates: {
        versionUpdates,
        newlyCataloged,
      },
    };
  }
}
