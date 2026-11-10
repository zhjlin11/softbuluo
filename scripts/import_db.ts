import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function run() {
  const jsonPath = path.resolve(process.cwd(), 'db_export.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ 未找到 ${jsonPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(raw);

  console.log('🌱 开始导入数据库...');

  // 1. 用户
  if (data.users && data.users.length > 0) {
    for (const u of data.users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          email: u.email,
          username: u.username,
          passwordHash: u.passwordHash,
          role: u.role,
          status: u.status,
          avatarUrl: u.avatarUrl,
        },
      });
    }
    console.log(`✅ 已同步 ${data.users.length} 个管理员/用户账号`);
  }

  // 2. 分类
  if (data.categories && data.categories.length > 0) {
    for (const cat of data.categories) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          sortOrder: cat.sortOrder,
          isVisible: cat.isVisible,
        },
        create: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          sortOrder: cat.sortOrder,
          isVisible: cat.isVisible,
        },
      });
    }
    console.log(`✅ 已同步 ${data.categories.length} 个核心分类`);
  }

  // 3. 软件与版本、软件来源
  if (data.softwares && data.softwares.length > 0) {
    let sCount = 0;
    for (const s of data.softwares) {
      const { versions, sources, ...sData } = s;
      await prisma.software.upsert({
        where: { slug: sData.slug },
        update: {
          ...sData,
        },
        create: {
          ...sData,
        },
      });
      sCount++;

      // 导入版本
      if (versions && versions.length > 0) {
        for (const v of versions) {
          await prisma.softwareVersion.upsert({
            where: { id: v.id },
            update: { ...v },
            create: { ...v },
          });
        }
      }

      // 导入软件来源
      if (sources && sources.length > 0) {
        for (const src of sources) {
          await prisma.softwareSource.upsert({
            where: { id: src.id },
            update: { ...src },
            create: { ...src },
          });
        }
      }
    }
    console.log(`✅ 已同步 ${sCount} 个官方软件及关联版本和来源节点`);
  }

  // 4. 教程
  if (data.tutorials && data.tutorials.length > 0) {
    for (const t of data.tutorials) {
      await prisma.tutorial.upsert({
        where: { slug: t.slug },
        update: { ...t },
        create: { ...t },
      });
    }
    console.log(`✅ 已同步 ${data.tutorials.length} 篇软游实战与技术教程`);
  }

  console.log('🎉 数据库全部业务数据迁移完成！');
}

run()
  .catch((e) => {
    console.error('导入失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
