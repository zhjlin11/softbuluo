import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const slugs = ['windows-11', 'windows-10', 'windows-ltsc', 'windows-server', 'windows-7', 'office-2024', 'office-2021', 'microsoft-365', 'office-mac', 'ab-download-manager'];
  const existing = await prisma.software.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, name: true, slug: true }
  });
  console.log('Existing target softwares:', existing);
}

main().finally(() => prisma.$disconnect());
