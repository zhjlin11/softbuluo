import {
  ComparisonStatus,
  ResourceStatus,
  ResourceType,
  AlternativeReviewStatus,
} from '@prisma/client';
import { prisma } from '../../db';

export interface CompareSoftwareItemDto {
  id: string;
  slug: string;
  name: string;
  englishName: string | null;
  developer: string;
  summary: string;
  iconUrl: string | null;
  type: ResourceType;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  latestVersion: string | null;
  releaseDate: string | null;
  licenseType: string;
  priceType: string;
  price: number;
  platform: string;
  fileSize: string;
  catalogedAt: string;
  updatedAt: string;
  hasVerifiedSource: boolean;
  registeredSourcesCount: number;
  approvedHealthySourcesCount: number;
  sha256Verified: boolean;
}

export interface MatrixRowItem {
  id: string;
  label: string;
  category: 'BASIC' | 'LICENSE' | 'PLATFORM' | 'FEATURE' | 'INSTALL' | 'SOURCE' | 'EDITORIAL';
  valueA: string;
  valueB: string;
  isDifferent: boolean;
  isHighlighted?: boolean;
  evidenceStatus?: string;
  sourceUrl?: string | null;
  testEnvironment?: string | null;
}

export interface CompareMatrixDto {
  softwareA: CompareSoftwareItemDto;
  softwareB: CompareSoftwareItemDto;
  isSameCategory: boolean;
  crossCategoryNotice: string | null;
  curatedArticle: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    conclusion: string;
    targetAudience: string | null;
    scenarioGuide: string | null;
    viewCount: number;
    publishedAt: string | null;
  } | null;
  rows: MatrixRowItem[];
  differenceCount: number;
  totalRowCount: number;
  scenarioAdvice: {
    title: string;
    description: string;
    chooseSoftwareAIf: string[];
    chooseSoftwareBIf: string[];
  };
}

