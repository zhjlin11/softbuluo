import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sw = await prisma.software.findFirst({
    where: { slug: '7zip' },
    include: {
      versions: {
        include: {
          downloadSources: true
        }
      },
      sources: true,
      licenses: true
    }
  });
  console.log('Sample Software Structure:');
  console.log(JSON.stringify(sw, null, 2));
}

main().finally(() => prisma.$disconnect());
