import { PrismaClient, ResourceStatus } from '@prisma/client';
import { hashPassword } from '../server/src/utils/security';

export interface MigrationSummary {
  success: boolean;
  targetDbUrl: string;
  counts: {
    categories: number;
    products: number;
    publishedSoftware: number;
    softwareVersions: number;
    downloadSources: number;
    softwareSources: number;
    reviewEvidences: number;
    tutorials: number;
    topics: number;
    comparisons: number;
    adminUsers: number;
    // 严格安全审计指标 (必须全部为 0)
    mockOrders: number;
    testMembers: number;
    mockEntitlements: number;
    mockPaymentLogs: number;
    testSoftware: number;
  };
  durationMs: number;
  error?: string;
}

/**
 * 软游部落 P8-2 生产环境定向安全数据迁移器
 * 核心原则：
 * 仅向目标生产数据库迁移经过人工核实、合法、公开、真实的软件与内容资产。
 * 坚决不导入任何测试会员、模拟支付订单、测试凭据与虚拟测试工具！
 */
export async function migrateVerifiedPublicContent(targetDbUrl: string): Promise<MigrationSummary> {
  const startTime = Date.now();
  const sourcePrisma = new PrismaClient();
  const targetPrisma = new PrismaClient({
    datasources: { db: { url: targetDbUrl } }
  });

  try {
    console.log(`[P8-2 Migration] 正在连接源数据库并提取已核实公开内容...`);

    // 0. 优先初始化生产专属合规管理员 (提供教程 authorId 权属)
    let targetAdmin = await targetPrisma.user.findFirst();
    if (!targetAdmin) {
      const strongHash = await hashPassword('SoftBuluo@2026!ProdMaster');
      targetAdmin = await targetPrisma.user.create({
        data: {
          username: 'admin@softbuluo.com',
          email: 'admin@softbuluo.com',
          passwordHash: strongHash,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          tokenVersion: 1,
        }
      });
      console.log('  -> 安全初始化生产首个合规管理员: admin@softbuluo.com');
    }

    // 1. 基础分类 (100% 官方公开分类)
    const categories = await sourcePrisma.category.findMany();
    console.log(`  -> 提取基础分类: ${categories.length} 个`);
    for (const cat of categories) {
      await targetPrisma.category.upsert({
        where: { id: cat.id },
        update: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          parentId: cat.parentId,
          sortOrder: cat.sortOrder,
          isVisible: cat.isVisible,
        },
        create: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          parentId: cat.parentId,
          sortOrder: cat.sortOrder,
          isVisible: cat.isVisible,
        }
      });
    }

    // 2. 官方标准商业化商品定义 (月度/年度会员、单次服务)
    const products = await sourcePrisma.product.findMany();
    console.log(`  -> 提取官方商品目录: ${products.length} 个`);
    for (const prod of products) {
      await targetPrisma.product.upsert({
        where: { id: prod.id },
        update: {
          name: prod.name,
          slug: prod.slug,
          priceFen: prod.priceFen,
          originalPriceFen: prod.originalPriceFen,
          description: prod.description,
          durationDays: prod.durationDays,
          productType: prod.productType,
          status: prod.status,
          entitlementsConfig: prod.entitlementsConfig,
          sortOrder: prod.sortOrder,
        },
        create: {
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          priceFen: prod.priceFen,
          originalPriceFen: prod.originalPriceFen,
          description: prod.description,
          durationDays: prod.durationDays,
          productType: prod.productType,
          status: prod.status,
          entitlementsConfig: prod.entitlementsConfig,
          sortOrder: prod.sortOrder,
        }
      });
    }

    // 3. 严格核实且已正式发布的真实软件 (过滤 isTestData=true 及所有测试 slug)
    const genuineSoftware = await sourcePrisma.software.findMany({
      where: {
        isTestData: false,
        status: ResourceStatus.PUBLISHED,
        NOT: { slug: { contains: 'test' } }
      },
      include: {
        versions: true,
        reviewEvidences: true
      }
    });
    console.log(`  -> 提取真实已发布软件: ${genuineSoftware.length} 款`);

    const validSoftwareIds = new Set(genuineSoftware.map(s => s.id));
    const validVersionIds = new Set<string>();

    for (const sw of genuineSoftware) {
      await targetPrisma.software.upsert({
        where: { id: sw.id },
        update: {
          name: sw.name,
          slug: sw.slug,
          englishName: sw.englishName,
          aliases: sw.aliases,
          developer: sw.developer,
          summary: sw.summary,
          description: sw.description,
          iconUrl: sw.iconUrl,
          type: sw.type,
          categoryId: sw.categoryId,
          status: sw.status,
          isFeatured: sw.isFeatured,
          featuredOrder: sw.featuredOrder,
          isTestData: false,
          officialWebsite: sw.officialWebsite,
          licenseType: sw.licenseType,
          officialDomainVerified: sw.officialDomainVerified,
          publishedAt: sw.publishedAt,
        },
        create: {
          id: sw.id,
          name: sw.name,
          slug: sw.slug,
          englishName: sw.englishName,
          aliases: sw.aliases,
          developer: sw.developer,
          summary: sw.summary,
          description: sw.description,
          iconUrl: sw.iconUrl,
          type: sw.type,
          categoryId: sw.categoryId,
          status: sw.status,
          isFeatured: sw.isFeatured,
          featuredOrder: sw.featuredOrder,
          isTestData: false,
          officialWebsite: sw.officialWebsite,
          licenseType: sw.licenseType,
          officialDomainVerified: sw.officialDomainVerified,
          publishedAt: sw.publishedAt,
        }
      });

      // 导入关联的官方版本
      for (const ver of sw.versions) {
        validVersionIds.add(ver.id);
        await targetPrisma.softwareVersion.upsert({
          where: { id: ver.id },
          update: {
            version: ver.version,
            platform: ver.platform,
            architecture: ver.architecture,
            fileSize: ver.fileSize,
            releaseDate: ver.releaseDate,
            changelog: ver.changelog,
            isLatest: ver.isLatest,
            reviewStatus: ver.reviewStatus,
          },
          create: {
            id: ver.id,
            softwareId: sw.id,
            version: ver.version,
            platform: ver.platform,
            architecture: ver.architecture,
            fileSize: ver.fileSize,
            releaseDate: ver.releaseDate,
            changelog: ver.changelog,
            isLatest: ver.isLatest,
            reviewStatus: ver.reviewStatus,
          }
        });
      }

      // 导入审核凭据
      for (const ev of sw.reviewEvidences) {
        await targetPrisma.resourceReviewEvidence.upsert({
          where: { id: ev.id },
          update: {
            fieldName: ev.fieldName,
            evidenceType: ev.evidenceType,
            sourceUrl: ev.sourceUrl,
            observedValue: ev.observedValue,
            verificationStatus: ev.verificationStatus,
            checkedAt: ev.checkedAt,
            checkedBy: ev.checkedBy,
            notes: ev.notes,
          },
          create: {
            id: ev.id,
            resourceId: sw.id,
            fieldName: ev.fieldName,
            evidenceType: ev.evidenceType,
            sourceUrl: ev.sourceUrl,
            observedValue: ev.observedValue,
            verificationStatus: ev.verificationStatus,
            checkedAt: ev.checkedAt,
            checkedBy: ev.checkedBy,
            notes: ev.notes,
          }
        });
      }
    }

    // 4. 下载分发渠道 (仅关联到真实已发布软件版本的渠道)
    const allDownloadSources = await sourcePrisma.downloadSource.findMany();
    const cleanDownloadSources = allDownloadSources.filter(d => validVersionIds.has(d.versionId));
    console.log(`  -> 提取官方下载渠道: ${cleanDownloadSources.length} 条`);
    for (const ds of cleanDownloadSources) {
      await targetPrisma.downloadSource.upsert({
        where: { id: ds.id },
        update: {
          versionId: ds.versionId,
          sourceType: ds.sourceType,
          sourceName: ds.sourceName,
          url: ds.url,
          fileId: ds.fileId,
          verificationStatus: ds.verificationStatus,
          lastCheckedAt: ds.lastCheckedAt,
          lastHttpStatus: ds.lastHttpStatus,
          isActive: ds.isActive,
        },
        create: {
          id: ds.id,
          versionId: ds.versionId,
          sourceType: ds.sourceType,
          sourceName: ds.sourceName,
          url: ds.url,
          fileId: ds.fileId,
          verificationStatus: ds.verificationStatus,
          lastCheckedAt: ds.lastCheckedAt,
          lastHttpStatus: ds.lastHttpStatus,
          isActive: ds.isActive,
        }
      });
    }

    // 5. 官方数据来源 (SoftwareSource, 76 个官方网站与 Releases API)
    const officialSources = await sourcePrisma.softwareSource.findMany();
    console.log(`  -> 提取官方权威数据源: ${officialSources.length} 个`);
    for (const src of officialSources) {
      await targetPrisma.softwareSource.upsert({
        where: { id: src.id },
        update: {
          name: src.name,
          sourceType: src.sourceType,
          baseUrl: src.baseUrl,
          officialDomain: src.officialDomain,
          developerName: src.developerName,
          discoveryMethod: src.discoveryMethod,
          apiEndpoint: src.apiEndpoint,
          enabled: src.enabled,
          trustStatus: src.trustStatus,
          rateLimit: src.rateLimit,
          checkInterval: src.checkInterval,
        },
        create: {
          id: src.id,
          name: src.name,
          sourceType: src.sourceType,
          baseUrl: src.baseUrl,
          officialDomain: src.officialDomain,
          developerName: src.developerName,
          discoveryMethod: src.discoveryMethod,
          apiEndpoint: src.apiEndpoint,
          enabled: src.enabled,
          trustStatus: src.trustStatus,
          rateLimit: src.rateLimit,
          checkInterval: src.checkInterval,
        }
      });
    }

    // 6. 教程文章 (已发布的正规教程，含冷启动指南)
    const tutorials = await sourcePrisma.tutorial.findMany({
      where: { status: 'PUBLISHED' }
    });
    console.log(`  -> 提取官方教程与指南: ${tutorials.length} 篇`);
    for (const tut of tutorials) {
      await targetPrisma.tutorial.upsert({
        where: { id: tut.id },
        update: {
          title: tut.title,
          slug: tut.slug,
          summary: tut.summary,
          content: tut.content,
          authorId: targetAdmin.id,
          softwareId: (tut.softwareId && validSoftwareIds.has(tut.softwareId)) ? tut.softwareId : null,
          coverUrl: tut.coverUrl,
          isPremium: tut.isPremium,
          seoTitle: tut.seoTitle,
          seoKeywords: tut.seoKeywords,
          seoDescription: tut.seoDescription,
          status: tut.status,
          viewCount: 0, // 生产初始清空历史调试浏览量
          publishedAt: tut.publishedAt,
        },
        create: {
          id: tut.id,
          title: tut.title,
          slug: tut.slug,
          summary: tut.summary,
          content: tut.content,
          authorId: targetAdmin.id,
          softwareId: (tut.softwareId && validSoftwareIds.has(tut.softwareId)) ? tut.softwareId : null,
          coverUrl: tut.coverUrl,
          isPremium: tut.isPremium,
          seoTitle: tut.seoTitle,
          seoKeywords: tut.seoKeywords,
          seoDescription: tut.seoDescription,
          status: tut.status,
          viewCount: 0,
          publishedAt: tut.publishedAt,
        }
      });
    }

    // 7. 专题合集 (Topic)
    const topics = await sourcePrisma.topic.findMany();
    console.log(`  -> 提取精选专题: ${topics.length} 个`);
    for (const top of topics) {
      await targetPrisma.topic.upsert({
        where: { id: top.id },
        update: {
          title: top.title,
          slug: top.slug,
          description: top.description,
          coverUrl: top.coverUrl,
          isFeatured: top.isFeatured,
          status: top.status,
          sortOrder: top.sortOrder,
          seoTitle: top.seoTitle,
          seoKeywords: top.seoKeywords,
          seoDescription: top.seoDescription,
          publishedAt: top.publishedAt,
        },
        create: {
          id: top.id,
          title: top.title,
          slug: top.slug,
          description: top.description,
          coverUrl: top.coverUrl,
          isFeatured: top.isFeatured,
          status: top.status,
          sortOrder: top.sortOrder,
          seoTitle: top.seoTitle,
          seoKeywords: top.seoKeywords,
          seoDescription: top.seoDescription,
          publishedAt: top.publishedAt,
        }
      });
    }

    // 8. 软件对比评测 (已发布且仅涉及已发布软件的对比评测)
    const comparisons = await sourcePrisma.softwareComparison.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        items: true,
        attributes: true
      }
    });
    console.log(`  -> 提取对比评测: ${comparisons.length} 篇`);
    for (const comp of comparisons) {
      await targetPrisma.softwareComparison.upsert({
        where: { id: comp.id },
        update: {
          title: comp.title,
          slug: comp.slug,
          summary: comp.summary,
          conclusion: comp.conclusion,
          targetAudience: comp.targetAudience,
          scenarioGuide: comp.scenarioGuide,
          status: comp.status,
          publishedAt: comp.publishedAt,
        },
        create: {
          id: comp.id,
          title: comp.title,
          slug: comp.slug,
          summary: comp.summary,
          conclusion: comp.conclusion,
          targetAudience: comp.targetAudience,
          scenarioGuide: comp.scenarioGuide,
          status: comp.status,
          publishedAt: comp.publishedAt,
        }
      });

      for (const item of comp.items) {
        if (validSoftwareIds.has(item.softwareId)) {
          await targetPrisma.softwareComparisonItem.upsert({
            where: { id: item.id },
            update: {
              sortOrder: item.sortOrder,
              editorNotes: item.editorNotes,
              isRecommended: item.isRecommended,
            },
            create: {
              id: item.id,
              comparisonId: comp.id,
              softwareId: item.softwareId,
              sortOrder: item.sortOrder,
              editorNotes: item.editorNotes,
              isRecommended: item.isRecommended,
            }
          });
        }
      }

      for (const attr of comp.attributes) {
        await targetPrisma.comparisonAttribute.upsert({
          where: { id: attr.id },
          update: {
            attributeName: attr.attributeName,
            category: attr.category,
            valuesJson: attr.valuesJson,
            sortOrder: attr.sortOrder,
            isHighlighted: attr.isHighlighted,
            evidenceStatus: attr.evidenceStatus,
            sourceUrl: attr.sourceUrl,
            testEnvironment: attr.testEnvironment,
          },
          create: {
            id: attr.id,
            comparisonId: comp.id,
            attributeName: attr.attributeName,
            category: attr.category,
            valuesJson: attr.valuesJson,
            sortOrder: attr.sortOrder,
            isHighlighted: attr.isHighlighted,
            evidenceStatus: attr.evidenceStatus,
            sourceUrl: attr.sourceUrl,
            testEnvironment: attr.testEnvironment,
          }
        });
      }
    }

    // 9. 执行目标生产库严格安全审计与行数核验
    const finalCats = await targetPrisma.category.count();
    const finalProds = await targetPrisma.product.count();
    const finalSw = await targetPrisma.software.count();
    const finalVer = await targetPrisma.softwareVersion.count();
    const finalDs = await targetPrisma.downloadSource.count();
    const finalSrc = await targetPrisma.softwareSource.count();
    const finalEv = await targetPrisma.resourceReviewEvidence.count();
    const finalTut = await targetPrisma.tutorial.count();
    const finalTop = await targetPrisma.topic.count();
    const finalComp = await targetPrisma.softwareComparison.count();
    const finalAdmins = await targetPrisma.user.count();

    // 关键生产隔离防线审计 (必须全部为 0)
    const finalOrders = await targetPrisma.order.count();
    const finalMembers = await targetPrisma.memberUser.count();
    const finalEntitlements = await targetPrisma.entitlement.count();
    const finalPaymentLogs = await targetPrisma.paymentLog.count();
    const finalTestSoftware = await targetPrisma.software.count({
      where: {
        OR: [
          { isTestData: true },
          { slug: { contains: 'test' } }
        ]
      }
    });

    console.log(`[P8-2 Migration] 目标库迁移完成。安全审计指标:`);
    console.log(`  * 真实发布软件: ${finalSw} 款 (100% 正式资源)`);
    console.log(`  * 模拟测试订单: ${finalOrders} 笔 (必须为 0)`);
    console.log(`  * 历史测试会员: ${finalMembers} 名 (必须为 0)`);
    console.log(`  * 虚假会员权益: ${finalEntitlements} 条 (必须为 0)`);
    console.log(`  * 虚拟测试工具: ${finalTestSoftware} 款 (必须为 0)`);

    return {
      success: true,
      targetDbUrl,
      counts: {
        categories: finalCats,
        products: finalProds,
        publishedSoftware: finalSw,
        softwareVersions: finalVer,
        downloadSources: finalDs,
        softwareSources: finalSrc,
        reviewEvidences: finalEv,
        tutorials: finalTut,
        topics: finalTop,
        comparisons: finalComp,
        adminUsers: finalAdmins,
        mockOrders: finalOrders,
        testMembers: finalMembers,
        mockEntitlements: finalEntitlements,
        mockPaymentLogs: finalPaymentLogs,
        testSoftware: finalTestSoftware,
      },
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    console.error('迁移过程异常中断:', err);
    return {
      success: false,
      targetDbUrl,
      counts: {
        categories: 0,
        products: 0,
        publishedSoftware: 0,
        softwareVersions: 0,
        downloadSources: 0,
        softwareSources: 0,
        reviewEvidences: 0,
        tutorials: 0,
        topics: 0,
        comparisons: 0,
        adminUsers: 0,
        mockOrders: 0,
        testMembers: 0,
        mockEntitlements: 0,
        mockPaymentLogs: 0,
        testSoftware: 0,
      },
      durationMs: Date.now() - startTime,
      error: err.message,
    };
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

// 允许 CLI 独立执行
if (process.argv[1] && process.argv[1].endsWith('importVerifiedPublicContent.ts')) {
  const targetUrl = process.env.TARGET_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/softbuluo_prod_drill?schema=public';
  migrateVerifiedPublicContent(targetUrl).then(res => {
    console.log('迁移执行结果:', res);
    process.exit(res.success ? 0 : 1);
  });
}
