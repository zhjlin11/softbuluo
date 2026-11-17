const fs = require('fs');
const inv = require('../published_inventory.json');

// Helper to escape CSV cell
function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
  return `"${str}"`;
}

function generateAuditList() {
  const rows = [];
  const headers = [
    '序号',
    '页面URL',
    '页面类型',
    '内容名称',
    '当前标题',
    '当前描述',
    'H1',
    '正文完整程度',
    '内容唯一性',
    '核心关键词',
    '搜索意图',
    '内部链接情况',
    '结构化数据类型',
    'SEO核心问题',
    'GEO与AEO核心问题',
    '具体优化建议',
    '优先级'
  ];
  rows.push(headers.map(escapeCsv).join(','));

  let index = 1;

  // 1. Process 50 Software
  for (const sw of inv.software) {
    const pageUrl = `https://softtribe.top/software/${sw.slug}`;
    const pageType = sw.type === 'TOOL' ? '系统维护工具' : sw.type === 'GAME' ? '精选游戏' : '电脑桌面软件';
    const currentTitle = `${sw.name} ${sw.latestVersion || ''} 官方下载渠道与版本信息 - ${sw.categoryName} - 软游部落`;
    const currentDesc = `${sw.summary} 软游部落提供 ${sw.name} 官方正规获取途径与版本信息，最新版本号 ${sw.latestVersion || '已核验'}，支持平台：Windows 10/11。来源清晰、规范透明。`;
    const h1 = sw.name;
    
    let completeness = '良好';
    if (sw.description.length < 80) completeness = '偏短单薄';
    else if (sw.description.length >= 150) completeness = '相对充分';

    const uniqueness = '高(具备独立官方来源与摘要)';
    const coreKeyword = `${sw.name} 官方下载, ${sw.name} Windows版, ${sw.name} 最新版`;
    const searchIntent = '下载型与导航型 (Transactional / Navigational)';
    
    // Internal links
    let internalLinks = `由 /software 与分类页 /category/${sw.categorySlug} 链接导入；导出链接至官方主页`;
    if (sw.slug === '7zip' || sw.slug === 'rufus' || sw.slug === 'autoruns' || sw.slug === 'crystaldiskinfo' || sw.slug === 'everything') {
      internalLinks += '；已关联 1 篇实操深度教程';
    }

    const structuredData = 'SoftwareApplication (Schema.org) + BreadcrumbList';

    // Issues
    const seoIssues = [];
    const geoIssues = [];
    let priority = 'P2';

    // Global Nginx SSR proxy issue applies to all detail pages
    seoIssues.push('Nginx未配置详情页SSR反代，爬虫直接访问回退至SPA首页index.html');
    priority = 'P0'; // Nginx routing blocks crawler indexing!

    if (sw.activeSourcesCount === 0) {
      seoIssues.push('缺少可用官方下载直链/发布页链接(活跃来源为0)');
      geoIssues.push('实体下载来源缺失，AI与用户无法获取真实安装包');
      priority = 'P0';
    }

    if (sw.description.length < 100) {
      seoIssues.push('正文功能说明偏短，长尾词覆盖不足');
      geoIssues.push('缺乏系统硬件要求、详细特性清单与FAQ问答块');
    }

    if (!sw.developer) {
      geoIssues.push('开发者实体信息缺失');
    }

    geoIssues.push('缺乏面向AI回答的直接定义块(What is / How to)、无显式问答结构');

    const recs = [];
    recs.push('1. 修复Nginx反代规则将/software/*穿透至Fastify SSR；');
    if (sw.activeSourcesCount === 0) {
      recs.push('2. 补充或激活官方安全下载渠道/发布页；');
    }
    recs.push('3. 扩充正文内容至300字以上，增加系统要求配置表与安装避坑指引；');
    recs.push('4. 嵌入 3 个常见问题 FAQ 结构化数据 (FAQPage Schema)；');
    recs.push('5. 关联相关实操教程形成双向内链权重传递。');

    rows.push([
      index++,
      pageUrl,
      pageType,
      sw.name,
      currentTitle,
      currentDesc,
      h1,
      completeness,
      uniqueness,
      coreKeyword,
      searchIntent,
      internalLinks,
      structuredData,
      seoIssues.join('; '),
      geoIssues.join('; '),
      recs.join(' '),
      priority
    ].map(escapeCsv).join(','));
  }

  // 2. Process 27 Tutorials
  for (const tut of inv.tutorials) {
    const pageUrl = `https://softtribe.top/tutorials/${tut.slug}`;
    const pageType = '实操技术教程';
    const currentTitle = tut.seoTitle || `${tut.title} - 电脑软件与系统实操技术指南 - 软游部落`;
    const currentDesc = tut.seoDescription || tut.summary;
    const h1 = tut.title;

    let completeness = '充分';
    let uniqueness = '高(具备独立实操步骤)';
    let priority = 'P2';
    const seoIssues = [];
    const geoIssues = [];

    seoIssues.push('Nginx未配置教程详情页SSR反代，爬虫直接访问回退至SPA首页index.html');
    priority = 'P0'; // Nginx routing blocks crawler indexing!

    if (tut.contentLength <= 30) {
      completeness = '极薄占位符(<=30字)';
      uniqueness = '低(仅为标题与占位文本)';
      seoIssues.push('文章内容严重缺失(正文仅十余字占位符)，属于典型薄内容');
      geoIssues.push('AI抓取时判定为无价值空页面，无法提取任何实体或操作步骤');
      priority = 'P0';
    } else if (tut.contentLength < 250) {
      completeness = '偏短单薄(100-250字)';
      uniqueness = '中等';
      seoIssues.push('正文篇幅偏短，缺乏细化操作截图与参数展开');
      geoIssues.push('缺乏完整的背景、版本、步骤、注意事项结构化闭环');
      if (priority !== 'P0') priority = 'P1';
    }

    // Check broken link to draft software
    const draftSoftwareLinked = ['wireshark', 'obs-studio', 'git', 'putty', 'libreoffice', 'obsidian', 'dbeaver', 'openra'];
    if (tut.softwareSlug && draftSoftwareLinked.includes(tut.softwareSlug)) {
      seoIssues.push(`关联软件【${tut.softwareSlug}】目前为草稿状态，用户点击跳转产生404死链`);
      geoIssues.push('引用未公开实体作为权威软件入口，降低知识可信度');
      priority = 'P0';
    }

    const coreKeyword = tut.seoKeywords || `${tut.title.slice(0, 20)}, 教程, Windows系统`;
    const searchIntent = '信息与解决问题型 (Informational / How-To)';
    const internalLinks = tut.softwareSlug ? `链接至关联软件 /software/${tut.softwareSlug}；由 /tutorials 列表页导入` : '由 /tutorials 列表页导入；未关联具体软件';
    const structuredData = 'TechArticle (Schema.org) + BreadcrumbList';

    geoIssues.push('缺乏明确的作者实名/编辑审校认证说明、缺少直接可引用的TL;DR核心答案摘要');

    const recs = [];
    recs.push('1. 修复Nginx反代规则将/tutorials/*穿透至Fastify SSR；');
    if (tut.contentLength <= 30) {
      recs.push('2. 必须重写补齐完整实操步骤(800字以上)，包含环境、准备、图文步骤与避坑；');
    } else if (tut.contentLength < 250) {
      recs.push('2. 扩充正文至600字以上，补充实际操作截图、命令行参数与报错自愈方案；');
    }
    if (tut.softwareSlug && draftSoftwareLinked.includes(tut.softwareSlug)) {
      recs.push(`3. 尽快审核发布关联软件【${tut.softwareSlug}】或暂时移除前台跳转死链；`);
    }
    recs.push('4. 顶部增加【一句话核心答案/操作速览】便于Perplexity/Kimi等AI引擎直接提取引用；');
    recs.push('5. 增补 HowTo 结构化数据 (HowTo Schema) 标注关键步骤。');

    rows.push([
      index++,
      pageUrl,
      pageType,
      tut.title,
      currentTitle,
      currentDesc,
      h1,
      completeness,
      uniqueness,
      coreKeyword,
      searchIntent,
      internalLinks,
      structuredData,
      seoIssues.join('; '),
      geoIssues.join('; '),
      recs.join(' '),
      priority
    ].map(escapeCsv).join(','));
  }

  // Write with UTF-8 BOM
  fs.writeFileSync('docs/77项正式内容逐页审计清单.csv', '\uFEFF' + rows.join('\n'), 'utf-8');
  console.log('✅ Generated docs/77项正式内容逐页审计清单.csv (77 items + header)');
}

