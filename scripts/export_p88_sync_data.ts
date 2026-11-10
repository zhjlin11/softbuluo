import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('📦 正在导出全部非测试真实业务数据 (包含下载源、专题、对比评测、替代推荐与许可)...');

  const softwares = await prisma.software.findMany({
    where: { isTestData: false },
    include: {
      versions: {
        include: { downloadSources: true },
      },
      licenses: true,
    },
  });

  const topics = await prisma.topic.findMany({
    include: {
      resources: {
        include: {
          software: { select: { slug: true, isTestData: true } },
        },
      },
    },
  });

  const comparisons = await prisma.softwareComparison.findMany({
    include: {
      items: {
        include: { software: { select: { slug: true, isTestData: true } } },
      },
      attributes: true,
    },
  });

  const alternatives = await prisma.softwareAlternative.findMany({
    include: {
      software: { select: { slug: true, isTestData: true } },
      alternativeSoftware: { select: { slug: true, isTestData: true } },
    },
  });

  const products = await prisma.product.findMany();

  const payload = {
    softwares,
    topics,
    comparisons,
    alternatives: alternatives.filter((a) => !a.software.isTestData && !a.alternativeSoftware.isTestData),
    products,
  };

  const json = JSON.stringify(payload, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2);
  fs.writeFileSync('p88_sync_data.json', json, 'utf-8');

  let dsCount = 0;
  softwares.forEach((s) => s.versions.forEach((v) => (dsCount += v.downloadSources.length)));
  console.log(
    `✅ 导出完毕: 软件=${softwares.length}, 下载源=${dsCount}, 专题=${topics.length}, 横向对比=${comparisons.length}, 替代关系=${payload.alternatives.length}, 产品=${products.length}`
  );
}

main()
  .catch((e) => {
    console.error('❌ 导出失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
