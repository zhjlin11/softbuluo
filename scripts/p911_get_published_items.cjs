const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const fs = require('fs');

async function main() {
  const software = await p.software.findMany({
    where: { status: 'PUBLISHED', isTestData: false },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      versions: {
        include: {
          downloadSources: {
            where: { isActive: true },
            select: { id: true, sourceName: true, url: true, sourceType: true, verificationStatus: true, platform: true, architecture: true, sha256: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  const tutorials = await p.tutorial.findMany({
    where: {
      status: 'PUBLISHED',
      slug: { not: { startsWith: 'tut-p3-' } }
    },
    include: {
      software: { select: { id: true, name: true, slug: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Published Software count: ${software.length}`);
  console.log(`Published Tutorials count: ${tutorials.length}`);

  const output = {
    softwareCount: software.length,
    tutorialCount: tutorials.length,
    software: software.map(s => {
      const allActiveSources = s.versions.flatMap(v => v.downloadSources);
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        type: s.type,
        categoryName: s.category?.name || '未分类',
        categorySlug: s.category?.slug || '',
        summary: s.summary,
        description: s.description || '',
        developer: s.developer,
        licenseType: s.licenseType,
        officialUrl: s.officialUrl,
        latestVersion: s.latestVersion,
        downloadCount: s.downloadCount,
        viewCount: s.viewCount,
        rating: s.rating,
        versionsCount: s.versions.length,
        activeSourcesCount: allActiveSources.length,
        downloadSources: allActiveSources,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    }),
    tutorials: tutorials.map(t => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      summary: t.summary,
      content: t.content || '',
      contentLength: t.content ? t.content.length : 0,
      seoTitle: t.seoTitle,
      seoKeywords: t.seoKeywords,
      seoDescription: t.seoDescription,
      viewCount: t.viewCount,
      isPremium: t.isPremium,
      softwareName: t.software?.name || null,
      softwareSlug: t.software?.slug || null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }))
  };

  fs.writeFileSync('published_inventory.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log('Successfully written published_inventory.json');
  await p.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
