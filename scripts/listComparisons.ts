import { prisma } from '../server/src/db';

async function main() {
  const comps = await prisma.softwareComparison.findMany({
    include: {
      attributes: true,
      items: true
    }
  });

  console.log(`Comparisons count: ${comps.length}`);
  comps.forEach(c => {
    console.log(`- Comparison: ${c.title} (slug: ${c.slug}, status: ${c.status})`);
    c.attributes.forEach(a => {
      console.log(`   * [${a.category}] ${a.attributeName}: ${a.valuesJson} (evidence: ${a.evidenceStatus})`);
    });
  });

  await prisma.$disconnect();
}

main().catch(console.error);