function generateKeywordMapping() {
  const rows = [];
  const headers = [
    '序号',
    '关键词分组',
    '目标主关键词',
    '目标长尾关键词',
    '对应页面URL',
    '页面标题',
    '搜索意图类别',
    '当前意图覆盖度',
    '目标用户核心痛点',
    '建议内链来源页面',
    '优化动作与内容增补建议'
  ];
  rows.push(headers.map(escapeCsv).join(','));

  let index = 1;

  const keywordMap = [
    // 1. 软件名称与版本关键词
    {
      group: '软件名称和版本关键词',
      kw: '7-Zip 官方下载 64位',
      longtail: '7-Zip 24.09 官网下载, 7-Zip 最新版 Windows11',
      url: 'https://softtribe.top/software/7zip',
      title: '7-Zip 官方下载渠道与版本信息 - 软游部落',
      intent: '交易与下载型 (Transactional)',
      coverage: '充分',
      pain: '不想使用带弹窗广告的商业解压全家桶，寻找纯净开源高压缩比工具',
      sources: '首页推荐位, /software 列表, /tutorials/7zip-ultra-compression-parameters',
      action: '在SSR页面强化24.09版本发布日志、SHA-256校验值及x64直链醒目标记'
    },
    {
      group: '软件名称和版本关键词',
      kw: 'Rufus 启动盘制作工具官网下载',
      longtail: 'Rufus 最新版 4.5, Rufus 制作 Win11 安装U盘',
      url: 'https://softtribe.top/software/rufus',
      title: 'Rufus 启动盘制作工具 官方下载 - 软游部落',
      intent: '交易与下载型 (Transactional)',
      coverage: '充分',
      pain: '制作系统U盘遭遇流氓PE篡改主页或写入木马，寻找原厂纯净引导写入工具',
      sources: '首页推荐位, /essentials 装机必备, /tutorials/rufus-win11-bypass-tpm-guide',
      action: '突出Rufus免安装绿色版特性，强调绕过TPM2.0/微软账户的独家功能'
    },
    {
      group: '软件名称和版本关键词',
      kw: 'Everything 快速文件搜索工具',
      longtail: 'Everything 64位下载, Everything 绿色版官网',
      url: 'https://softtribe.top/software/everything',
      title: 'Everything 快速文件搜索工具 官方下载 - 软游部落',
      intent: '交易与下载型 (Transactional)',
      coverage: '充分',
      pain: 'Windows自带搜索极度卡顿缓慢，无法秒级检索深层文件',
      sources: '/software 列表, /essentials 装机必备, /tutorials/everything-advanced-search-syntax',
      action: '补充NTFS快速索引原理简介，增加与高级搜索语法教程的深度联动'
    },
    {
      group: '软件名称和版本关键词',
      kw: 'Snipaste 截图贴图神器下载',
      longtail: 'Snipaste 官网免安装版, Snipaste 贴图快捷键',
      url: 'https://softtribe.top/software/snipaste',
      title: 'Snipaste 截图贴图神器 官方下载 - 软游部落',
      intent: '交易与下载型 (Transactional)',
      coverage: '部分',
      pain: '需要将多张截图置顶悬浮于桌面对照查阅，普通截图软件无法贴图',
      sources: '首页热门榜, /software 办公工具分类',
      action: '补充F1截图/F3贴图的核心操作演示，增加免费版与专业版功能差异对比'
    },
    {
      group: '软件名称和版本关键词',
      kw: 'Sysinternals Process Explorer 官方下载',
      longtail: 'Process Explorer 微软官方下载, Win11 进阶任务管理器',
      url: 'https://softtribe.top/software/process-explorer',
      title: 'Sysinternals Process Explorer 官方下载 - 软游部落',
      intent: '交易与下载型 (Transactional)',
      coverage: '部分',
      pain: '文件被占无法删除不知哪个进程在占用，任务管理器杀不掉深层隐藏句柄',
      sources: '/system-tools 列表, /topics/windows-sysinternals-guide',
      action: '详细介绍Find Handle功能，提供VirusTotal集成一键查毒的实操说明'
    },
    {
      group: '软件名称和版本关键词',
      kw: 'Sysinternals Autoruns 官方下载',
      longtail: 'Autoruns 中文版使用, 彻底清除开机自启项',
      url: 'https://softtribe.top/software/autoruns',
      title: 'Sysinternals Autoruns 官方下载 - 软游部落',
      intent: '交易与下载型 (Transactional)',
      coverage: '充分',
      pain: '电脑开机极慢，常规管家软件扫描不出隐藏在计划任务和WMI中的自启恶意服务',
      sources: '/system-tools 列表, /tutorials/sysinternals-autoruns-clean-startup',
      action: '提示隐藏微软官方服务过滤器勾选方法，防小白误删系统关键引导导致蓝屏'
    },
    {
      group: '软件名称和版本关键词',
      kw: 'CrystalDiskInfo 固态硬盘检测工具',
      longtail: 'CrystalDiskInfo 官方中文版, 检测固态硬盘寿命与通电时间',
      url: 'https://softtribe.top/software/crystaldiskinfo',
      title: 'CrystalDiskInfo 官方下载 - 软游部落',
      intent: '交易与下载型 (Transactional)',
      coverage: '充分',
      pain: '新购电脑或二手硬盘需验货，检查是否为清零盘、翻新盘或存在坏道',
      sources: '/system-tools 硬件检测分类, /tutorials/crystaldiskinfo-smart-health-check',
      action: '增加SMART关键参数（05重映射扇区/0E媒体错误）图文预警阈值说明'
    },
    {
      group: '软件名称和版本关键词',
      kw: 'Geek Uninstaller 彻底卸载工具',
      longtail: 'Geek Uninstaller 免费版, 强制删除顽固软件注册表残留',
      url: 'https://softtribe.top/software/geek-uninstaller',
      title: 'Geek Uninstaller 官方下载 - 软游部落',
      intent: '交易与下载型 (Transactional)',
      coverage: '充分',
      pain: '控制面板卸载软件报错中断，卸载后残留大量注册表键值与垃圾文件',
      sources: '/system-tools 系统清理分类, /tutorials/geek-uninstaller-clean-remnants',
      action: '突出强制删除（Force Removal）功能边界，提供免安装单文件绿色版指引'
    },

    // 2. 软件用途与场景关键词
    {
      group: '软件用途关键词',
      kw: 'Windows 最佳纯净无广告解压软件推荐',
      longtail: '替代WinRAR的免费解压缩软件, 开源解压工具',
      url: 'https://softtribe.top/category/sys-tools',
      title: '系统工具与实用程序分类 - 软游部落',
      intent: '商业调查型 (Commercial Investigation)',
      coverage: '部分',
      pain: '被各类国产解压软件的锁屏新闻弹窗骚扰，寻找真正安静的解压利器',
      sources: '首页分类导航, 顶部主导航 /system-tools',
      action: '在分类页顶部增加【纯净解压工具专题导购】，横向对比 7-Zip 与 PeaZip'
    },
    {
      group: '软件用途关键词',
      kw: 'Windows 纯净长截图与录屏工具',
      longtail: '开源长截图软件, 免安装滚动截图',
      url: 'https://softtribe.top/software/sharex',
      title: 'ShareX 开源截图录屏工具 官方下载 - 软游部落',
      intent: '交易与信息型 (Transactional / Informational)',
      coverage: '部分',
      pain: '需要截取长网页或长聊天记录，常规聊天软件截图工具功能单一且画质压缩',
      sources: '/software 图像设计分类, 首页最新更新',
      action: '扩充ShareX本地保存配置与离线OCR快捷键设置说明，降低上手门槛'
    },
    {
      group: '软件用途关键词',
      kw: 'Win11 4K 极速全格式视频播放器',
      longtail: 'PotPlayer 纯净版无广告, VLC 播放器官网',
      url: 'https://softtribe.top/software/potplayer',
      title: 'PotPlayer 官方下载 - 软游部落',
      intent: '商业调查与下载型 (Commercial / Transactional)',
      coverage: '充分',
      pain: '系统自带播放器不支持MKV/HEVC编码或频繁提示购买插件，寻找全能播放器',
      sources: '/software 影音播放分类, /software/vlc 详情页替代推荐',
      action: '补充第三方解码包（LAV Filters + madVR）最佳配置方案说明'
    },

    // 3. Windows系统工具关键词
    {
      group: 'Windows系统工具关键词',
      kw: 'Win11 装机必备纯净软件清单',
      longtail: '新电脑必须安装的工具软件, 程序员 Windows 必备工具',
      url: 'https://softtribe.top/essentials',
      title: '装机必备 - 纯净高效的 Windows 常用与维护工具方案 - 软游部落',
      intent: '信息与集合型 (Informational / Collection)',
      coverage: '充分',
      pain: '刚买新电脑面对空白系统不知道装什么，担心网上搜索下载到全家桶流氓软件',
      sources: '顶部主导航 /essentials, 首页特色专题横幅',
      action: '强化“一键导出TXT/JSON装机清单”入口，针对学生、办公、极客提供场景筛选'
    },
    {
      group: 'Windows系统工具关键词',
      kw: '多系统启动U盘制作工具推荐',
      longtail: '一个U盘放多个系统镜像, Ventoy 与 Rufus 怎么选',
      url: 'https://softtribe.top/software/ventoy',
      title: 'Ventoy 新一代多系统启动 U 盘制作工具 官方下载 - 软游部落',
      intent: '商业调查与下载型 (Commercial / Transactional)',
      coverage: '充分',
      pain: '每次换系统镜像都要重新格式化U盘，希望只需将ISO拷贝进去即可引导启动',
      sources: '/essentials 维修工程师工具箱, /tutorials/ventoy-custom-multiboot-usb',
      action: '增补Ventoy与Rufus适用场景差异：多镜像选Ventoy，跳过TPM绕账户选Rufus'
    },
    {
      group: 'Windows系统工具关键词',
      kw: 'Win11 现代化终端工具美化与配置',
      longtail: 'Windows Terminal 官网下载, PowerShell 7 配合 Windows Terminal',
      url: 'https://softtribe.top/software/windows-terminal',
      title: 'Windows Terminal 官方下载 - 软游部落',
      intent: '交易与信息型 (Transactional / Informational)',
      coverage: '部分',
      pain: '传统 CMD 界面简陋、不支持标签页、中文字体渲染模糊、无法分屏',
      sources: '/system-tools 编程开发分类, /software/vscode 详情页',
      action: '补充Oh-My-Posh美化主题、Powerline字体安装与WSL2整合的快速配置代码'
    },

    // 4. 电脑故障解决关键词
    {
      group: '电脑故障解决关键词',
      kw: 'Win11 右键菜单恢复经典模式完整方法',
      longtail: 'Win11 右键显示更多选项还原, Win11 传统右键注册表',
      url: 'https://softtribe.top/tutorials',
      title: '电脑软件教程与实用技术指南 - 软游部落',
      intent: '故障排障与技术型 (Informational / How-To)',
      coverage: '待补充(拟纳入30天日历第一周)',
      pain: 'Win11新版右键菜单将解压/刷新/发送等常用功能折叠在二级菜单，极大降低工作效率',
      sources: '/tutorials 列表页置顶, 首页最新更新',
      action: '按日历发布《Win11右键菜单恢复经典模式完整指南》，关联ContextMenuManager'
    },
    {
      group: '电脑故障解决关键词',
      kw: '电脑开机蓝屏内存检测方法',
      longtail: 'MemTest86 制作U盘测试内存, 电脑频繁蓝屏死机排查',
      url: 'https://softtribe.top/software/memtest86',
      title: 'PassMark MemTest86 官方下载 - 软游部落',
      intent: '故障排障型 (Informational / How-To)',
      coverage: '部分',
      pain: '电脑不定期蓝屏死机（MEMORY_MANAGEMENT），不确定是系统损坏还是内存条硬件故障',
      sources: '/system-tools 硬件检测分类, /essentials 维修工具箱',
      action: '发布《用 MemTest86 制作纯净内存压力测试盘》实操教程，提供Pass/Fail判据'
    },
    {
      group: '电脑故障解决关键词',
      kw: 'Windows 文件被占用无法删除怎么强制解除',
      longtail: '操作无法完成因为文件已在另一程序打开, 查找占用进程',
      url: 'https://softtribe.top/software/process-explorer',
      title: 'Sysinternals Process Explorer 官方下载 - 软游部落',
      intent: '故障排障型 (Informational / How-To)',
      coverage: '部分',
      pain: '删除文件或拔出U盘时提示文件被占用，但任务管理器中看不到对应正在运行的应用',
      sources: '/system-tools 系统工具分类, /topics/windows-sysinternals-guide',
      action: '发布《文件被未知程序占用无法删除？Process Explorer 强制解锁技巧实战》教程'
    },

    // 5. 软件安装和使用教程关键词
    {
      group: '软件安装和使用教程关键词',
      kw: 'Rufus 制作绕过 TPM 2.0 Win11 启动盘教程',
      longtail: '老电脑怎么安装 Win11, Rufus 跳过在线微软账户设置',
      url: 'https://softtribe.top/tutorials/rufus-win11-bypass-tpm-guide',
      title: '使用 Rufus 制作绕过 TPM 2.0 与在线微软账户的 Windows 11 原版启动盘 - 软游部落',
      intent: '深度教程型 (Informational / How-To)',
      coverage: '充分',
      pain: '老旧电脑升级 Win11 被硬件检测拦截，或者装机过程中被强制要求联网绑定微软账户',
      sources: '/software/rufus 详情页, /essentials 频道八步教程, /tutorials 列表',
      action: '补充最新的Rufus 4.5定制选项说明，增加本地账户名称设置细节'
    },
    {
      group: '软件安装和使用教程关键词',
      kw: 'Everything 高级搜索语法技巧',
      longtail: 'Everything 搜文件内容, Everything 正则表达式搜索',
      url: 'https://softtribe.top/tutorials/everything-advanced-search-syntax',
      title: 'Everything 高级搜索语法实战：秒级定位百 G 硬盘中的深层文件 - 软游部落',
      intent: '深度教程型 (Informational / How-To)',
      coverage: '充分',
      pain: '只会搜文件名简单关键字，遇到按文件大小、修改日期或扩展名多条件组合搜索时不会写',
      sources: '/software/everything 详情页, /tutorials 列表',
      action: '增加常用搜索公式速查表（如 size:>100MB dm:today ext:zip）'
    },
    {
      group: '软件安装和使用教程关键词',
      kw: 'SSD 固态硬盘寿命与 SMART 参数解读',
      longtail: '怎么看固态硬盘健康度, 05 0E 报错代表什么',
      url: 'https://softtribe.top/tutorials/crystaldiskinfo-smart-health-check',
      title: 'SSD 固态硬盘寿命与 S.M.A.R.T. 关键故障指标解读指南 - 软游部落',
      intent: '深度教程型 (Informational / How-To)',
      coverage: '充分',
      pain: '看懂健康度百分比，但不清楚出现黄色“警告”时数据是否还有抢救时间',
      sources: '/software/crystaldiskinfo 详情页, /tutorials 列表',
      action: '提供关键备份警报建议：05/0E非零必须在24小时内迁移关键数据'
    },
    {
      group: '软件安装和使用教程关键词',
      kw: 'RustDesk 自建私有中继服务器教程',
      longtail: 'RustDesk 服务器搭建, 替代 ToDesk TeamViewer 远程桌面',
      url: 'https://softtribe.top/tutorials/rustdesk-self-hosted-relay-guide',
      title: 'RustDesk 自建私有中继服务器教程：打造专属低延迟安全远程桌面 - 软游部落',
      intent: '深度技术型 (Informational / How-To)',
      coverage: '充分',
      pain: '商业远程桌面限速、排队、设备数限制，且担心公司敏感桌面数据走第三方中继',
      sources: '/tutorials 列表, /software/rustdesk 详情页',
      action: '补充一键 Docker-Compose 部署脚本与公钥分发安全配置说明'
    },

    // 6. 软件推荐与对比关键词
    {
      group: '软件推荐与对比关键词',
      kw: '开源免费视频压制工具推荐',
      longtail: 'HandBrake 压缩视频画质设置, AV1 编码压制教程',
      url: 'https://softtribe.top/software/handbrake',
      title: 'HandBrake 官方下载 - 软游部落',
      intent: '商业调查与技术型 (Commercial / Informational)',
      coverage: '部分',
      pain: '手机拍摄的 4K 视频体积巨大（数 GB），上传网盘或分享时太慢，希望无损高质量瘦身',
      sources: '/software 影音播放分类, /tutorials/handbrake-video-compression-av1-hevc',
      action: '在详情页增加RF质量参数推荐指南（1080p推荐RF20-22，4K推荐RF24-26）'
    },
    {
      group: '软件推荐与对比关键词',
      kw: '轻量秒开 PDF 阅读器推荐',
      longtail: '替代 Adobe Acrobat 的轻量 PDF, Sumatra PDF 快捷键',
      url: 'https://softtribe.top/software/sumatrapdf',
      title: 'Sumatra PDF 官方下载 - 软游部落',
      intent: '商业调查与下载型 (Commercial / Transactional)',
      coverage: '部分',
      pain: '商业 PDF 阅读器体积巨大（数百 MB）、启动卡顿且频繁提示购买会员转换器',
      sources: '/system-tools 办公辅助分类, /tutorials/sumatrapdf-ebook-mobi-epub-reading',
      action: '突出其支持EPUB/MOBI/CBZ等电子书特质，推荐给文献阅读者与学生党'
    }
  ];

  for (const item of keywordMap) {
    rows.push([
      index++,
      item.group,
      item.kw,
      item.longtail,
      item.url,
      item.title,
      item.intent,
      item.coverage,
      item.pain,
      item.sources,
      item.action
    ].map(escapeCsv).join(','));
  }

  // Write with UTF-8 BOM
  fs.writeFileSync('docs/关键词与页面映射表.csv', '\uFEFF' + rows.join('\n'), 'utf-8');
  console.log('✅ Generated docs/关键词与页面映射表.csv (22 core strategic keywords + header)');
}

generateAuditList();
generateKeywordMapping();
