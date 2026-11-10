import { prisma } from '../server/src/db';

async function main() {
  const admin = await prisma.user.findFirst();
  console.log('Admin user found:', admin?.id, admin?.username, admin?.email);
  await prisma.$disconnect();
}

main().catch(console.error);
