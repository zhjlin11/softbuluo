import { prisma } from '../server/src/db';

async function main() {
  console.log('Cleaning up 404 upstream logo URLs...');
  const targets = ['everything', 'diskgenius', 'cpu-z', 'cpuz', 'geek-uninstaller', 'wireshark'];
  
  const res = await prisma.software.updateMany({
    where: { slug: { in: targets } },
    data: { iconUrl: '' },
  });

  console.log(`Updated ${res.count} software records to use native vector icons.`);
}

main().catch(console.error);
