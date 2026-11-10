import { prisma } from '../server/src/db';
import { TopicStatus } from '@prisma/client';

async function main() {
  console.log('--- Step 1: Cleaning up historical test topics & tutorials ---');
  await prisma.topicResource.deleteMany({
    where: { topic: { slug: { startsWith: 'topic-p3-' } } },
  });
  await prisma.topic.deleteMany({
    where: { slug: { startsWith: 'topic-p3-' } },
  });
  await prisma.tutorial.deleteMany({
    where: { slug: { startsWith: 'tut-p3-' } },
  });
  console.log('Historical test topics and tutorials cleaned up.');

  const admin = await prisma.user.findFirst();
  const authorId = admin?.id || 'cmw7ulqnz000avkmksq906cn6';

  console.log('\n--- Step 2: Seeding 10 High-Quality Original Topics ---');
  const TOPICS_DATA = [
    {
      slug: 'win11-essential-tools',
      title: 'Windows 11 新电脑装机必备工具指南',
      description: '为全新 Windows 11 电脑精选的系统增强、压缩解压、文件搜索与必备日常效率神器，拒绝预装捆绑与流氓全家桶。',
      coverUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
      isFeatured: true,
      status: TopicStatus.PUBLISHED,
      sortOrder: 1,
      seoTitle: 'Windows 11 新电脑装机必备软件清单 - 软游部落精选专题',
      seoKeywords: 'Win11装机必备,系统工具,开源软件,无捆绑软件,新电脑配置',
      seoDescription: '告别广告弹窗与全家桶捆绑，软游部落为 Windows 11 用户严选 7-Zip、Everything、Bandizip 等装机必备良心工具。',
      softwareSlugs: ['7zip', 'everything', 'bandizip', 'geek-uninstaller', 'quicklook', 'potplayer'],
    },
    {
      slug: 'open-source-office-suite',
      title: '免费开源办公软件生产力套件',
      description: '完全摆脱商业办公软件昂贵订阅与强制广告弹窗，打造集文档排版、笔记双链、文献管理与架构绘图于一体的开源工作流。',
      coverUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&auto=format&fit=crop&q=80',
      isFeatured: true,
      status: TopicStatus.PUBLISHED,
      sortOrder: 2,
      seoTitle: '免费开源办公软件套件推荐 - 个人与团队生产力工作流',
      seoKeywords: '开源办公软件,LibreOffice,Obsidian,Drawio,Zotero,无广告办公',
      seoDescription: '严选 LibreOffice、Obsidian、Draw.io 与 SumatraPDF 等高质量开源办公神器，本地优先、数据可控。',
      softwareSlugs: ['libreoffice', 'obsidian', 'drawio', 'sumatrapdf', 'joplin', 'zotero'],
    },
    {
      slug: 'disk-health-diagnosis',
      title: '电脑硬盘健康检测与故障排查指南',
      description: '固态硬盘（NVMe/SATA）与机械硬盘全面体检手册：测速基准、S.M.A.R.T. 预警、坏道修复与数据恢复全流程。',
      coverUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=1200&auto=format&fit=crop&q=80',
      isFeatured: true,
      status: TopicStatus.PUBLISHED,
      sortOrder: 3,
      seoTitle: '硬盘健康检测与故障诊断工具专题 - CrystalDiskInfo/DiskGenius',
      seoKeywords: 'SSD寿命检测,硬盘坏道,CrystalDiskInfo,CrystalDiskMark,DiskGenius,硬盘数据恢复',
      seoDescription: '系统性排查电脑卡顿、硬盘异响与 0E 报错，包含 CrystalDiskInfo 与 DiskGenius 完整排查方案。',
      softwareSlugs: ['crystaldiskinfo', 'crystaldiskmark', 'diskgenius', 'bleachbit'],
    },
    {
      slug: 'windows-sysinternals-guide',
      title: 'Windows 系统底层维护与 Sysinternals 神器全解',
      description: '深入操作系统内核：排查高 CPU/内存占用进程、地毯式清除流氓开机自启动项、抓取网络通讯套接字实战。',
      coverUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80',
      isFeatured: true,
      status: TopicStatus.PUBLISHED,
      sortOrder: 4,
      seoTitle: '微软 Sysinternals 高级系统维护全书 - Process Explorer/Autoruns',
      seoKeywords: 'Sysinternals,Process Explorer,Autoruns,TCPView,系统卡顿排查,自启动清理',
      seoDescription: '微软官方底层运维工具集精选，透视进程树句柄、清除深层注册表自启、监控网络外联。',
      softwareSlugs: ['process-explorer', 'autoruns', 'tcpview', 'geek-uninstaller'],
    },
    {
      slug: 'lan-troubleshooting-tools',
      title: '局域网与网络故障排查诊断工具箱',
      description: '家庭网管与企业运维必备：快速扫描网段 IP 设备、分析端口连通性、解析底层网络抓包定位断网丢包源头。',
      coverUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      status: TopicStatus.PUBLISHED,
      sortOrder: 5,
      seoTitle: '局域网设备扫描与网络抓包诊断工具箱 - Wireshark/Nmap',
      seoKeywords: '网络故障诊断,局域网扫描,Wireshark,Nmap,Angry IP Scanner,端口排查',
      seoDescription: '从 IP 冲突探测、端口扫描到 Wireshark 数据包协议分析，掌握计算机网络排障核心手段。',
      softwareSlugs: ['wireshark', 'nmap', 'angry-ip-scanner', 'advanced-ip-scanner', 'putty'],
    },
    {
      slug: 'printer-driver-setup-guide',
      title: '打印机驱动安装配置与常见打印故障排障',
      description: '涵盖 USB 直连、局域网共享与网络打印机 IP 端口手动配置，彻底攻克后台服务未运行、脱机与驱动冲突顽疾。',
      coverUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      status: TopicStatus.PUBLISHED,
      sortOrder: 6,
      seoTitle: '打印机驱动配置与脱机排障综合指南 - 软游部落',
      seoKeywords: '打印机驱动安装,局域网共享打印,打印脱机解决,Spooler服务修复',
      seoDescription: '手把手教你配置网络打印机、修复 Windows 打印后台服务报错与解决共享打印凭据认证问题。',
      softwareSlugs: ['geek-uninstaller', 'autoruns'],
    },
    {
      slug: 'remote-desktop-tools-selection',
      title: '常见跨平台远程桌面控制工具对比与选型',
      description: '摆脱限速打扰与商业广告弹窗：私有自建中继 RustDesk、超低延迟 AnyDesk 与全能终端 MobaXterm 横向测评。',
      coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      status: TopicStatus.PUBLISHED,
      sortOrder: 7,
      seoTitle: '远程桌面控制工具选型指南 - RustDesk vs AnyDesk',
      seoKeywords: '远程桌面,RustDesk自建,AnyDesk,MobaXterm,远程协助软件,无广告远控',
      seoDescription: '全面对比各类主流远程控制协议延迟、安全性与私有化部署难度，助你选出最佳协助方案。',
      softwareSlugs: ['rustdesk', 'anydesk', 'mobaxterm', 'termius'],
    },
    {
      slug: 'video-editing-screen-recording',
      title: '免费开源视频剪辑与录屏创作工具集',
      description: '自媒体与技术博主创作工作流：从高清无水印屏幕捕获（OBS/ScreenToGif）到非编多轨剪辑（Kdenlive/Shotcut/Blender）。',
      coverUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      status: TopicStatus.PUBLISHED,
      sortOrder: 8,
      seoTitle: '免费开源视频录制与非编剪辑软件推荐 - OBS/Kdenlive/HandBrake',
      seoKeywords: '开源视频剪辑,OBS Studio录屏,ScreenToGif,Kdenlive,HandBrake压制,视频创作工具',
      seoDescription: '一套零软件成本的高画质视频制作工具流，全面覆盖截屏、录屏、转码与多轨道非编创作。',
      softwareSlugs: ['obs-studio', 'screentogif', 'kdenlive', 'handbrake', 'audacity', 'shotcut'],
    },
    {
      slug: 'software-clean-uninstallation',
      title: '软件深度卸载与系统注册表残留清理',
      description: '教你如何彻底根除顽固流氓软件、清理无用注册表键值、粉碎隐私缓存，保持操作系统长期轻盈如新。',
      coverUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      status: TopicStatus.PUBLISHED,
      sortOrder: 9,
      seoTitle: '顽固软件彻底卸载与注册表残留清除实战 - Geek Uninstaller/BleachBit',
      seoKeywords: '软件彻底卸载,注册表清理,Geek Uninstaller,BleachBit,流氓软件清除,系统瘦身',
      seoDescription: '详细讲解普通卸载与强制卸载的底层差异，提供不损伤系统核心组件的科学清理步骤。',
      softwareSlugs: ['geek-uninstaller', 'bleachbit', 'autoruns'],
    },
    {
      slug: 'open-source-games-collection',
      title: '精选开源跨平台经典游戏体验',
      description: '远离内购氪金套路，重温纯粹游戏乐趣：开源红警引擎 OpenRA、太空跑商沙盒 Endless Sky 与经典像素地牢。',
      coverUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      status: TopicStatus.PUBLISHED,
      sortOrder: 10,
      seoTitle: '好玩的免费开源单机游戏推荐 - OpenRA/Endless Sky/像素地牢',
      seoKeywords: '开源游戏,免费单机游戏,OpenRA,红警开源,Endless Sky,Shattered Pixel Dungeon',
      seoDescription: '高可玩性、纯粹单机、跨平台的自由开源游戏精选，重拾经典策略与地牢探险乐趣。',
      softwareSlugs: ['openra', 'endless-sky', 'shattered-pixel-dungeon', 'warzone2100', 'mindustry', '0ad'],
    },
  ];

  for (const t of TOPICS_DATA) {
    const topic = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: {
        title: t.title,
        description: t.description,
        coverUrl: t.coverUrl,
        isFeatured: t.isFeatured,
        status: t.status,
        sortOrder: t.sortOrder,
        seoTitle: t.seoTitle,
        seoKeywords: t.seoKeywords,
        seoDescription: t.seoDescription,
        publishedAt: new Date(),
      },
      create: {
        slug: t.slug,
        title: t.title,
        description: t.description,
        coverUrl: t.coverUrl,
        isFeatured: t.isFeatured,
        status: t.status,
        sortOrder: t.sortOrder,
        seoTitle: t.seoTitle,
        seoKeywords: t.seoKeywords,
        seoDescription: t.seoDescription,
        publishedAt: new Date(),
      },
    });

    // 关联软件资源到 TopicResource
    for (let idx = 0; idx < t.softwareSlugs.length; idx++) {
      const sSlug = t.softwareSlugs[idx];
      const sw = await prisma.software.findUnique({ where: { slug: sSlug } });
      if (sw) {
        await prisma.topicResource.upsert({
          where: {
            topicId_softwareId: {
              topicId: topic.id,
              softwareId: sw.id,
            },
          },
          update: { sortOrder: idx + 1 },
          create: {
            topicId: topic.id,
            softwareId: sw.id,
            sortOrder: idx + 1,
          },
        });
      }
    }

    console.log(`✅ Topic seeded: ${t.title} (${t.slug})`);
  }

  console.log('\n--- Step 3: Seeding 20 Practical High-Value Tutorials ---');

  const TUTORIALS_DATA = [
    {
      slug: 'rufus-win11-bypass-tpm-guide',
      title: '使用 Rufus 制作绕过 TPM 2.0 与在线微软账户的 Windows 11 原版启动盘',
      softwareSlug: 'rufus',
      summary: '解决老旧电脑或无网环境下安装 Windows 11 的 TPM/Secure Boot 校验拦截，创建即插即装的纯净离线安装介质。',
      content: `### 适用场景
在不支持 TPM 2.0 或仅有 4GB 内存的老旧电脑上安装最新版 Windows 11，或希望跳过强制登录微软在线账户直接建立本地 Administrator 离线账户。

### 适用版本
- 操作系统：Windows 10 / Windows 11 (64位)
- Rufus 版本：Rufus 4.5 及以上
- 镜像要求：从微软官网下载的原版 Win11 ISO 镜像

### 准备条件
1. 准备一个容量大于 8GB 的空白 U 盘（注意：制作过程将彻底格式化该盘，请提前备份重要数据）。
2. 从微软官方网站获取正版 Windows 11 多版本 ISO 镜像文件。
3. 从软游部落下载最新稳定版 Rufus 工具。

### 实际步骤
1. **连接 U 盘并运行 Rufus**：双击启动 Rufus，在“设备”下拉列表中确认选中目标 U 盘盘符。
2. **载入官方 ISO**：点击“选择”按钮，浏览并加载已下载的原版 Windows 11 ISO 镜像。
3. **分区方案设定**：
   - 近五年新主板推荐选择“GPT”分区类型，目标系统模式为“UEFI (非 CSM)”。
   - 极老款传统 BIOS 主板请选择“MBR”分区方案。
4. **触发定制跳过弹窗**：点击底部的“开始”按钮，Rufus 将自动弹出【Windows 用户体验定制】窗口。
5. **勾选关键优化项**：
   - 勾选：*移除对 4GB+ 内存、TPM 2.0 和安全启动的要求*
   - 勾选：*移除强制使用在线 Microsoft 账户的要求*
   - 建议勾选：*创建具有名称的本地账户*，并填入想要的电脑用户名。
6. **写入安装介质**：点击确定，等待进度条走满提示“准备就绪”，即可拔出 U 盘。

### 注意事项
- 绕过 TPM 2.0 虽能顺利运行 Win11，但后续部分大型反作弊游戏（如《无畏契约》）仍可能在底层检测 TPM。
- 格式化操作不可逆，务必核对目标盘符，防止误选机械移动硬盘。

### 常见错误与解决方法
- **错误代码 0x00000005**：通常由于杀毒软件阻止写入引导扇区引起，制作时请暂时关闭第三方安全软件防护。
- **开机识别不到 U 盘**：开机连续按 F12/Del 键进入 BIOS，确认 Secure Boot 设置并优先选择 UEFI 引导项。

### 官方参考来源
- Rufus 官方文档：https://rufus.ie/zh/
- 微软 Windows 11 系统硬件规格要求：https://www.microsoft.com/zh-cn/windows/windows-11-specifications

### 更新时间
2025年9月`,
    },
    {
      slug: 'everything-advanced-search-syntax',
      title: 'Everything 高级搜索语法实战：秒级定位百 G 硬盘中的深层文件',
      softwareSlug: 'everything',
      summary: '掌握通配符、正则过滤、大小修饰符与扩展名组合查询，彻底释放 Everything 秒搜极速威力。',
      content: `### 适用场景
在拥有数百万文件的 TB 级海量硬盘中，瞬间找寻指定日期区间、特定大体积文件或深层项目代码。

### 适用版本
- 适用系统：Windows 10 / 11 (NTFS/ReFS 文件系统)
- Everything 版本：Everything 1.4 / 1.5a

### 准备条件
1. 确保以管理员权限安装 Everything 并已建立初次 NTFS 索引（通常耗时不到 3 秒）。
2. 打开“选项 - 快捷键”，推荐绑定全局热键 \`Alt + Space\` 唤出搜索窗口。

### 实际步骤
1. **限定特定驱动器与目录**：
   - 语法：\`D:\\Projects\\ *.ts\` —— 仅在 D 盘 Projects 目录下搜索所有的 TypeScript 源码文件。
2. **按文件大小区间过滤**：
   - 查找大于 1GB 的文件：\`size:>1GB\`
   - 查找 100MB 到 500MB 之间的视频：\`size:100MB..500MB ext:mp4\`
3. **按修改与创建日期排查**：
   - 查找今天修改的所有文档：\`dm:today ext:docx;xlsx;pptx\`
   - 查找上周生成的文件：\`dc:lastweek\`
4. **排除特定干扰目录**：
   - 语法：\`!node_modules !.git react\` —— 搜索包含 react 的文件，但自动排除 node_modules 和 git 缓存。
5. **精准查找空文件夹清理磁盘**：
   - 语法：\`empty: folder:\` —— 一键搜出所有无子文件的空目录。

### 注意事项
- Everything 极速原理依赖 NTFS 文件系统的 USN 日志，在 FAT32 或网络共享 NAS 映射盘上搜索需手动开启常规文件夹索引。

### 常见错误与解决方法
- **搜索不到刚存入的新文件**：右键系统托盘图标，选择“强制重建索引”，并在设置中勾选“启用 USN 日志自动更新”。

### 官方参考来源
- Voidtools 官方高级搜索语法手册：https://www.voidtools.com/support/everything/searching/

### 更新时间
2025年8月`,
    },
    {
      slug: 'crystaldiskinfo-smart-health-check',
      title: 'SSD 固态硬盘寿命与 S.M.A.R.T. 关键故障指标解读指南',
      softwareSlug: 'crystaldiskinfo',
      summary: '手把手教你看懂 CrystalDiskInfo 健康度百分比、05/0E 致命坏块报错与温度过热预警。',
      content: `### 适用场景
排查电脑莫名蓝屏死机、游戏掉帧加载卡死，或验机二手笔记本固态硬盘磨损程度。

### 适用版本
- 操作系统：Windows 10 / 11
- CrystalDiskInfo 版本：9.5.0 及以上
- 适用介质：NVMe M.2 SSD、SATA SSD、机械移动硬盘

### 准备条件
1. 下载并解压 CrystalDiskInfo 绿色版，右键以管理员身份运行。
2. 确保在主界面菜单【功能 - 高级特征 - 原始值】中切换为【10 [DEC]】十进制显示，便于直观阅读数值。

### 实际步骤
1. **查看全局健康状态与综合评分**：
   - 蓝色【良好】：固态剩余寿命充足，S.M.A.R.T. 关键属性正常。
   - 黄色【警告】：已有坏块或备用块正在消耗，需立即备份核心数据。
   - 红色【严重不良】：主控或闪存颗粒即将损坏，严禁写入新数据。
2. **核验 NVMe 固态最关键的三大属性**：
   - **03 可用备用空间 (Available Spare)**：正常应为 100%，若跌破阈值（通常 10%）即触发报警。
   - **05 已用寿命百分比 (Percentage Used)**：根据 TBW 写入量消耗递增，达 100% 说明已超过标称保修写入寿命。
   - **0E 媒介和数据完整性错误 (Media Errors)**：**该项必须为 0**！一旦大于 0，说明闪存已发生物理级不可逆读取错误。
3. **核验机械硬盘关键指标**：
   - **05 重新分配扇区数**：大于 0 意味着盘片已出现物理坏道，磁头已将坏扇区重映射到备用区。
   - **C5 当前待映射扇区数**：不稳定扇区，需使用专业工具低格或更换。

### 注意事项
- 温度过高（长期超过 70℃）会大幅加速固态颗粒老化与主控降速，应及时加装 M.2 金属散热马甲。

### 官方参考来源
- CrystalMark 官方 S.M.A.R.T. 规范定义：https://crystalmark.info/

### 更新时间
2025年7月`,
    },
    {
      slug: 'wireshark-http-tcp-handshake-capture',
      title: 'Wireshark 网络抓包实战：从三次握手到 HTTP 报文深度解析',
      softwareSlug: 'wireshark',
      summary: '搭建干净的抓包环境，使用过滤语法精准捕获特定 IP、端口与 HTTP 请求全过程。',
      content: `### 适用场景
接口联调排障、排查局域网 API 延迟丢包、定位局域网异常广播风暴与恶意回连。

### 适用版本
- 操作系统：Windows 10/11 x64
- 软件版本：Wireshark 4.4.x (搭配 Npcap 1.79+)

### 准备条件
1. 安装 Wireshark 时务必勾选安装官方 Npcap 驱动并勾选以管理员权限捕获网卡。
2. 关闭后台无关的高流量流媒体应用（如正在下载的迅雷、网盘），减少背景杂乱噪音包。

### 实际步骤
1. **选择正确的物理网卡**：启动 Wireshark，在网卡流量折线图列表中找到有实际起伏波动的以太网或 Wi-Fi 网卡双击进入。
2. **设置捕获前置过滤器（可选）**：
   - 只捕获指定 IP：\`host 192.168.1.100\`
   - 只捕获特定端口：\`port 8080\`
3. **设置显示过滤器精准定位（核心技能）**：
   - 过滤特定目标 HTTP 请求：\`http.request.method == "POST"\`
   - 过滤指定服务器 IP：\`ip.addr == 110.242.68.66\`
   - 过滤 TCP 握手失败与重传：\`tcp.analysis.retransmission\`
4. **追踪完整 TCP 传输流**：
   - 右键目标数据包行，选择【追踪流 - TCP 流】，Wireshark 将自动重组双向通信的完整纯文本报文，红蓝两色分别对应请求与回包。

### 注意事项
- HTTPS 流量在网络链路经过 TLS 1.3 高强度加密，若需解密 HTTPS，需在系统环境变量中配置 \`SSLKEYLOGFILE\` 导入密钥。

### 常见错误与解决方法
- **网卡列表为空**：Npcap 服务未启动，在管理员 PowerShell 下执行 \`net start npcap\` 即可修复。

### 官方参考来源
- Wireshark 官方用户指南：https://www.wireshark.org/docs/wsug_html_chunked/

### 更新时间
2025年6月`,
    },
    {
      slug: 'sysinternals-autoruns-clean-startup',
      title: '使用 Sysinternals Autoruns 地毯式清理 Windows 开机自启流氓项',
      softwareSlug: 'autoruns',
      summary: '揭开隐藏在注册表深处、服务、外壳扩展与计划任务中的顽固开机常驻程序，还原纯净秒开桌面。',
      content: `### 适用场景
电脑开机变慢、进桌面卡死转圈数分钟，或常规任务管理器找不到自启源头的隐蔽广告弹窗。

### 适用版本
- 操作系统：Windows 10 / 11
- 工具版本：Sysinternals Autoruns 14.11 及以上

### 准备条件
1. 从软游部落下载官方 Autoruns 绿色单文件，右键选择【以管理员身份运行】（必须管理员权限才能读取系统级底层键值）。
2. 在顶部菜单点击【Options】，确保勾选【Hide Microsoft Entries】（隐藏微软官方系统项），防止误删系统核心服务。

### 实际步骤
1. **查看普通登录启动项 (Logon 选项卡)**：
   - 此处对应注册表 \`Run\` / \`RunOnce\` 键。查看厂商（Publisher）一栏，对可疑未签名的更新器或广告助手取消勾选。
2. **查看隐藏的计划任务 (Scheduled Tasks 选项卡)**：
   - 很多流氓软件通过计划任务定时唤醒后台进程，在此选项卡中可清晰看到触发时机与对应可执行文件路径。
3. **查看驱动与外壳扩展 (Explorer / Drivers 选项卡)**：
   - 鼠标右键菜单卡顿通常由第三方失效的 ContextMenu 扩展导致，在此处可安全禁用异常 DLL。
4. **利用 VirusTotal 云端查毒**：
   - 点击菜单【Options - Scan VirusTotal.com】，Autoruns 将自动计算各启动项的 SHA-256 并查询全球 70+ 款杀毒引擎比对结果。

### 注意事项
- 取消勾选仅是临时禁用自启，若确认属于流氓垃圾，可在该行右键直接选择【Delete】永久剔除。

### 官方参考来源
- Microsoft Sysinternals 官方下载与技术专栏：https://learn.microsoft.com/en-us/sysinternals/

### 更新时间
2025年5月`,
    },
    {
      slug: 'geek-uninstaller-clean-remnants',
      title: '使用 Geek Uninstaller 彻底卸载软件与残留文件/注册表清理',
      softwareSlug: 'geek-uninstaller',
      summary: '告别常规控制面板卸载不干净的残留痛点，一键扫描注册表死键与 AppData 缓存孤岛。',
      content: `### 适用场景
重新安装软件报错提示“已安装更高版本”、卸载后磁盘空间未释放，或控制面板无法正常卸载的顽固软件。

### 适用版本
- 操作系统：Windows 7 / 10 / 11
- 软件版本：Geek Uninstaller 1.5 及以上

### 准备条件
1. 下载解压单文件 Geek.exe，即点即用无需安装。

### 实际步骤
1. **正常卸载并追踪残留**：
   - 在列表中双击目标软件，先调用软件自带的标准卸载向导完成常规卸载。
2. **执行深度扫描**：
   - 自带卸载完成后，Geek 会自动启动后台扫描引擎，地毯式搜索注册表中所有带有该软件标识的 CLSID、键值，以及 \`%AppData%\`、\`%LocalAppData%\`、\`ProgramData\` 目录下的关联文件夹。
3. **一键粉碎残留**：
   - 弹出“发现残留痕迹”清单后，勾选全部项，点击【完成】即可彻底抹除全部遗留垃圾。
4. **针对顽固损坏程序的【强制删除】模式**：
   - 若软件已损坏导致自带卸载程序闪退，可在软件条目上右键选择【强制删除】，Geek 将绕过内置卸载程序直接暴力粉碎其磁盘文件与注册表节点。

### 注意事项
- 清理 Windows 预装 UWP 应用时，切勿随意强制卸载 Microsoft Store（应用商店）核心组件。

### 官方参考来源
- Geek Uninstaller 官网：https://geekuninstaller.com

### 更新时间
2025年4月`,
    },
    {
      slug: 'obs-studio-game-recording-settings',
      title: 'OBS Studio 高清 60FPS 游戏录屏与硬件编码参数最佳调优',
      softwareSlug: 'obs-studio',
      summary: '告别录像卡顿掉帧与画面发糊，合理配置 NVIDIA NVENC/AMD AMF 编码器与比特率。',
      content: `### 适用场景
制作高清游戏实况视频、录制高刷教程，追求高画质与低系统资源占用的平衡。

### 适用版本
- 操作系统：Windows 10/11 x64
- OBS Studio 版本：30.2 及以上

### 准备条件
1. 确保显卡驱动已更新至最新稳定版。
2. 以管理员权限运行 OBS Studio（有助于 Windows 优先调度 GPU 资源）。

### 实际步骤
1. **视频基础画布设定**：
   - 打开【设置 - 视频】，基础（画布）分辨率设为显示器原生分辨率（如 1920x1080 或 2560x1440）。
   - 输出（缩放）分辨率：与画布一致，下采样滤镜选择“Lanczos (36个样本)”。
   - 常用 FPS 值选定为“60”。
2. **输出模式与编码器选择**：
   - 切换到【输出】标签，将顶部输出模式改为【高级】，切换到【录像】标签页。
   - 录像格式选择 **MKV** 或 **分段 MP4**（即使录制中断死机文件也不会损坏）。
   - 视频编码器：优先选择 **NVIDIA NVENC H.264** 或 **HEVC (H.265)**，避免占用宝贵的 CPU 核心。
3. **速率控制与码率配置**：
   - 速率控制：推荐选择 **CQC (恒定质量)** 或 **CBR (恒定码率)**。
   - 若选择 CQC：质量级别 CQ 设为 18~20（数字越小画质越高）。
   - 若选择 CBR：1080P 60 帧推荐码率设为 12000 Kbps；2K 60 帧推荐 25000 Kbps。
4. **添加游戏捕获源**：
   - 在来源面板点击【+】，添加【游戏捕获】，模式选择“捕获特定窗口”以杜绝录入私人桌面弹窗。

### 注意事项
- 切勿直接录制普通 MP4 格式，一旦录制途中遇停电或蓝屏，整个 MP4 文件将永久损坏不可播放。

### 官方参考来源
- OBS Studio 官方快速配置指南：https://obsproject.com/wiki/

### 更新时间
2025年8月`,
    },
    {
      slug: 'rustdesk-self-hosted-relay-guide',
      title: 'RustDesk 自建私有中继服务器教程：打造专属无限制远控工作流',
      softwareSlug: 'rustdesk',
      summary: '使用 Docker 一键搭建 RustDesk ID/Relay 专属中继，实现真 1080P/60FPS 局域网与公网极速直连。',
      content: `### 适用场景
远程连接异地办公电脑、协助亲友调试系统，摆脱商业远控软件高昂年费与高峰期画质限速。

### 适用版本
- 服务端：Linux / Docker 环境
- 客户端：Windows 10/11、macOS、Android

### 准备条件
1. 一台拥有公网 IP 的云服务器（1核 1G 带宽 3M+ 即可满足多人同时连接）。
2. 云服务器防火墙安全组开放 21115 至 21119 端口（TCP/UDP）。

### 实际步骤
1. **服务端 Docker Compose 一键启动**：
   创建 \`docker-compose.yml\`：
   \`\`\`yaml
   version: '3'
   services:
     hbbs:
       image: rustdesk/rustdesk-server:latest
       container_name: hbbs
       command: hbbs -r YOUR_SERVER_IP:21117
       volumes:
         - ./data:/root
       network_mode: "host"
       restart: unless-stopped
     hbbr:
       image: rustdesk/rustdesk-server:latest
       container_name: hbbr
       volumes:
         - ./data:/root
       network_mode: "host"
       restart: unless-stopped
   \`\`\`
   执行 \`docker compose up -d\` 启动。
2. **提取公钥 Key**：
   进入 \`./data\` 目录，查看 \`id_ed25519.pub\` 文件内容，该字符串即为通信公钥 Key。
3. **客户端配置私有服务器**：
   - 打开 Windows 客户端，点击 ID 旁边的菜单图标，进入【网络 - ID/中继服务器】。
   - 【ID 服务器】：填写你的服务器公网 IP。
   - 【中继服务器】：填写你的服务器公网 IP:21117。
   - 【Key】：填入提取出的公钥字符串。
4. **测试直连效果**：
   主控端与受控端均填入相同服务器配置后，右下角将显示绿色小点【就绪】，输入受控端 9 位 ID 即可秒级建立无限制连接。

### 官方参考来源
- RustDesk 官方自建服务器文档：https://rustdesk.com/docs/en/self-host/

### 更新时间
2025年7月`,
    },
    {
      slug: 'git-ssh-key-github-windows-config',
      title: 'Windows 环境下 Git SSH 密钥生成与 GitHub/GitLab 快速免密连接配置',
      softwareSlug: 'git',
      summary: '告别每次推送代码弹窗输入账号密码的繁琐，基于 Ed25519 算法生成高强度安全公私钥。',
      content: `### 适用场景
新电脑初始化开发环境、克隆与推送 GitHub/Gitee/GitLab 代码仓库。

### 适用版本
- 操作系统：Windows 10 / 11
- Git 版本：Git for Windows 2.45+

### 准备条件
1. 确保已正确安装 Git for Windows 并已在桌面右键菜单可用【Open Git Bash here】。

### 实际步骤
1. **全局身份标识配置**：
   打开 Git Bash，执行：
   \`\`\`bash
   git config --global user.name "你的用户名"
   git config --global user.email "你的邮箱@example.com"
   \`\`\`
2. **生成现代高强度 Ed25519 密钥对**：
   \`\`\`bash
   ssh-keygen -t ed25519 -C "你的邮箱@example.com"
   \`\`\`
   按三次回车直接采用默认保存路径（\`~/.ssh/id_ed25519\`）且不设空密码短语。
3. **复制公钥内容**：
   \`\`\`bash
   clip < ~/.ssh/id_ed25519.pub
   \`\`\`
   此命令已将公钥自动复制到系统剪贴板。
4. **在 GitHub 绑定公钥**：
   - 登录 GitHub，点击右上角头像进入【Settings - SSH and GPG keys】。
   - 点击【New SSH Key】，粘贴剪贴板公钥并保存。
5. **连通性终极验证**：
   在终端执行：
   \`\`\`bash
   ssh -T git@github.com
   \`\`\`
   若看到 \`Hi username! You've successfully authenticated\` 即代表 SSH 配置完全成功。

### 常见错误与解决方法
- **Permission denied (publickey)**：检查 \`~/.ssh/config\` 文件是否映射了正确的 Host 和 IdentityFile。

### 官方参考来源
- GitHub Docs: Connecting to GitHub with SSH: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### 更新时间
2025年6月`,
    },
    {
      slug: '7zip-ultra-compression-parameters',
      title: '7-Zip 极限压缩率调优与多核心多线程参数实战指南',
      softwareSlug: '7zip',
      summary: '最大化压缩大型工程代码与冷数据归档，合理配置 LZMA2 字典大小与内存分配。',
      content: `### 适用场景
将数十 GB 的虚拟磁盘镜像、游戏素材或工程源码压缩打包以节省磁盘存储与网络上传带宽。

### 适用版本
- 操作系统：Windows 10 / 11 (64位)
- 软件版本：7-Zip 24.x 及以上

### 准备条件
1. 检查电脑可用物理内存容量（极限压缩需要分配数 GB 临时内存）。

### 实际步骤
1. **选择 7z 现代归档格式**：在待压缩文件上右键选择【7-Zip - 添加到压缩包】，格式选定为 **7z**。
2. **核心压缩参数调优**：
   - **压缩等级**：选定【9 - 极限压缩】。
   - **压缩算法**：选定【LZMA2】（支持现代多核 CPU 高效并行计算）。
   - **字典大小**：
     - 若内存 16GB：推荐选 **64MB** 或 **128MB**。
     - 若内存 32GB+：可选择 **256MB** 榨干压缩潜力。
   - **单词大小**：设为最高值 **273**。
3. **固实数据块大小**：
   - 设为【固实】（Solid Block），可将成千上万个代码碎片文件合并为单一数据流压缩，压缩率提升通常可达 30%~70%！
4. **多线程核心数分配**：
   - CPU 线程数填入 CPU 物理核心数（如 16 或 24），充分利用多核算力加速。

### 注意事项
- 字典大小并非越大越好，过大的字典会导致低配置解压端因内存不足而报错。

### 官方参考来源
- 7-Zip 官方参数手册：https://www.7-zip.org/

### 更新时间
2025年5月`,
    },
  ];

  // 补充至 20 篇高质量教程
  const EXTRA_10_TUTORIALS = [
    {
      slug: 'putty-winscp-ssh-keys-workflow',
      title: 'PuTTY + WinSCP 联动：使用 SSH 密钥免密登录与文件极速同步',
      softwareSlug: 'putty',
      summary: '配置 PuTTYgen 转换 OpenSSH 密钥，使用 WinSCP 双栏可视化拖拽同步代码至 Linux 服务器。',
      content: `### 适用场景\nWindows 下开发，高效安全管理与传输远程 Linux 服务器资产。\n### 适用版本\nWindows 10/11, PuTTY 0.82+, WinSCP 6.3+\n### 实际步骤\n1. 使用 PuTTYgen 将 id_ed25519 转换为 ppk 私钥。\n2. WinSCP 站点高级设置中指定密钥路径。\n3. 点击直接启动配套 PuTTY 终端。\n### 更新时间\n2025年4月`,
    },
    {
      slug: 'libreoffice-ms-office-compatibility',
      title: 'LibreOffice 深度调优：解决与微软 Office (DOCX/XLSX) 字体与排版错乱',
      softwareSlug: 'libreoffice',
      summary: '安装常用中文字体库、设置默认保存格式为 Office OpenXML，实现跨办公软件无缝协同。',
      content: `### 适用场景\n在不购买 Office 授权的前提下，完美阅读与编辑外部发来的复杂排版文档。\n### 适用版本\nLibreOffice 24.8+\n### 实际步骤\n1. 安装微软雅黑、仿宋等标准字体。\n2. 在选项中将默认存储格式修改为 DOCX/XLSX。\n3. 开启硬件加速渲染。\n### 更新时间\n2025年5月`,
    },
    {
      slug: 'obsidian-second-brain-knowledge-workflow',
      title: '从零构建 Obsidian 第二大脑：基于本地 Markdown 的双链知识管理',
      softwareSlug: 'obsidian',
      summary: '告别数据锁死与云厂商跑路，利用双向链接、白板 Canvas 与 Dataview 搭建个人知识网。',
      content: `### 适用场景\n个人读书笔记、日常工作日志、技术架构文档归档。\n### 适用版本\nObsidian 1.7+\n### 实际步骤\n1. 新建本地 Vault 保存在独立磁盘分区。\n2. 学习 [[]] 核心双链语法。\n3. 配置 Git 自动化定时备份工作流。\n### 更新时间\n2025年6月`,
    },
    {
      slug: 'screentogif-tutorial-frame-editing',
      title: 'ScreenToGif 录制教学 GIF 实战：逐帧裁剪、光标高亮与体积极限压缩',
      softwareSlug: 'screentogif',
      summary: '录制清爽无水印的软件操作说明动图，控制在 5MB 以内便于网页与文档快速加载。',
      content: `### 适用场景\n技术博客配图、GitHub 仓库 README 动图展示、产品需求演示。\n### 适用版本\nScreenToGif 2.41+\n### 实际步骤\n1. 选定录制区域与帧率 (推荐 20~24 FPS)。\n2. 在编辑器中剔除无意义的静止帧。\n3. 使用高光圈高亮鼠标按键动作并导出。\n### 更新时间\n2025年7月`,
    },
    {
      slug: 'handbrake-video-compression-av1-hevc',
      title: 'HandBrake 视频压制神器：将数 G 视频无损体积瘦身 80% 的参数配置',
      softwareSlug: 'handbrake',
      summary: '基于 NVENC 硬件加速与 H.265/AV1 现代编解码器，轻松压缩录播与无人机 4K 素材。',
      content: `### 适用场景\n手机空间不足、网盘上传缓慢，批量压缩家庭录像与会议录像。\n### 适用版本\nHandBrake 1.8+\n### 实际步骤\n1. 导入大体积视频源文件。\n2. 预设选择 Production Standard 或 Web 1080p。\n3. 视频编码器选择 H.265 10-bit，RF 质量滑块设为 22。\n### 更新时间\n2025年6月`,
    },
    {
      slug: 'bleachbit-windows-deep-clean-privacy',
      title: 'BleachBit 开源深度清理实战：彻底清除软件残留与浏览器深层跟踪隐私',
      softwareSlug: 'bleachbit',
      summary: '安全释放被 Windows 临时日志与各应用缓存霸占的数十 G 空间，内置防恢复文件粉碎机。',
      content: `### 适用场景\n系统 C 盘飘红报警、二手电脑转让前安全抹除私人运行轨迹。\n### 适用版本\nBleachBit 4.6+\n### 实际步骤\n1. 以管理员权限启动 BleachBit。\n2. 勾选系统临时文件、回收站、内存转储及各浏览器缓存。\n3. 点击【预览】核对清理清单后点击【清理】。\n### 更新时间\n2025年5月`,
    },
    {
      slug: 'ventoy-custom-multiboot-usb',
      title: 'Ventoy 进阶玩法：个性化主题定制、自动应答安装与多系统启动菜单配置',
      softwareSlug: 'ventoy',
      summary: '打造专业技术人员的多合一系统启动盘，支持直接引导 Win11、Ubuntu、PE 并在启动界面展示专属 Logo。',
      content: `### 适用场景\n装机售后技术员、多系统极客测试各类 Linux 发行版与 Windows 原版镜像。\n### 适用版本\nVentoy 1.0.99+\n### 实际步骤\n1. 在 U 盘根目录建立 ventoy 文件夹并配置 ventoy.json。\n2. 将下载的 GRUB 主题放入 themes 目录。\n3. 直接将各种 ISO 镜像丢进 U 盘即可开机随意引导。\n### 更新时间\n2025年7月`,
    },
    {
      slug: 'dbeaver-sql-database-management-workflow',
      title: 'DBeaver 数据库实战：从连接 PostgreSQL 到可视化 ER 图设计与 SQL 优化',
      softwareSlug: 'dbeaver',
      summary: '一款通用客户端搞定本地与生产数据库管理，支持执行计划分析与批量数据导入导出。',
      content: `### 适用场景\n全栈开发、后端运维，统一管理 Postgres、MySQL 与 SQLite。\n### 适用版本\nDBeaver 24.3+\n### 实际步骤\n1. 新建连接选择 PostgreSQL，填入主机端口与凭据。\n2. 打开 SQL 编辑器享受智能代码高亮与自动补全。\n3. 右键架构图查看完整的表实体关系 ER 图。\n### 更新时间\n2025年8月`,
    },
    {
      slug: 'openra-red-alert-multiplayer-setup',
      title: 'OpenRA 经典红警现代体验：高分屏 4K 宽屏适配与局域网多人对战指南',
      softwareSlug: 'openra',
      summary: '用现代化 RTS 操控手感重温《红色警戒95》，解决原版老游戏在 Win11 下黑屏闪退与联机卡顿。',
      content: `### 适用场景\n怀旧玩家重温红警经典战役与基友局域网 / 互联网联机切磋。\n### 适用版本\nOpenRA 20241215+\n### 实际步骤\n1. 安装 OpenRA 客户端，自动从官方镜像获取免费声音素材。\n2. 调整视口缩放与 4K 高分辨率宽屏视角。\n3. 点击【多人游戏】一键加入社区自建房间对战。\n### 更新时间\n2025年6月`,
    },
    {
      slug: 'sumatrapdf-ebook-mobi-epub-reading',
      title: 'SumatraPDF 极简阅读指南：快捷键翻页、黑底护眼模式与全格式轻量查看',
      softwareSlug: 'sumatrapdf',
      summary: '秒开数百兆技术文档手册，支持自定义快捷键、反色夜间阅读与双页平铺模式。',
      content: `### 适用场景\n阅读大型技术白皮书、ePub 电子书、漫画 CBR 格式。\n### 适用版本\nSumatraPDF 3.5+\n### 实际步骤\n1. 打开软件按 Ctrl+K 唤出高级设置。\n2. 配置 TextColor 与 BackgroundColor 开启护眼模式。\n3. 按 F11 进入纯净全屏沉浸式阅读。\n### 更新时间\n2025年5月`,
    },
  ];

  const ALL_TUTORIALS = [...TUTORIALS_DATA, ...EXTRA_10_TUTORIALS];

  for (const tut of ALL_TUTORIALS) {
    let swId: string | null = null;
    if (tut.softwareSlug) {
      const sw = await prisma.software.findUnique({ where: { slug: tut.softwareSlug } });
      if (sw) swId = sw.id;
    }

    await prisma.tutorial.upsert({
      where: { slug: tut.slug },
      update: {
        title: tut.title,
        summary: tut.summary,
        content: tut.content,
        softwareId: swId,
        authorId,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        seoTitle: `${tut.title} - 软游部落实操教程`,
        seoKeywords: `${tut.title.slice(0, 20)},软件教程,操作指南,系统维护`,
        seoDescription: tut.summary,
      },
      create: {
        slug: tut.slug,
        title: tut.title,
        summary: tut.summary,
        content: tut.content,
        softwareId: swId,
        authorId,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        seoTitle: `${tut.title} - 软游部落实操教程`,
        seoKeywords: `${tut.title.slice(0, 20)},软件教程,操作指南,系统维护`,
        seoDescription: tut.summary,
      },
    });

    console.log(`✅ Tutorial seeded: ${tut.title} (${tut.slug})`);
  }

  const finalTopics = await prisma.topic.count();
  const finalTutorials = await prisma.tutorial.count();
  console.log(`\nAll done! Total Topics: ${finalTopics}, Total Tutorials: ${finalTutorials}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
