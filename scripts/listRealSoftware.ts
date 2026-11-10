import { prisma } from '../server/src/db';

async function main() {
  const list = await prisma.software.findMany({
    where: { isTestData: false, NOT: { slug: { startsWith: 'test-' } } },
    select: {
      id: true,
      name: true,
      slug: true,
      developer: true,
      officialWebsite: true,
      licenseType: true,
      iconUrl: true,
      status: true,
      type: true
    }
  });
  console.log(`Real software count: ${list.length}`);
  console.log(JSON.stringify(list, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
