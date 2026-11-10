import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function run() {
  const categories = await prisma.category.findMany();
  const softwares = await prisma.software.findMany({
    include: {
      versions: true,
      sources: true,
    },
  });
  const tutorials = await prisma.tutorial.findMany();
  const users = await prisma.user.findMany();

  const data = {
    categories,
    softwares,
    tutorials,
    users,
  };

  const outputPath = path.resolve(process.cwd(), 'db_export.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ 成功导出数据至 ${outputPath}`);
  console.log(`- 分类: ${categories.length}`);
  console.log(`- 软件: ${softwares.length}`);
  console.log(`- 教程: ${tutorials.length}`);
  console.log(`- 用户: ${users.length}`);
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
