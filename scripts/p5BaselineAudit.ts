import { PrismaClient } from '@prisma/client';
import { performDatabaseBackup } from '../server/src/scripts/backupRestoreManager';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Step 1: Performing Pre-P5 Database Backup ---');
  const backupRes = await performDatabaseBackup({
    outputFile: path.resolve(process.cwd(), 'backups/backup_pre_p5.dump'),
  });
  console.log('Backup result:', backupRes);

  console.log('\n--- Step 2: Querying Baseline Statistics ---');
  const totalSoftware = await prisma.software.count();
  const softwareOnly = await prisma.software.count({ where: { type: 'SOFTWARE' } });
  const gamesOnly = await prisma.software.count({ where: { type: 'GAME' } });
  const toolsOnly = await prisma.software.count({ where: { type: 'TOOL' } });

  const publishedSoftware = await prisma.software.count({ where: { status: 'PUBLISHED' } });
  const draftSoftware = await prisma.software.count({ where: { status: 'DRAFT' } });
  const pendingReviewSoftware = await prisma.software.count({ where: { status: 'PENDING_REVIEW' } });
  const testDataSoftware = await prisma.software.count({ where: { isTestData: true } });
  
  const softwareSources = await prisma.softwareSource.count();
  const verifiedSources = await prisma.softwareSource.count({ where: { trustStatus: 'VERIFIED' } });
  const downloadSources = await prisma.downloadSource.count();
  const categories = await prisma.category.count();
  const tutorials = await prisma.tutorial.count();
  const topics = await prisma.topic.count();
  const comparisons = await prisma.softwareComparison.count();
  const comparisonAttributes = await prisma.comparisonAttribute.count();
  const alternatives = await prisma.softwareAlternative.count();
  const reviews = await prisma.softwareReview.count();
  const orders = await prisma.order.count();
  const members = await prisma.memberUser.count();
  const jobs = await prisma.job.count();
  const jobRuns = await prisma.jobRun.count();
  const seoKeywords = await prisma.seoKeyword.count();
  const seoPageAudits = await prisma.seoPageAudit.count();
  const aiConfigs = await prisma.aiProviderConfig.count();
  const aiTasks = await prisma.aiGenerationTask.count();
  const aiLogs = await prisma.aiUsageLog.count();
  const searchQueryLogs = await prisma.searchQueryLog.count();
  const sitePageViews = await prisma.sitePageView.count();

  const allSoftware = await prisma.software.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      developer: true,
      officialWebsite: true,
      licenseType: true,
      status: true,
      type: true,
      isTestData: true,
      sources: {
        select: {
          id: true,
          sourceType: true,
          baseUrl: true,
          trustStatus: true
        }
      },
      versions: {
        select: {
          id: true,
          version: true,
          downloadSources: {
            select: {
              id: true,
              sourceType: true,
              url: true,
              verificationStatus: true,
              file: {
                select: {
                  scanStatus: true,
                  sha256: true,
                  signatureVerification: {
                    select: {
                      signatureStatus: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const baseline = {
    totalSoftware,
    softwareOnly,
    gamesOnly,
    toolsOnly,
    publishedSoftware,
    draftSoftware,
    pendingReviewSoftware,
    testDataSoftware,
    softwareSources,
    verifiedSources,
    downloadSources,
    categories,
    tutorials,
    topics,
    comparisons,
    comparisonAttributes,
    alternatives,
    reviews,
    orders,
    members,
    jobs,
    jobRuns,
    seoKeywords,
    seoPageAudits,
    aiConfigs,
    aiTasks,
    aiLogs,
    searchQueryLogs,
    sitePageViews,
    allSoftware,
    backupFile: backupRes.filePath,
    backupSizeBytes: backupRes.sizeBytes,
    backupSuccess: backupRes.success,
  };

  const outDir = 'C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/scratch';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outDir, 'p5_baseline_stats.json'),
    JSON.stringify(baseline, null, 2)
  );
  console.log('Baseline stats successfully written to scratch/p5_baseline_stats.json');
  console.log(JSON.stringify({
    totalSoftware,
    softwareOnly,
    gamesOnly,
    toolsOnly,
    publishedSoftware,
    draftSoftware,
    pendingReviewSoftware,
    testDataSoftware,
    softwareSources,
    verifiedSources,
    downloadSources,
    categories,
    tutorials,
    topics,
    comparisons,
    comparisonAttributes,
    alternatives,
    reviews,
    orders,
    members,
    jobs,
    seoKeywords,
    backupSize: backupRes.sizeBytes,
    backupSuccess: backupRes.success
  }, null, 2));

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error during baseline audit:', err);
  process.exit(1);
});
