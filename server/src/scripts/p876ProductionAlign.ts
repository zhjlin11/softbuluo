import { prisma } from '../db';
import { ResourceStatus, ComparisonStatus } from '@prisma/client';

async function fixVscodeVsSublime() {
  console.log('🔄 修复 vscode-vs-sublime 关联软件 ID...');
  const comp = await prisma.softwareComparison.findUnique({
    where: { slug: 'vscode-vs-sublime' },
    include: { items: true, attributes: true },
  });

  const publishedVsCode = await prisma.software.findFirst({
    where: { slug: 'vscode', status: ResourceStatus.PUBLISHED, isTestData: false },
  });

  if (comp && publishedVsCode) {
    for (const it of comp.items) {
      if (it.softwareId !== publishedVsCode.id) {
        const sw = await prisma.software.findUnique({ where: { id: it.softwareId } });
        if (sw && (sw.slug === 'vs-code' || sw.slug === 'vscode') && sw.status !== ResourceStatus.PUBLISHED) {
          console.log(`更新 item ${it.id} 从 ${it.softwareId} 到 ${publishedVsCode.id}`);
          await prisma.softwareComparisonItem.update({
            where: { id: it.id },
            data: { softwareId: publishedVsCode.id },
          });
        }
      }
    }

    // 修复 attributes valuesJson
    for (const attr of comp.attributes) {
      const valObj = attr.valuesJson as Record<string, any>;
      const keys = Object.keys(valObj);
      let updated = false;
      const newObj: Record<string, any> = {};

      for (const k of keys) {
        if (k !== publishedVsCode.id) {
          const sw = await prisma.software.findUnique({ where: { id: k } });
          if (sw && (sw.slug === 'vs-code' || sw.slug === 'vscode') && sw.status !== ResourceStatus.PUBLISHED) {
            newObj[publishedVsCode.id] = valObj[k];
            updated = true;
          } else {
            newObj[k] = valObj[k];
          }
        } else {
          newObj[k] = valObj[k];
        }
      }

      if (updated) {
        await prisma.comparisonAttribute.update({
          where: { id: attr.id },
          data: { valuesJson: newObj },
        });
      }
    }
  }

  // 重新统计
  const comps = await prisma.softwareComparison.findMany({
    where: { status: ComparisonStatus.PUBLISHED },
    include: { items: { include: { software: true } } },
  });
  for (const c of comps) {
    const valid = c.items.filter((it) => it.software.status === ResourceStatus.PUBLISHED && !it.software.isTestData);
    console.log(`对比 ${c.slug}: 有效已发布项数 ${valid.length} / ${c.items.length}`);
  }
}

fixVscodeVsSublime()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