export class CompareChannelService {
  /**
   * 获取对比评测频道 UI 3.0 门户全量聚合数据
   */
  static async getCompareChannelData() {
    // 1. 获取所有已发布非测试桌面软件和系统工具（严格排除游戏）
    const allSoftwaresRaw = await prisma.software.findMany({
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
            },
          },
        },
      },
      orderBy: { slug: 'asc' },
    });

    const swMap = new Map<string, (typeof allSoftwaresRaw)[0]>();
    const swBySlug = new Map<string, (typeof allSoftwaresRaw)[0]>();
    for (const sw of allSoftwaresRaw) {
      swMap.set(sw.id, sw);
      swBySlug.set(sw.slug, sw);
    }

    const selectableSoftwares: CompareSoftwareItemDto[] = allSoftwaresRaw.map((s) => {
      const latestVer = s.versions[0];
      const sources = latestVer?.downloadSources || [];
      const healthySources = sources.filter((src) => src.reviewStatus === 'APPROVED' && src.lastCheckStatus === 'HEALTHY');
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        englishName: s.englishName,
        developer: s.developer,
        summary: s.summary,
        iconUrl: s.iconUrl,
        type: s.type,
        categoryId: s.categoryId,
        categoryName: s.category?.name || '综合工具',
        categorySlug: s.category?.slug || 'other',
        latestVersion: s.latestVersion,
        releaseDate: s.releaseDate,
        licenseType: s.licenseType,
        priceType: s.priceType,
        price: Number(s.price || 0),
        platform: s.platform || 'Windows 10/11',
        fileSize: s.fileSize || '官方完整安装包',
        catalogedAt: (s.createdAt || new Date()).toISOString(),
        updatedAt: (s.updatedAt || new Date()).toISOString(),
        hasVerifiedSource: healthySources.length > 0,
        registeredSourcesCount: sources.length,
        approvedHealthySourcesCount: healthySources.length,
        sha256Verified: sources.some((src) => Boolean(src.sha256)),
      };
    });

    // 2. 获取已发布的真实横向对比文章
    const comparisonsRaw = await prisma.softwareComparison.findMany({
      where: {
        status: ComparisonStatus.PUBLISHED,
      },
      include: {
        items: {
          include: {
            software: {
              include: {
                category: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        attributes: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 严格过滤：每篇对比必须包含至少 2 款 PUBLISHED 且非测试软件
    const validComparisons = comparisonsRaw.filter((c) => {
      const validItems = c.items.filter(
        (it) => it.software.status === ResourceStatus.PUBLISHED && !it.software.isTestData
      );
      return validItems.length >= 2;
    });

    // 3. 构建顶部焦点对比 Banner（取前 2~4 条，两两对决大图）
    const heroSlides = validComparisons.map((c, idx) => {
      const itA = c.items[0];
      const itB = c.items[1];
      return {
        id: c.id,
        slug: c.slug,
        title: c.title,
        summary: c.summary,
        conclusion: c.conclusion,
        badgeText: idx === 0 ? '年度旗舰横评' : '深度选型指南',
        targetUrl: `/compare/${c.slug}`,
        softwareA: {
          slug: itA.software.slug,
          name: itA.software.name,
          iconUrl: itA.software.iconUrl,
          version: itA.software.latestVersion || '最新稳定版',
          licenseType: itA.software.licenseType,
          categoryName: itA.software.category?.name || '常用工具',
          editorNotes: itA.editorNotes,
          isRecommended: itA.isRecommended,
        },
        softwareB: {
          slug: itB.software.slug,
          name: itB.software.name,
          iconUrl: itB.software.iconUrl,
          version: itB.software.latestVersion || '最新稳定版',
          licenseType: itB.software.licenseType,
          categoryName: itB.software.category?.name || '常用工具',
          editorNotes: itB.editorNotes,
          isRecommended: itB.isRecommended,
        },
        matrixUrl: `/compare?left=${encodeURIComponent(itA.software.slug)}&right=${encodeURIComponent(itB.software.slug)}`,
      };
    });

    // 4. 构建热门快速对比入口（4~6 对真实候选对，点击一键载入 A/B 选择器）
    const quickPairs = [
      {
        leftSlug: '7zip',
        leftName: '7-Zip',
        rightSlug: 'peazip',
        rightName: 'PeaZip',
        categoryName: '解压工具',
        tagline: '极简经典开源 vs 现代高颜值多格式支持',
        hasCuratedArticle: true,
      },
      {
        leftSlug: 'vscode',
        leftName: 'VS Code',
        rightSlug: 'sublime-text',
        rightName: 'Sublime Text',
        categoryName: '编程开发',
        tagline: '全生态扩展支持 vs 毫秒级秒开超大文本',
        hasCuratedArticle: true,
      },
      {
        leftSlug: 'cpu-z',
        leftName: 'CPU-Z',
        rightSlug: 'hwinfo',
        rightName: 'HWiNFO64',
        categoryName: '硬件检测',
        tagline: '2MB 单文件便携验机 vs 全硬件传感器深度监控',
        hasCuratedArticle: false,
      },
      {
        leftSlug: 'libreoffice',
        leftName: 'LibreOffice',
        rightSlug: 'office-2024',
        rightName: 'Office 2024',
        categoryName: '办公套件',
        tagline: '完全免费自由开源 vs 商业买断顶级排版兼容',
        hasCuratedArticle: false,
      },
      {
        leftSlug: 'rufus',
        leftName: 'Rufus',
        rightSlug: 'diskgenius',
        rightName: 'DiskGenius',
        categoryName: '系统工具',
        tagline: '纯粹极速启动 U 盘制作 vs 全功能磁盘分区维护',
        hasCuratedArticle: false,
      },
      {
        leftSlug: 'vlc',
        leftName: 'VLC Media Player',
        rightSlug: 'obs-studio',
        rightName: 'OBS Studio',
        categoryName: '影音工具',
        tagline: '全格式万能本地播放器 vs 专业级直播与屏幕录制套件',
        hasCuratedArticle: false,
      },
    ].filter((pair) => swBySlug.has(pair.leftSlug) && swBySlug.has(pair.rightSlug));

    // 5. 构建真实替代软件推荐（已审核的真实关联）
    const alternativesRaw = await prisma.softwareAlternative.findMany({
      where: {
        reviewStatus: AlternativeReviewStatus.APPROVED,
        software: { status: ResourceStatus.PUBLISHED, isTestData: false },
        alternativeSoftware: { status: ResourceStatus.PUBLISHED, isTestData: false },
      },
      include: {
        software: { select: { slug: true, name: true, iconUrl: true, licenseType: true } },
        alternativeSoftware: { select: { slug: true, name: true, iconUrl: true, licenseType: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const alternatives = alternativesRaw.map((alt) => ({
      id: alt.id,
      fromSlug: alt.software.slug,
      fromName: alt.software.name,
      fromIconUrl: alt.software.iconUrl,
      fromLicense: alt.software.licenseType,
      toSlug: alt.alternativeSoftware.slug,
      toName: alt.alternativeSoftware.name,
      toIconUrl: alt.alternativeSoftware.iconUrl,
      toLicense: alt.alternativeSoftware.licenseType,
      reason: alt.reason,
      relationType: alt.relationType,
      matrixUrl: `/compare?left=${encodeURIComponent(alt.software.slug)}&right=${encodeURIComponent(alt.alternativeSoftware.slug)}`,
    }));

    // 6. 按软件类别发现对比（仅展示收录有真实软件的类别）
    const categoryMap = new Map<string, { id: string; name: string; slug: string; softwares: CompareSoftwareItemDto[] }>();
    for (const sw of selectableSoftwares) {
      if (!categoryMap.has(sw.categoryId)) {
        categoryMap.set(sw.categoryId, {
          id: sw.categoryId,
          name: sw.categoryName,
          slug: sw.categorySlug,
          softwares: [],
        });
      }
      categoryMap.get(sw.categoryId)!.softwares.push(sw);
    }

    const categoryShelves = Array.from(categoryMap.values())
      .filter((cat) => cat.softwares.length >= 2)
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        softwareCount: cat.softwares.length,
        suggestedPair: {
          leftSlug: cat.softwares[0].slug,
          leftName: cat.softwares[0].name,
          rightSlug: cat.softwares[1].slug,
          rightName: cat.softwares[1].name,
        },
        sampleSoftwares: cat.softwares.slice(0, 4).map((s) => ({
          slug: s.slug,
          name: s.name,
          iconUrl: s.iconUrl,
        })),
      }));

    // 7. 精选横向评测文章（卡片列表）
    const featuredArticles = validComparisons.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      conclusion: c.conclusion,
      targetAudience: c.targetAudience,
      scenarioGuide: c.scenarioGuide,
      viewCount: c.viewCount,
      publishedAt: c.publishedAt ? c.publishedAt.toISOString() : c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      items: c.items.map((it) => ({
        slug: it.software.slug,
        name: it.software.name,
        iconUrl: it.software.iconUrl,
        isRecommended: it.isRecommended,
        editorNotes: it.editorNotes,
      })),
      attributesCount: c.attributes.length,
    }));

    // 8. 场景化选型指南专栏卡片（基于真实软硬件使用需求）
    const decisionGuides = [
      {
        id: 'guide-office',
        scenario: '日常办公与文字处理',
        targetUsers: '学生、文职人员、中小团队与自由职业者',
        keyCriteria: '文档排版与微软格式兼容度、商用授权合法合规、软件采购成本、离线可用性',
        recommendedPair: {
          leftSlug: 'libreoffice',
          leftName: 'LibreOffice',
          rightSlug: 'office-2024',
          rightName: 'Microsoft Office 2024',
        },
        guidance: '预算敏感且侧重自主开源格式推荐 LibreOffice；重度依赖外部商务排版与 Excel 复杂宏推荐正版 Office 2024 买断版。',
      },
      {
        id: 'guide-dev',
        scenario: '代码开发与文本处理',
        targetUsers: '全栈工程师、运维技术人员、前端开发者',
        keyCriteria: '冷启动秒开速度、大型日志文本支持、扩展生态繁荣度、内存开销',
        recommendedPair: {
          leftSlug: 'vscode',
          leftName: 'Visual Studio Code',
          rightSlug: 'sublime-text',
          rightName: 'Sublime Text',
        },
        guidance: '日常项目开发与多语言调试首选 VS Code 丰富生态；需要瞬间打开数 GB 级别服务器大日志或极轻量文本速记推荐 Sublime Text。',
      },
      {
        id: 'guide-repair',
        scenario: '电脑维修与硬件验机',
        targetUsers: '装机运维、售后工程师、二手验机爱好者',
        keyCriteria: '免安装绿色便携、传感器数据采样精度、底层主板与电压读取',
        recommendedPair: {
          leftSlug: 'cpu-z',
          leftName: 'CPU-Z',
          rightSlug: 'hwinfo',
          rightName: 'HWiNFO64',
        },
        guidance: '快速识别 CPU 型号、主板及内存双通道规格用 CPU-Z；深度排查烤机温度、风扇转速与供电传感器用 HWiNFO64。',
      },
      {
        id: 'guide-archive',
        scenario: '压缩包解压与归档管理',
        targetUsers: '所有电脑用户、大文件归档、隐私文件加密',
        keyCriteria: '压缩比率、支持格式广度、AES-256 安全性、双因素 Keyfile 保护',
        recommendedPair: {
          leftSlug: '7zip',
          leftName: '7-Zip',
          rightSlug: 'peazip',
          rightName: 'PeaZip',
        },
        guidance: '追求工业级稳定与极限压缩推荐 7-Zip；看重现代图形界面皮肤与 200+ 格式支持推荐 PeaZip。',
      },
    ];

    return {
      channel: 'COMPARE',
      meta: {
        totalPublishedComparisons: validComparisons.length,
        totalComparableSoftwares: selectableSoftwares.length,
        totalAlternatives: alternatives.length,
        categoriesCount: categoryShelves.length,
        matrixSupport: true,
        evidenceStatement:
          '软游部落对比评测所有基础参数与技术规格均锚定官方发行说明与正规开源协议，绝不采用虚构跑分或伪造星级评分。',
        generatedAt: new Date().toISOString(),
      },
      heroSlides,
      quickPairs,
      selectableSoftwares,
      featuredArticles,
      categoryShelves,
      alternatives,
      decisionGuides,
      latestUpdates: featuredArticles.slice(0, 6),
    };
  }

  /**
   * 动态双软件 A/B 参数矩阵比对核心计算引擎
   */
  static async getComparisonMatrix(leftSlug: string, rightSlug: string): Promise<CompareMatrixDto> {
    const left = leftSlug?.trim();
    const right = rightSlug?.trim();

    if (!left || !right) {
      throw new Error('对比参数不完整：必须指定两款需要比较的软件标识 (left & right)');
    }

    if (left === right) {
      throw new Error('同一款软件无需进行横向对比，请选择两款不同的软件进行比较');
    }

    // 查询软件 A 与 B（严格要求 PUBLISHED 且非测试软件）
    const [swA, swB] = await Promise.all([
      prisma.software.findFirst({
        where: { slug: left, status: ResourceStatus.PUBLISHED, isTestData: false },
        include: {
          category: true,
          versions: {
            orderBy: [{ isLatest: 'desc' }, { createdAt: 'desc' }],
            take: 1,
            include: {
              downloadSources: {
                where: { isActive: true },
              },
            },
          },
        },
      }),
      prisma.software.findFirst({
        where: { slug: right, status: ResourceStatus.PUBLISHED, isTestData: false },
        include: {
          category: true,
          versions: {
            orderBy: [{ isLatest: 'desc' }, { createdAt: 'desc' }],
            take: 1,
            include: {
              downloadSources: {
                where: { isActive: true },
              },
            },
          },
        },
      }),
    ]);

    if (!swA) {
      throw new Error(`未找到软件「${left}」或该软件尚未公开发布`);
    }
    if (!swB) {
      throw new Error(`未找到软件「${right}」或该软件尚未公开发布`);
    }

    // 禁止比较 GAME 类型资源（保持软件工具纯度）
    if (swA.type === ResourceType.GAME || swB.type === ResourceType.GAME) {
      throw new Error('对比评测频道专注桌面软件与系统工具，不支持将游戏资源混入参数对比');
    }

    const formatSwDto = (s: typeof swA): CompareSoftwareItemDto => {
      const latestVer = s.versions[0];
      const sources = latestVer?.downloadSources || [];
      const healthySources = sources.filter((src) => src.reviewStatus === 'APPROVED' && src.lastCheckStatus === 'HEALTHY');
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        englishName: s.englishName,
        developer: s.developer,
        summary: s.summary,
        iconUrl: s.iconUrl,
        type: s.type,
        categoryId: s.categoryId,
        categoryName: s.category?.name || '综合工具',
        categorySlug: s.category?.slug || 'other',
        latestVersion: s.latestVersion,
        releaseDate: s.releaseDate,
        licenseType: s.licenseType,
        priceType: s.priceType,
        price: Number(s.price || 0),
        platform: s.platform || 'Windows 10/11',
        fileSize: s.fileSize || '官方完整安装包',
        catalogedAt: (s.createdAt || new Date()).toISOString(),
        updatedAt: (s.updatedAt || new Date()).toISOString(),
        hasVerifiedSource: healthySources.length > 0,
        registeredSourcesCount: sources.length,
        approvedHealthySourcesCount: healthySources.length,
        sha256Verified: sources.some((src) => Boolean(src.sha256)),
      };
    };

    const itemA = formatSwDto(swA);
    const itemB = formatSwDto(swB);
    const isSameCategory = swA.categoryId === swB.categoryId;
    const crossCategoryNotice = isSameCategory
      ? null
      : `两款软件所属分类不同（${itemA.categoryName} vs ${itemB.categoryName}），设计定位及部分功能维度不具备直接对等性，请重点参考具体使用场景。`;

    // 检查是否存在已发布的官方对比文章（双向匹配）
    const curatedArticleRaw = await prisma.softwareComparison.findFirst({
      where: {
        status: ComparisonStatus.PUBLISHED,
        AND: [
          { items: { some: { softwareId: swA.id } } },
          { items: { some: { softwareId: swB.id } } },
        ],
      },
      include: {
        attributes: { orderBy: { sortOrder: 'asc' } },
      },
    });

    // 组装结构化参数行
    const rows: MatrixRowItem[] = [];

    const addRow = (
      id: string,
      label: string,
      category: MatrixRowItem['category'],
      valA: string | null | undefined,
      valB: string | null | undefined,
      opts?: {
        isHighlighted?: boolean;
        evidenceStatus?: string;
        sourceUrl?: string | null;
        testEnvironment?: string | null;
      }
    ) => {
      const safeA = (valA || '').trim() || '暂无可靠数据';
      const safeB = (valB || '').trim() || '暂无可靠数据';
      const isDiff = safeA.toLowerCase() !== safeB.toLowerCase();
      rows.push({
        id,
        label,
        category,
        valueA: safeA,
        valueB: safeB,
        isDifferent: isDiff,
        isHighlighted: opts?.isHighlighted || false,
        evidenceStatus: opts?.evidenceStatus || 'OFFICIAL_DOCUMENTATION',
        sourceUrl: opts?.sourceUrl || null,
        testEnvironment: opts?.testEnvironment || null,
      });
    };

    // 1. 基础信息
    addRow('basic-name', '软件名称', 'BASIC', itemA.name, itemB.name);
    addRow('basic-eng-name', '官方英文名', 'BASIC', itemA.englishName, itemB.englishName);
    addRow('basic-dev', '出品机构 / 开发者', 'BASIC', itemA.developer, itemB.developer);
    addRow('basic-cat', '功能类别', 'BASIC', itemA.categoryName, itemB.categoryName);
    addRow(
      'basic-type',
      '资源类型',
      'BASIC',
      itemA.type === ResourceType.SOFTWARE ? '桌面应用软件' : '系统排障工具',
      itemB.type === ResourceType.SOFTWARE ? '桌面应用软件' : '系统排障工具'
    );
    addRow('basic-ver', '当前稳定版本', 'BASIC', itemA.latestVersion, itemB.latestVersion);
    addRow(
      'basic-date',
      '最新版本发布日期',
      'BASIC',
      itemA.releaseDate || '以官方通道为准',
      itemB.releaseDate || '以官方通道为准'
    );
    addRow(
      'basic-cat-date',
      '平台收录时间',
      'BASIC',
      itemA.catalogedAt.slice(0, 10),
      itemB.catalogedAt.slice(0, 10)
    );

    // 2. 授权与费用
    addRow('lic-type', '开源与授权协议', 'LICENSE', itemA.licenseType, itemB.licenseType, { isHighlighted: true });
    addRow(
      'lic-price-type',
      '计费与商业策略',
      'LICENSE',
      itemA.priceType === 'FREE' ? '免费使用 / 开源分发' : itemA.priceType === 'PAID' ? '商业收费买断' : '基础免费增值',
      itemB.priceType === 'FREE' ? '免费使用 / 开源分发' : itemB.priceType === 'PAID' ? '商业收费买断' : '基础免费增值',
      { isHighlighted: true }
    );
    addRow(
      'lic-price',
      '个人授权参考价格',
      'LICENSE',
      itemA.price === 0 ? '免费提供' : `¥${itemA.price}`,
      itemB.price === 0 ? '免费提供' : `¥${itemB.price}`
    );
    addRow(
      'lic-compliance',
      '正版合规说明',
      'LICENSE',
      itemA.licenseType.toLowerCase().includes('gnu') || itemA.licenseType.toLowerCase().includes('mit')
        ? '允许个人与企业合规自由使用，源码开放透明'
        : '商业使用需遵循原厂许可协议，激活需自备正版授权',
      itemB.licenseType.toLowerCase().includes('gnu') || itemB.licenseType.toLowerCase().includes('mit')
        ? '允许个人与企业合规自由使用，源码开放透明'
        : '商业使用需遵循原厂许可协议，激活需自备正版授权'
    );

    // 3. 平台与兼容性
    addRow('plat-os', '支持操作系统', 'PLATFORM', itemA.platform, itemB.platform);
    addRow(
      'plat-arch',
      '架构与运行环境',
      'PLATFORM',
      itemA.platform.includes('64位') ? '原生 64位 (x64) 架构' : '全架构兼容',
      itemB.platform.includes('64位') ? '原生 64位 (x64) 架构' : '全架构兼容'
    );

    // 4. 功能定位与使用场景
    addRow('feat-purpose', '核心功能定位', 'FEATURE', itemA.summary, itemB.summary, { isHighlighted: true });
    addRow(
      'feat-scope',
      '主要覆盖领域',
      'FEATURE',
      `${itemA.categoryName}专项应用与解决场景`,
      `${itemB.categoryName}专项应用与解决场景`
    );

    // 5. 安装与分发
    addRow('inst-size', '官方安装包体体量', 'INSTALL', itemA.fileSize, itemB.fileSize);
    addRow(
      'inst-mode',
      '安装与运行机制',
      'INSTALL',
      itemA.fileSize.includes('MB') || itemA.fileSize.includes('便携')
        ? '标准安装 / 支持轻量便携'
        : '原版完整离线安装分发',
      itemB.fileSize.includes('MB') || itemB.fileSize.includes('便携')
        ? '标准安装 / 支持轻量便携'
        : '原版完整离线安装分发'
    );

    // 6. 下载来源与安全审计
    addRow(
      'src-registered',
      '已登记官方分发渠道',
      'SOURCE',
      `收录 ${itemA.registeredSourcesCount} 条官方发布指引`,
      `收录 ${itemB.registeredSourcesCount} 条官方发布指引`
    );
    addRow(
      'src-approved',
      '人工审核健康直连',
      'SOURCE',
      itemA.hasVerifiedSource
        ? `含已核验可用原厂通道 (${itemA.approvedHealthySourcesCount} 条)`
        : '官网原厂发布主页指引',
      itemB.hasVerifiedSource
        ? `含已核验可用原厂通道 (${itemB.approvedHealthySourcesCount} 条)`
        : '官网原厂发布主页指引'
    );
    addRow(
      'src-sha256',
      'SHA-256 文件哈希比对',
      'SOURCE',
      itemA.sha256Verified ? '已具备原厂哈希防篡改登记' : '暂未绑定特定版本哈希',
      itemB.sha256Verified ? '已具备原厂哈希防篡改登记' : '暂未绑定特定版本哈希',
      { isHighlighted: true }
    );

    // 7. 若存在官方评测属性，动态追加
    if (curatedArticleRaw && curatedArticleRaw.attributes.length > 0) {
      for (const attr of curatedArticleRaw.attributes) {
        let valuesMap: Record<string, string> = {};
        try {
          valuesMap = JSON.parse(attr.valuesJson || '{}');
        } catch {}
        const valA = valuesMap[swA.id] || valuesMap[swA.slug] || '暂无实测记录';
        const valB = valuesMap[swB.id] || valuesMap[swB.slug] || '暂无实测记录';
        addRow(
          `editorial-${attr.id}`,
          attr.attributeName,
          'EDITORIAL',
          valA,
          valB,
          {
            isHighlighted: attr.isHighlighted,
            evidenceStatus: attr.evidenceStatus,
            sourceUrl: attr.sourceUrl,
            testEnvironment: attr.testEnvironment,
          }
        );
      }
    }

    const differenceCount = rows.filter((r) => r.isDifferent).length;

    // 8. 场景化选型建议
    let scenarioAdvice: CompareMatrixDto['scenarioAdvice'];
    if (curatedArticleRaw) {
      scenarioAdvice = {
        title: curatedArticleRaw.title,
        description: curatedArticleRaw.conclusion,
        chooseSoftwareAIf: [
          `如果你更看重 ${itemA.name} 的核心特性：${itemA.summary}`,
          `适合场景：${curatedArticleRaw.scenarioGuide || itemA.categoryName + '常规任务'}`,
          `授权考虑：${itemA.licenseType} 协议分发模式`,
        ],
        chooseSoftwareBIf: [
          `如果你更看重 ${itemB.name} 的核心特性：${itemB.summary}`,
          `适合场景：${curatedArticleRaw.scenarioGuide || itemB.categoryName + '常规任务'}`,
          `授权考虑：${itemB.licenseType} 协议分发模式`,
        ],
      };
    } else {
      scenarioAdvice = {
        title: `${itemA.name} 与 ${itemB.name} 场景选型参考`,
        description: isSameCategory
          ? `两款软件同属「${itemA.categoryName}」分类，根据许可证、包体量级与功能定位，各有适合的使用场景。`
          : `两款软件分属「${itemA.categoryName}」与「${itemB.categoryName}」，请根据您所需解决的实际电脑问题挑选。`,
        chooseSoftwareAIf: [
          `偏好 ${itemA.name} 的功能定位：${itemA.summary}`,
          `接受其 ${itemA.licenseType} 许可与 ${itemA.fileSize} 包体`,
          `主要应用于 Windows 平台下 ${itemA.categoryName} 任务`,
        ],
        chooseSoftwareBIf: [
          `偏好 ${itemB.name} 的功能定位：${itemB.summary}`,
          `接受其 ${itemB.licenseType} 许可与 ${itemB.fileSize} 包体`,
          `主要应用于 Windows 平台下 ${itemB.categoryName} 任务`,
        ],
      };
    }

    return {
      softwareA: itemA,
      softwareB: itemB,
      isSameCategory,
      crossCategoryNotice,
      curatedArticle: curatedArticleRaw
        ? {
            id: curatedArticleRaw.id,
            slug: curatedArticleRaw.slug,
            title: curatedArticleRaw.title,
            summary: curatedArticleRaw.summary,
            conclusion: curatedArticleRaw.conclusion,
            targetAudience: curatedArticleRaw.targetAudience,
            scenarioGuide: curatedArticleRaw.scenarioGuide,
            viewCount: curatedArticleRaw.viewCount,
            publishedAt: curatedArticleRaw.publishedAt ? curatedArticleRaw.publishedAt.toISOString() : null,
          }
        : null,
      rows,
      differenceCount,
      totalRowCount: rows.length,
      scenarioAdvice,
    };
  }
}
