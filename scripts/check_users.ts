import { PrismaClient } from '@prisma/client';
import { verifyPassword, hashPassword } from '../server/src/utils/security';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, username: true, email: true, role: true, passwordHash: true } });
  console.log('System Users:', users);
  for (const u of users) {
    const ok = await verifyPassword('Admin@123456', u.passwordHash);
    console.log(`Password match for ${u.email}:`, ok);
    if (!ok) {
      console.log('Resetting password to Admin@123456 for test environment...');
      const newHash = await hashPassword('Admin@123456');
      await prisma.user.update({ where: { id: u.id }, data: { passwordHash: newHash } });
      console.log('Password updated successfully!');
    }
  }
}

main().finally(() => prisma.$disconnect());
