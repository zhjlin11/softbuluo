import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const short1 = await prisma.tutorial.findUnique({ where: { slug: 'clean-install-win11-guide' } });
  const short2 = await prisma.tutorial.findUnique({ where: { slug: '7zip-aes256-encryption-tutorial' } });
  console.log('short1:', short1?.title, '| Content:', short1?.content);
  console.log('short2:', short2?.title, '| Content:', short2?.content);

  const sampleLong = await prisma.tutorial.findUnique({ where: { slug: 'how-to-verify-genuine-iso-checksums' } });
  console.log('\n--- SAMPLE LONG TUTORIAL CONTENT ---');
  console.log(sampleLong?.content);
}

main().finally(() => prisma.$disconnect());
