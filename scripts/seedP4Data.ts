import { prisma } from '../server/src/db';
import {
  ResourceStatus,
  ResourceType,
  VerificationStatus,
  SourceType,
  ComparisonStatus,
  ComparisonAttributeCategory,
  AlternativeRelationType,
  AlternativeReviewStatus,
  KeywordIntent,
  PriorityLevel,
  AiProviderType,
} from '@prisma/client';

async function main() {
  console.log('--- 开始注入 P4 阶段数据 ---');

  // 1. 获取默认分类
  let toolsCat = await prisma.category.findFirst({ where: { slug: 'dev-tools' } });
  if (!toolsCat) {
    toolsCat = await prisma.category.findFirst({ where: { slug: 'tools' } });
  }
  if (!toolsCat) {
    toolsCat = await prisma.category.findFirst();
  }
  const categoryId = toolsCat!.id;

  // 2. 确保对比/替代所需的软件存在
  // 2.1 Sublime Text
  let sublime = await prisma.software.findUnique({ where: { slug: 'sublime-text' } });
  if (!sublime) {
    sublime = await prisma.software.create({
      data: {
        name: 'Sublime Text',
        slug: 'sublime-text',
        englishName: 'Sublime Text',
        developer: 'Sublime HQ Pty Ltd',
        summary: '极致响应速度与超低资源开销的现代化跨平台文本与代码编辑器。',
        description: 'Sublime Text 是一款主打极简高效、启动毫秒级的强大代码与纯文本编辑器，支持极其丰富的宏、片段与插件。',
        iconUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=128&auto=format&fit=crop&q=80',
        categoryId,
        type: ResourceType.SOFTWARE,
        licenseType: 'COMMERCIAL_TRIAL',
        status: ResourceStatus.PUBLISHED,
        isFeatured: true,
        versions: {
          create: {
            version: 'Build 4180',
            fileSize: '35.4 MB',
            releaseDate: '2024-11-01',
            changelog: '优化 GPU 硬件加速渲染，修复暗色模式在特定高分屏下的文字微小模糊。',
            isLatest: true,
            downloadSources: {
              create: {
                sourceName: 'Sublime 官方安装包',
                url: 'https://www.sublimetext.com/download',
                verificationStatus: VerificationStatus.VERIFIED,
                isActive: true,
              },
            },
          },
        },
      },
    });
    console.log('已创建软件: Sublime Text');
  }

  // 2.2 PeaZip
  let peazip = await prisma.software.findUnique({ where: { slug: 'peazip' } });
  if (!peazip) {
    peazip = await prisma.software.create({
      data: {
        name: 'PeaZip',
        slug: 'peazip',
        englishName: 'PeaZip',
        developer: 'Giorgio Tani',
        summary: '开源跨平台压缩与归档工具，提供现代化易用的图形界面与高强度文件安全加密。',
        description: 'PeaZip 是基于开源 7-Zip/p7zip 核心的现代化图形解压缩软件，支持超过 200 种文件归档格式与两步双因素加密。',
        iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
        categoryId,
        type: ResourceType.SOFTWARE,
        licenseType: 'OPEN_SOURCE',
        status: ResourceStatus.PUBLISHED,
        isFeatured: false,
        versions: {
          create: {
            version: '10.1.0',
            fileSize: '12.8 MB',
            releaseDate: '2024-10-15',
            changelog: '更新解压缩核心库，优化高分辨率屏幕缩放与深色主题。',
            isLatest: true,
            downloadSources: {
              create: {
                sourceName: 'PeaZip 官方 GitHub Releases',
                url: 'https://github.com/peazip/PeaZip/releases',
                verificationStatus: VerificationStatus.VERIFIED,
                isActive: true,
              },
            },
          },
        },
      },
    });
    console.log('已创建软件: PeaZip');
  }

  // 获取已存在的软件
  const vscode = await prisma.software.findFirst({ where: { slug: { in: ['vscode', 'vs-code'] } } });
  const sevenZip = await prisma.software.findUnique({ where: { slug: '7zip' } });
  const vlc = await prisma.software.findUnique({ where: { slug: 'vlc' } });

  // 3. 注入 2 组精选软件横向对比
  if (vscode && sublime) {
    const comp1Slug = 'vscode-vs-sublime';
    const existingComp1 = await prisma.softwareComparison.findUnique({ where: { slug: comp1Slug } });
    if (!existingComp1) {
      await prisma.softwareComparison.create({
        data: {
          slug: comp1Slug,
          title: 'Visual Studio Code vs Sublime Text：深度横向对比与开发者选型指南',
          summary: '现代插件生态霸主与极致轻量原生编辑器的全方位较量：内存占用、启动速度、插件丰富度与生产力工具链深度解析。',
          conclusion: '如果您的工作涉及复杂前端框架、全栈开发或需要强大的语言服务器（LSP）与 GitLens 等深层调试插件，VS Code 是无可置疑的第一生产力底座；如果您追求毫秒级极速启动、经常查看 GB 级别超大日志文件，或在资源受限的老旧机器上办公，Sublime Text 则是更安静可靠的轻量利器。两者亦可共存作为主力与应急轻度工具组合。',
          targetAudience: '全栈 Web 开发者、DevOps 运维工程师、日常需高频处理 Markdown/纯文本的技术人员。',
          scenarioGuide: '日常主力项目工程开发使用 VS Code；超大文本搜索与随手速记使用 Sublime Text。',
          status: ComparisonStatus.PUBLISHED,
          publishedAt: new Date(),
          items: {
            create: [
              {
                softwareId: vscode.id,
                editorNotes: '微软开源出品，当前全球流行度第一的代码编辑器，插件生态极其繁荣。',
                isRecommended: true,
                sortOrder: 0,
              },
              {
                softwareId: sublime.id,
                editorNotes: 'C++ 纯原生编写，以极限启动速度与微小内存占用闻名。',
                isRecommended: false,
                sortOrder: 1,
              },
            ],
          },
          attributes: {
            create: [
              {
                attributeName: '冷启动速度',
                category: ComparisonAttributeCategory.PERFORMANCE,
                isHighlighted: true,
                sortOrder: 0,
                valuesJson: JSON.stringify({
                  [vscode.id]: '约 1.2 秒 ~ 2.5 秒 (受安装插件数量影响)',
                  [sublime.id]: '约 0.08 秒 ~ 0.2 秒 (瞬间秒开)',
                }),
              },
              {
                attributeName: '空载基础内存',
                category: ComparisonAttributeCategory.PERFORMANCE,
                isHighlighted: true,
                sortOrder: 1,
                valuesJson: JSON.stringify({
                  [vscode.id]: '350MB ~ 750MB (Electron 架构)',
                  [sublime.id]: '40MB ~ 90MB (C++ 原生渲染)',
                }),
              },
              {
                attributeName: '扩展与插件生态',
                category: ComparisonAttributeCategory.FUNCTION,
                isHighlighted: true,
                sortOrder: 2,
                valuesJson: JSON.stringify({
                  [vscode.id]: '数万款官方与社区扩展，支持一键热重载与配置云同步',
                  [sublime.id]: 'Package Control 拥有数千款精巧插件，更新相对平缓',
                }),
              },
              {
                attributeName: '超大文件 (1GB+) 打开能力',
                category: ComparisonAttributeCategory.PERFORMANCE,
                isHighlighted: false,
                sortOrder: 3,
                valuesJson: JSON.stringify({
                  [vscode.id]: '受 V8 引擎限制容易提示内存溢出或卡顿',
                  [sublime.id]: '支持渐进式流式加载，轻松滚动数 GB 日志文本',
                }),
              },
              {
                attributeName: '授权协议与费用',
                category: ComparisonAttributeCategory.LICENSE,
                isHighlighted: false,
                sortOrder: 4,
                valuesJson: JSON.stringify({
                  [vscode.id]: '免费开源 (MIT 许可证)',
                  [sublime.id]: '商业试用 (无期限试用，购买个人授权需 $99)',
                }),
              },
              {
                attributeName: '支持平台',
                category: ComparisonAttributeCategory.COMPATIBILITY,
                isHighlighted: false,
                sortOrder: 5,
                valuesJson: JSON.stringify({
                  [vscode.id]: 'Windows / macOS / Linux / 浏览器 Web 版',
                  [sublime.id]: 'Windows / macOS / Linux',
                }),
              },
            ],
          },
        },
      });
      console.log('已注入对比评测: VS Code vs Sublime Text');
    }
  }

  if (sevenZip && peazip) {
    const comp2Slug = '7zip-vs-peazip';
    const existingComp2 = await prisma.softwareComparison.findUnique({ where: { slug: comp2Slug } });
    if (!existingComp2) {
      await prisma.softwareComparison.create({
        data: {
          slug: comp2Slug,
          title: '7-Zip vs PeaZip：开源解压缩工具横向对比与选型指南',
          summary: '极致压缩算法之王与现代美观全能归档器的详细较量：压缩速度、界面交互、格式兼容与高强度安全加密。',
          conclusion: '若您最看重极低系统占用、极致压缩率或企业级大批量命令行脚本集成，7-Zip 是最经典稳妥的生产力基石；若您希望获得现代化高颜值 UI、更友好的鼠标拖拽体验或需要二要素密钥文件加密等进阶安全功能，PeaZip 则是非常优秀的开源升级替代方案。',
          targetAudience: '追求无广告、纯净安全解压缩工具的广大 Windows 与跨平台用户。',
          scenarioGuide: '服务器或老电脑安装 7-Zip；日常桌面现代系统安装 PeaZip。',
          status: ComparisonStatus.PUBLISHED,
          publishedAt: new Date(),
          items: {
            create: [
              {
                softwareId: sevenZip.id,
                editorNotes: '7z 格式原生缔造者，开源压缩界的黄金工业标准。',
                isRecommended: true,
                sortOrder: 0,
              },
              {
                softwareId: peazip.id,
                editorNotes: '支持 200+ 格式，界面现代清新，内置双因素密钥文件加密。',
                isRecommended: false,
                sortOrder: 1,
              },
            ],
          },
          attributes: {
            create: [
              {
                attributeName: '用户界面设计',
                category: ComparisonAttributeCategory.BASIC,
                isHighlighted: true,
                sortOrder: 0,
                valuesJson: JSON.stringify({
                  [sevenZip.id]: '极简经典 Windows 98 风格布局，纯功能导向',
                  [peazip.id]: '现代扁平化设计，支持深浅色皮肤与高清图标',
                }),
              },
              {
                attributeName: '格式兼容范围',
                category: ComparisonAttributeCategory.FUNCTION,
                isHighlighted: false,
                sortOrder: 1,
                valuesJson: JSON.stringify({
                  [sevenZip.id]: '核心主流格式 (7z, ZIP, RAR, TAR, GZ 等约 30+ 种)',
                  [peazip.id]: '超过 200 种格式，支持转换归档文件与批量压缩',
                }),
              },
              {
                attributeName: '安全加密特性',
                category: ComparisonAttributeCategory.SECURITY,
                isHighlighted: true,
                sortOrder: 2,
                valuesJson: JSON.stringify({
                  [sevenZip.id]: '标准 AES-256 位加密与文件名混淆加密',
                  [peazip.id]: 'AES-256 加密 + 随机密码生成器 + Keyfile 密钥文件双因素保护',
                }),
              },
              {
                attributeName: '开源协议',
                category: ComparisonAttributeCategory.LICENSE,
                isHighlighted: false,
                sortOrder: 3,
                valuesJson: JSON.stringify({
                  [sevenZip.id]: 'GNU LGPL 自由开源',
                  [peazip.id]: 'GNU LGPL v3 自由开源',
                }),
              },
            ],
          },
        },
      });
      console.log('已注入对比评测: 7-Zip vs PeaZip');
    }
  }

  // 4. 注入 4 组软件替代品方案 (SoftwareAlternative)
  if (vscode && sublime) {
    const existingAlt = await prisma.softwareAlternative.findUnique({
      where: {
        softwareId_alternativeSoftwareId: {
          softwareId: vscode.id,
          alternativeSoftwareId: sublime.id,
        },
      },
    });
    if (!existingAlt) {
      await prisma.softwareAlternative.create({
        data: {
          softwareId: vscode.id,
          alternativeSoftwareId: sublime.id,
          relationType: AlternativeRelationType.LIGHTWEIGHT_OPTION,
          reason: '在低配置机器或需要瞬间毫秒开超大文本日志时，Sublime Text 是绝佳的轻量级纯文本替代品。',
          reviewStatus: AlternativeReviewStatus.APPROVED,
          reviewedBy: 'system',
        },
      });
      console.log('已注入替代品: VS Code -> Sublime Text');
    }
  }

  if (sevenZip && peazip) {
    const existingAlt = await prisma.softwareAlternative.findUnique({
      where: {
        softwareId_alternativeSoftwareId: {
          softwareId: sevenZip.id,
          alternativeSoftwareId: peazip.id,
        },
      },
    });
    if (!existingAlt) {
      await prisma.softwareAlternative.create({
        data: {
          softwareId: sevenZip.id,
          alternativeSoftwareId: peazip.id,
          relationType: AlternativeRelationType.SIMILAR_FUNCTION,
          reason: '同样基于开源解压内核，但拥有更美观直观的现代界面与两步安全密钥保护。',
          reviewStatus: AlternativeReviewStatus.APPROVED,
          reviewedBy: 'system',
        },
      });
      console.log('已注入替代品: 7-Zip -> PeaZip');
    }
  }

  // 5. 注入初始 SEO 关键词
  const initialKeywords = [
    { keyword: 'vscode 下载', intent: KeywordIntent.SOFTWARE_DOWNLOAD, topic: '开发工具', priority: PriorityLevel.HIGH },
    { keyword: '7zip 官方下载', intent: KeywordIntent.SOFTWARE_DOWNLOAD, topic: '系统工具', priority: PriorityLevel.HIGH },
    { keyword: 'vlc 播放器官方版', intent: KeywordIntent.SOFTWARE_DOWNLOAD, topic: '影音播放', priority: PriorityLevel.HIGH },
    { keyword: '开源解压缩软件推荐', intent: KeywordIntent.COMPARISON_SELECTION, topic: '选型指南', priority: PriorityLevel.MEDIUM },
    { keyword: 'vscode 和 sublime 哪个好', intent: KeywordIntent.COMPARISON_SELECTION, topic: '代码编辑器', priority: PriorityLevel.HIGH },
  ];

  for (const kw of initialKeywords) {
    const exists = await prisma.seoKeyword.findUnique({ where: { keyword: kw.keyword } });
    if (!exists) {
      await prisma.seoKeyword.create({
        data: {
          keyword: kw.keyword,
          normalizedKeyword: kw.keyword.toLowerCase().trim(),
          intent: kw.intent,
          topic: kw.topic,
          priority: kw.priority,
        },
      });
    }
  }
  console.log('已注入初始 SEO 关键词库');

  // 6. 注入默认 AI Provider 配置
  const defaultProvider = await prisma.aiProviderConfig.findFirst({ where: { isEnabled: true } });
  if (!defaultProvider) {
    await prisma.aiProviderConfig.create({
      data: {
        name: '软游内置语义助手 (本地客观知识引擎)',
        providerType: AiProviderType.MOCK,
        modelName: 'softbuluo-nlp-v1',
        temperature: 0.7,
        maxTokens: 2000,
        dailyTokenLimit: 500000,
        isEnabled: true,
      },
    });
    console.log('已初始化默认 AI Provider 配置');
  }

  // 7. 注入测试真实评价（若尚无评价）
  if (vscode) {
    const anyMember = await prisma.memberUser.findFirst();
    if (anyMember) {
      const existingRev = await prisma.softwareReview.findUnique({
        where: {
          softwareId_userId: {
            softwareId: vscode.id,
            userId: anyMember.id,
          },
        },
      });
      if (!existingRev) {
        await prisma.softwareReview.create({
          data: {
            softwareId: vscode.id,
            userId: anyMember.id,
            rating: 5,
            title: '现代前端开发不可或缺的核心利器',
            content: '从 2018 年开始主力使用，扩展市场的丰富度无可比拟。配合 TypeScript 和 ESLint 插件体验极佳。不过内存占用确实比原生编辑器高一些，日常 16GB 内存机型跑起来毫无压力。',
            versionUsed: '1.96.2',
            operatingSystem: 'Windows 11 64位',
            status: 'APPROVED',
            helpfulCount: 12,
            unhelpfulCount: 1,
          },
        });
        console.log('已注入测试真实评价');
      }
    }
  }

  console.log('--- P4 阶段数据注入完成 ---');
}

main()
  .catch((e) => {
    console.error('P4 注入失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
