import { prisma } from '../server/src/db';

async function main() {
  const reviews = await prisma.softwareReview.findMany({
    include: { software: true }
  });
  console.log(`Reviews count: ${reviews.length}`);
  for (const r of reviews) {
    const isTest = r.title.includes('测试') || r.content.includes('测试') || r.software.isTestData;
    if (isTest) {
      await prisma.softwareReview.update({
        where: { id: r.id },
        data: { isTestReview: true }
      });
      console.log(`Marked test review: "${r.title}" on ${r.software.name}`);
    }
  }
  await prisma.$disconnect();
}

main().catch(console.error);
