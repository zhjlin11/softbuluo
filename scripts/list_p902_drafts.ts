import { prisma } from '../server/src/db';

async function main() {
  const drafts = await prisma.software.findMany({
    where: { status: 'DRAFT', isTestData: false },
    include: {
      category: { select: { name: true, slug: true } },
      versions: {
        include: {
          downloadSources: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log(`=== P902 REMAINING DRAFTS: ${drafts.length} 款 ===\n`);
  drafts.forEach((d, idx) => {
    const v = d.versions[0];
    const sourceCount = d.versions.reduce((acc, ver) => acc + ver.downloadSources.length, 0);
    const urls = d.versions.flatMap(ver => ver.downloadSources.map(s => s.url));
    console.log(`[${idx + 1}] ${d.name} (${d.slug})`);
    console.log(`    类别: ${d.type} | 目录: ${d.category?.name || '无'} | 开发者: ${d.developer || '未填'}`);
    console.log(`    当前库内版本: ${v?.version || '无'} | 发布日期: ${v?.releaseDate || '无'} | 下载源: ${sourceCount} 个`);
    if (urls.length > 0) {
      console.log(`    首个下载源 URL: ${urls[0]}`);
    }
    console.log(`    简介: ${d.summary?.slice(0, 80) || '无'}`);
    console.log('');
  });

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
