import { PrismaClient, ResourceStatus, ResourceType, Role, SourceType, UserStatus, VerificationStatus } from '@prisma/client';
import { hashPassword } from '../src/utils/security';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始初始化软游部落数据库数据...');

  // 1. 初始化 10 大核心分类
  const categories = [
    { name: '办公软件', slug: 'office', description: '文档排版、电子表格与高效协同办公套件', icon: 'FileText', sortOrder: 1 },
    { name: '系统工具', slug: 'sys-tools', description: 'Windows 优化、注册表维护与系统启动管理', icon: 'Settings', sortOrder: 2 },
    { name: '网络工具', slug: 'network', description: '网络抓包、测速诊断、端口分析与远程协助', icon: 'Wifi', sortOrder: 3 },
    { name: '硬件检测', slug: 'hardware', description: 'CPU、显卡、内存与硬盘健康状态深度检测', icon: 'Cpu', sortOrder: 4 },
    { name: '图像设计', slug: 'graphic', description: '开源三维建模、矢量绘图与图像处理工具', icon: 'Palette', sortOrder: 5 },
    { name: '影音播放', slug: 'media', description: '全格式音频与高清视频播放器、转码压缩工具', icon: 'PlaySquare', sortOrder: 6 },
    { name: '编程开发', slug: 'dev', description: '代码编辑器、终端环境与版本控制系统', icon: 'Code2', sortOrder: 7 },
    { name: '驱动程序', slug: 'drivers', description: '显卡驱动、声卡网卡与常用外设支持工具', icon: 'Layers', sortOrder: 8 },
    { name: '单机游戏', slug: 'games', description: '开源独立游戏、经典单机与官方正版平台入口', icon: 'Gamepad2', sortOrder: 9 },
    { name: '安全工具', slug: 'security', description: '安全查杀、系统备份还原与急救维护利器', icon: 'ShieldCheck', sortOrder: 10 },
  ];

  const catMap = new Map<string, string>();
  for (const cat of categories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, icon: cat.icon, sortOrder: cat.sortOrder },
      create: { name: cat.name, slug: cat.slug, description: cat.description, icon: cat.icon, sortOrder: cat.sortOrder, isVisible: true },
    });
    catMap.set(cat.slug, record.id);
  }
  console.log(`✅ 已就绪 ${categories.length} 个核心分类`);

  // 2. 初始化管理员账号 (admin@softbuluo.com / Admin@123456)
  const adminEmail = 'admin@softbuluo.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  let adminId = '';
  if (!existingAdmin) {
    const pwdHash = await hashPassword('Admin@123456');
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        username: 'superadmin',
        passwordHash: pwdHash,
        role: Role.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      }
    });
    adminId = adminUser.id;
    console.log('✅ 已创建超级管理员账号: admin@softbuluo.com (安全凭据已加密写入)');
  } else {
    adminId = existingAdmin.id;
    console.log('ℹ️  超级管理员已存在');
  }

  // 3. 初始化官方正版与开源精选软件 (状态设为 PUBLISHED)
  const initialSoftwares = [
    {
      name: 'Visual Studio Code',
      slug: 'vscode',
      englishName: 'Visual Studio Code',
      aliases: JSON.stringify(['vscode', 'code', '微软编辑器']),
      developer: 'Microsoft Corporation',
      summary: '微软推出的轻量级、跨平台现代化代码编辑器，支持全生态扩展与深度 Git 整合。',
      description: 'Visual Studio Code 是一款免费且开源的现代化代码编辑器。完全拒绝任何流氓捆绑与暗度推广，内置调试支持、语法高亮与代码智能补全，是全球开发者首选的开发工具。',
      type: ResourceType.SOFTWARE,
      categorySlug: 'dev',
      isFeatured: true,
      featuredOrder: 1,
      version: '1.96.2',
      platform: 'Windows 10/11 64位',
      fileSize: '95.4 MB',
      releaseDate: '2025-01-15',
      changelog: '优化了终端渲染速度，改进扩展主机的内存管理。',
      officialUrl: 'https://code.visualstudio.com/Download',
      licenseType: 'FREE',
    },
    {
      name: '7-Zip',
      slug: '7zip',
      englishName: '7-Zip',
      aliases: JSON.stringify(['7zip', '7z', '解压缩']),
      developer: 'Igor Pavlov',
      summary: '拥有极高压缩比的知名开源解压缩工具，支持 7z、ZIP、RAR、TAR 等主流格式。',
      description: '7-Zip 是一款拥有极高压缩比的开源文件归档与解压缩软件。完全无任何弹窗广告与捆绑软件，支持高强度 AES-256 加密，是装机必备的高性能实用工具。',
      type: ResourceType.TOOL,
      categorySlug: 'sys-tools',
      isFeatured: true,
      featuredOrder: 2,
      version: '24.09',
      platform: 'Windows 10/11 64位',
      fileSize: '1.5 MB',
      releaseDate: '2024-12-05',
      changelog: '增强了 ARM64 处理器上的解压速度，修复特定 RAR 格式兼容性问题。',
      officialUrl: 'https://www.7-zip.org/download.html',
      licenseType: 'OPEN_SOURCE',
    },
    {
      name: 'Google Chrome',
      slug: 'chrome',
      englishName: 'Google Chrome',
      aliases: JSON.stringify(['谷歌浏览器', 'chrome', '浏览器']),
      developer: 'Google LLC',
      summary: '基于 Blink 内核的全球主流网页浏览器，提供极致的页面加载速度与安全防护。',
      description: 'Google Chrome 是一款快速、安全且免费的网页浏览器，拥有业界领先的 V8 JavaScript 引擎，支持多标签沙盒隔离与恶意网站实时阻断。',
      type: ResourceType.SOFTWARE,
      categorySlug: 'network',
      isFeatured: true,
      featuredOrder: 3,
      version: '132.0.6834.111',
      platform: 'Windows 10/11 64位',
      fileSize: '112 MB',
      releaseDate: '2025-01-22',
      changelog: '修复了多项内存安全漏洞，优化了标签页睡眠机制。',
      officialUrl: 'https://www.google.cn/chrome/',
      licenseType: 'FREE',
    },
    {
      name: 'CPU-Z',
      slug: 'cpu-z',
      englishName: 'CPU-Z',
      aliases: JSON.stringify(['cpuz', 'cpu检测', '处理器检测']),
      developer: 'CPUID',
      summary: '经典且权威的 CPU 与主机硬件体质识别利器，快速查看主频、步进与内存时序。',
      description: 'CPU-Z 是一款知名的免费硬件信息检测工具，可精准收集处理器的名称、代号、进程、封装、缓存大小以及主板和内存各项底层电气参数。',
      type: ResourceType.TOOL,
      categorySlug: 'hardware',
      isFeatured: false,
      featuredOrder: 0,
      version: '2.12',
      platform: 'Windows 10/11',
      fileSize: '3.8 MB',
      releaseDate: '2024-11-18',
      changelog: '支持最新 Intel Core Ultra 与 AMD Ryzen 9000 系列处理器识别。',
      officialUrl: 'https://www.cpuid.com/softwares/cpu-z.html',
      licenseType: 'FREE',
    },
    {
      name: 'Mindustry (像素工厂)',
      slug: 'mindustry',
      englishName: 'Mindustry',
      aliases: JSON.stringify(['mindustry', '像素工厂', '开源塔防']),
      developer: 'Anuke (Open Source)',
      summary: '广受赞誉的开源开放式工厂制造与塔防沙盒游戏，兼具物流规划与防御对抗。',
      description: 'Mindustry 是一款完全自由开源的工厂建筑类塔防游戏。建立精密高效的传送带物流供应链，开采资源并建造防御炮塔抵御敌军进攻。无强制内购与虚假弹窗。',
      type: ResourceType.GAME,
      categorySlug: 'games',
      isFeatured: true,
      featuredOrder: 4,
      version: 'v146',
      platform: 'Windows, macOS, Linux',
      fileSize: '85 MB',
      releaseDate: '2024-10-12',
      changelog: '优化了联机同步机制与大规模物流管道的物理性能。',
      officialUrl: 'https://mindustrygame.github.io/',
      licenseType: 'OPEN_SOURCE',
    }
  ];

  for (const item of initialSoftwares) {
    const categoryId = catMap.get(item.categorySlug);
    if (!categoryId) continue;

    const existingSoft = await prisma.software.findUnique({ where: { slug: item.slug } });
    if (!existingSoft) {
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
          categoryId: categoryId,
          status: ResourceStatus.PUBLISHED,
          isFeatured: item.isFeatured,
          featuredOrder: item.featuredOrder,
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
          sourceName: '原厂官方下载通道',
          url: item.officialUrl,
          verificationStatus: VerificationStatus.VERIFIED,
          lastCheckedAt: new Date(),
          lastHttpStatus: 200,
        }
      });

      await prisma.resourceLicense.create({
        data: {
          softwareId: soft.id,
          licenseType: item.licenseType,
          licenseUrl: item.officialUrl,
        }
      });
    }
  }
  console.log(`✅ 已录入并发布 ${initialSoftwares.length} 款官方正版示范资源`);

  // 4. 初始化实用装机技术教程
  const tutorials = [
    {
      title: 'Windows 11 原版纯净装机指南：避开流氓 PE 与捆绑陷阱',
      slug: 'clean-install-win11-guide',
      summary: '详解如何使用微软官方 Media Creation Tool 制作纯净引导 U 盘，杜绝任何第三方商业篡改。',
      content: '详细实操步骤与安全核验技巧...',
    },
    {
      title: '7-Zip 与高安全压缩技巧：使用 AES-256 保护私密文件',
      slug: '7zip-aes256-encryption-tutorial',
      summary: '深入讲解如何利用开源 7-Zip 设置不可逆强密码加密，防止压缩文件被暴力破解。',
      content: '7-Zip 加密与头部隐藏实战...',
    }
  ];

  for (const tut of tutorials) {
    await prisma.tutorial.upsert({
      where: { slug: tut.slug },
      update: { title: tut.title, summary: tut.summary },
      create: {
        title: tut.title,
        slug: tut.slug,
        summary: tut.summary,
        content: tut.content,
        authorId: adminId,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      }
    });
  }
  console.log(`✅ 已就绪 ${tutorials.length} 篇技术教程`);
  console.log('🎉 数据库初始化工作圆满完成！');
}

main()
  .catch((e) => {
    console.error('初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
