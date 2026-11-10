import { prisma } from '../server/src/db';

async function main() {
  const topics = await prisma.topic.findMany({ select: { id: true, title: true, slug: true, status: true } });
  const tutorials = await prisma.tutorial.findMany({ select: { id: true, title: true, slug: true, status: true } });
  console.log(`Current Topics (${topics.length}):`, topics.map(t => `${t.title} (${t.slug})`));
  console.log(`Current Tutorials (${tutorials.length}):`, tutorials.map(t => `${t.title} (${t.slug})`));
  await prisma.$disconnect();
}

main().catch(console.error);
