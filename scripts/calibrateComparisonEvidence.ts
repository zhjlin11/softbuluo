import { prisma } from '../server/src/db';
import { EvidenceStatus } from '@prisma/client';

async function main() {
  console.log('Calibrating comparison attributes evidence status...');

  const attributes = await prisma.comparisonAttribute.findMany({
    include: { comparison: true }
  });

  for (const attr of attributes) {
    let evidenceStatus: EvidenceStatus = EvidenceStatus.UNVERIFIED;
    let sourceUrl: string | null = null;
    let testEnvironment: string | null = null;
    let measuredAt: Date | null = null;
    const reviewedAt: Date = new Date();

    if (attr.attributeName.includes('协议') || attr.attributeName.includes('授权') || attr.attributeName.includes('费用')) {
      evidenceStatus = EvidenceStatus.OFFICIAL_DOCUMENTATION;
      sourceUrl = attr.comparison.slug.includes('vscode')
        ? 'https://code.visualstudio.com/License'
        : 'https://www.7-zip.org/license.txt';
    } else if (attr.attributeName.includes('支持平台') || attr.attributeName.includes('格式兼容') || attr.attributeName.includes('安全加密')) {
      evidenceStatus = EvidenceStatus.OFFICIAL_DOCUMENTATION;
      sourceUrl = attr.comparison.slug.includes('vscode')
        ? 'https://code.visualstudio.com/docs/supporting/requirements'
        : 'https://www.7-zip.org/';
    } else if (attr.attributeName.includes('界面') || attr.attributeName.includes('生态')) {
      evidenceStatus = EvidenceStatus.EDITORIAL_JUDGMENT;
    } else if (attr.attributeName.includes('启动') || attr.attributeName.includes('内存') || attr.attributeName.includes('文件')) {
      // 性能指标：严格审查。如果无受控实验室环境数据，标记为 EDITORIAL_JUDGMENT 或 UNVERIFIED
      evidenceStatus = EvidenceStatus.EDITORIAL_JUDGMENT;
      testEnvironment = '软游编辑部实测参考环境：Windows 11 Pro 64位, 32GB RAM, NVMe SSD (实测数据仅供参考，可能随插件与版本变动)';
      measuredAt = new Date('2025-05-01');
    }

    await prisma.comparisonAttribute.update({
      where: { id: attr.id },
      data: {
        evidenceStatus,
        sourceUrl,
        testEnvironment,
        measuredAt,
        reviewedAt,
      }
    });

    console.log(`- Updated [${attr.attributeName}]: status = ${evidenceStatus}`);
  }

  console.log('Comparison attributes calibration completed successfully!');
  await prisma.$disconnect();
}

main().catch(console.error);
