import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.resolve(process.cwd(), 'p88_sync_data.json');
  if (!fs.existsSync(filePath)) {
    console.error('❌ 未找到 p88_sync_data.json');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log('🌱 开始同步生产数据库...');

  // 建立本地 softwareId / slug -> 生产 softwareId 映射表
  const slugToProdSwId = new Map<string, string>();
  const localSwIdToProdSwId = new Map<string, string>();

  // 1. 同步软件版本、下载源与许可记录
  let dsSynced = 0;
  let licSynced = 0;

  for (const localSw of data.softwares || []) {
    const prodSw = await prisma.software.findUnique({ where: { slug: localSw.slug } });
    if (!prodSw) continue;

    slugToProdSwId.set(localSw.slug, prodSw.id);
    localSwIdToProdSwId.set(localSw.id, prodSw.id);

    // 同步许可记录
    for (const lic of localSw.licenses || []) {
      const existingLic = await prisma.resourceLicense.findFirst({
        where: { softwareId: prodSw.id, licenseType: lic.licenseType },
      });
      if (!existingLic) {
        await prisma.resourceLicense.create({
          data: {
            softwareId: prodSw.id,
            licenseType: lic.licenseType,
            redistributionAllowed: lic.redistributionAllowed,
            commercialRedistributionAllowed: lic.commercialRedistributionAllowed,
            licenseUrl: lic.licenseUrl,
            reviewStatus: lic.reviewStatus,
          },
        });
        licSynced++;
      }
    }

    // 同步版本与下载源
    for (const localVer of localSw.versions || []) {
      let prodVer = await prisma.softwareVersion.findFirst({
        where: { softwareId: prodSw.id, version: localVer.version },
      });
      if (!prodVer) {
        prodVer = await prisma.softwareVersion.create({
          data: {
            softwareId: prodSw.id,
            version: localVer.version,
            platform: localVer.platform,
            architecture: localVer.architecture,
            fileSize: localVer.fileSize,
            releaseDate: localVer.releaseDate,
            changelog: localVer.changelog,
            isLatest: localVer.isLatest,
            reviewStatus: localVer.reviewStatus,
          },
        });
      } else if (localVer.isLatest && !prodVer.isLatest) {
        await prisma.softwareVersion.update({
          where: { id: prodVer.id },
          data: { isLatest: true },
        });
      }

      for (const localDs of localVer.downloadSources || []) {
        const existingDs = await prisma.downloadSource.findFirst({
          where: {
            versionId: prodVer.id,
            url: localDs.url,
            platform: localDs.platform || 'windows',
            architecture: localDs.architecture || 'x64',
          },
        });

        const dsFields = {
          sourceType: localDs.sourceType,
          sourceName: localDs.sourceName,
          url: localDs.url,
          directFileUrl: localDs.directFileUrl,
          fileName: localDs.fileName,
          fileVersion: localDs.fileVersion,
          platform: localDs.platform || 'windows',
          architecture: localDs.architecture || 'x64',
          sha256: localDs.sha256,
          fileSizeBytes: localDs.fileSizeBytes ? BigInt(localDs.fileSizeBytes) : null,
          fileSizeLabel: localDs.fileSizeLabel,
          mirrorAuthorizationStatus: localDs.mirrorAuthorizationStatus || 'NONE',
          scanStatus: localDs.scanStatus || 'PENDING',
          signatureStatus: localDs.signatureStatus || 'NOT_CHECKED',
          reviewStatus: localDs.reviewStatus || 'PENDING',
          verificationStatus: localDs.verificationStatus,
          lastCheckStatus: localDs.lastCheckStatus || 'UNKNOWN',
          lastFinalUrl: localDs.lastFinalUrl,
          priority: localDs.priority ?? 10,
          isActive: localDs.isActive,
        };

        if (existingDs) {
          await prisma.downloadSource.update({ where: { id: existingDs.id }, data: dsFields });
        } else {
          await prisma.downloadSource.create({
            data: {
              versionId: prodVer.id,
              ...dsFields,
            },
          });
        }
        dsSynced++;
      }
    }
  }
  console.log(`✅ 下载源与许可同步完毕: DownloadSource=${dsSynced}, ResourceLicense=${licSynced}`);

  // 2. 同步专题中心与关联资源
  let topicCount = 0;
  let topicResCount = 0;
  for (const t of data.topics || []) {
    const prodTopic = await prisma.topic.upsert({
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
        publishedAt: t.publishedAt ? new Date(t.publishedAt) : null,
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
        publishedAt: t.publishedAt ? new Date(t.publishedAt) : null,
      },
    });
    topicCount++;

    for (const tr of t.resources || []) {
      const targetSwId = tr.software?.slug ? slugToProdSwId.get(tr.software.slug) : undefined;
      if (!targetSwId) continue;

      const existingTr = await prisma.topicResource.findFirst({
        where: { topicId: prodTopic.id, softwareId: targetSwId },
      });
      if (!existingTr) {
        await prisma.topicResource.create({
          data: {
            topicId: prodTopic.id,
            softwareId: targetSwId,
            sortOrder: tr.sortOrder,
            customNote: tr.customNote,
          },
        });
        topicResCount++;
      }
    }
  }
  console.log(`✅ 专题中心同步完毕: 专题=${topicCount}, 关联软件=${topicResCount}`);

  // 3. 同步横向对比评测
  let compCount = 0;
  for (const c of data.comparisons || []) {
    const prodComp = await prisma.softwareComparison.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        summary: c.summary,
        conclusion: c.conclusion,
        targetAudience: c.targetAudience,
        scenarioGuide: c.scenarioGuide,
        status: c.status,
        publishedAt: c.publishedAt ? new Date(c.publishedAt) : null,
      },
      create: {
        slug: c.slug,
        title: c.title,
        summary: c.summary,
        conclusion: c.conclusion,
        targetAudience: c.targetAudience,
        scenarioGuide: c.scenarioGuide,
        status: c.status,
        publishedAt: c.publishedAt ? new Date(c.publishedAt) : null,
      },
    });
    compCount++;

    for (const item of c.items || []) {
      const targetSwId = item.software?.slug ? slugToProdSwId.get(item.software.slug) : undefined;
      if (!targetSwId) continue;
      await prisma.softwareComparisonItem.upsert({
        where: { comparisonId_softwareId: { comparisonId: prodComp.id, softwareId: targetSwId } },
        update: {
          sortOrder: item.sortOrder,
          editorNotes: item.editorNotes,
          isRecommended: item.isRecommended,
        },
        create: {
          comparisonId: prodComp.id,
          softwareId: targetSwId,
          sortOrder: item.sortOrder,
          editorNotes: item.editorNotes,
          isRecommended: item.isRecommended,
        },
      });
    }

    for (const attr of c.attributes || []) {
      // 将本地 valuesJson 中的 softwareId 键映射为生产环境 softwareId
      let remappedValues: Record<string, string> = {};
      try {
        const parsed = JSON.parse(attr.valuesJson || '{}');
        for (const [oldSwId, val] of Object.entries(parsed)) {
          const newId = localSwIdToProdSwId.get(oldSwId) || oldSwId;
          remappedValues[newId] = String(val);
        }
      } catch {}

      const existingAttr = await prisma.comparisonAttribute.findFirst({
        where: { comparisonId: prodComp.id, attributeName: attr.attributeName },
      });
      if (!existingAttr) {
        await prisma.comparisonAttribute.create({
          data: {
            comparisonId: prodComp.id,
            attributeName: attr.attributeName,
            category: attr.category,
            valuesJson: JSON.stringify(remappedValues),
            isHighlighted: attr.isHighlighted,
            sortOrder: attr.sortOrder,
            evidenceStatus: attr.evidenceStatus,
            sourceUrl: attr.sourceUrl,
            testEnvironment: attr.testEnvironment,
          },
        });
      }
    }
  }
  console.log(`✅ 横向评测同步完毕: 对比篇数=${compCount}`);

  // 4. 同步软件替代关系
  let altCount = 0;
  for (const a of data.alternatives || []) {
    const swId = a.software?.slug ? slugToProdSwId.get(a.software.slug) : undefined;
    const altId = a.alternativeSoftware?.slug ? slugToProdSwId.get(a.alternativeSoftware.slug) : undefined;
    if (!swId || !altId) continue;

    await prisma.softwareAlternative.upsert({
      where: { softwareId_alternativeSoftwareId: { softwareId: swId, alternativeSoftwareId: altId } },
      update: {
        reason: a.reason,
        relationType: a.relationType,
        reviewStatus: a.reviewStatus,
      },
      create: {
        softwareId: swId,
        alternativeSoftwareId: altId,
        reason: a.reason,
        relationType: a.relationType,
        reviewStatus: a.reviewStatus,
      },
    });
    altCount++;
  }
  console.log(`✅ 替代方案同步完毕: 关联条数=${altCount}`);

  // 5. 同步商品方案
  let prodCount = 0;
  for (const p of data.products || []) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        productType: p.productType,
        description: p.description,
        priceFen: p.priceFen,
        originalPriceFen: p.originalPriceFen,
        durationDays: p.durationDays,
        status: p.status,
        entitlementsConfig: p.entitlementsConfig,
        sortOrder: p.sortOrder,
      },
      create: {
        slug: p.slug,
        name: p.name,
        productType: p.productType,
        description: p.description,
        priceFen: p.priceFen,
        originalPriceFen: p.originalPriceFen,
        durationDays: p.durationDays,
        status: p.status,
        entitlementsConfig: p.entitlementsConfig,
        sortOrder: p.sortOrder,
      },
    });
    prodCount++;
  }
  console.log(`✅ 会员方案同步完毕: 产品数=${prodCount}`);

  console.log('🎉 P8.8 全量真实数据同步成功完成！');
}

main()
  .catch((e) => {
    console.error('❌ 导入异常:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
