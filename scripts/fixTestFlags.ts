import { prisma } from '../server/src/db';

async function main() {
  await prisma.software.updateMany({
    where: { slug: { in: ['memtest86', 'luanti-minetest'] } },
    data: { isTestData: false }
  });
  console.log('Fixed isTestData flags on real tools.');
  await prisma.$disconnect();
}

main().catch(console.error);
