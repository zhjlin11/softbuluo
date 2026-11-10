import { prisma } from '../server/src/db';
import * as fs from 'fs';

async function main() {
  const items = await prisma.software.findMany({
    where: { isTestData: false },
    select: {
      name: true,
      slug: true,
      englishName: true,
      iconUrl: true,
      category: { select: { slug: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });

  fs.writeFileSync('scripts/all_software.json', JSON.stringify(items, null, 2), 'utf-8');
  console.log(`Saved ${items.length} items to scripts/all_software.json`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
