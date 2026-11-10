import { createInitialSuperAdmin } from '../modules/auth/authService';
import { prisma } from '../db';
import { validatePasswordStrength } from '../utils/passwordPolicy';

async function run() {
  const email = process.env.ADMIN_EMAIL || process.argv[2];
  const username = process.env.ADMIN_USERNAME || process.argv[3];
  const password = process.env.ADMIN_PASSWORD || process.argv[4];

  if (!email || !username || !password) {
    console.error('❌ 错误: 必须通过环境变量或命令行参数指定管理员账号凭据:');
    console.error('   例如: ADMIN_EMAIL=... ADMIN_USERNAME=... ADMIN_PASSWORD=... npx tsx server/src/scripts/initAdmin.ts');
    process.exit(1);
  }

  const strength = validatePasswordStrength(password);
  if (!strength.valid) {
    console.error(`❌ 密码强度不达标: ${strength.reason}`);
    process.exit(1);
  }

  console.log(`🔐 正在安全初始化超级管理员 [${username}] (${email})...`);

  try {
    const admin = await createInitialSuperAdmin(email, username, password);
    console.log(`✅ 超级管理员创建成功！ID: ${admin.id}, Role: ${admin.role} (密码强度校验通过，凭据不予打印)`);
  } catch (err: any) {
    console.error(`❌ 创建失败: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

run();
