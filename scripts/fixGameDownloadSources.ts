import { prisma } from '../server/src/db';
import { SourceType, VerificationStatus } from '@prisma/client';

async function main() {
  const games = [
    { slug: '0ad', url: 'https://play0ad.com/download/', version: '0.0.26', name: '0 A.D.' },
    { slug: 'supertuxkart', url: 'https://supertuxkart.net/Download', version: '1.4', name: 'SuperTuxKart' },
    { slug: 'battle-for-wesnoth', url: 'https://www.wesnoth.org/downloads/', version: '1.18.3', name: 'Battle for Wesnoth' },
    { slug: 'openttd', url: 'https://www.openttd.org/downloads/openttd-releases/latest', version: '14.1', name: 'OpenTTD' },
  ];

  for (const g of games) {
    const sw = await prisma.software.findUnique({
      where: { slug: g.slug },
      include: { versions: true }
    });

    if (sw) {
      let ver = sw.versions[0];
      if (!ver) {
        ver = await prisma.softwareVersion.create({
          data: {
            softwareId: sw.id,
            version: g.version,
            platform: 'Windows 10/11',
            architecture: 'x64',
            fileSize: '150 MB',
            releaseDate: '2025-01-01',
            isLatest: true,
            reviewStatus: 'APPROVED',
          }
        });
      }

      const existingDs = await prisma.downloadSource.findFirst({
        where: { versionId: ver.id }
      });

      if (!existingDs) {
        await prisma.downloadSource.create({
          data: {
            versionId: ver.id,
            sourceType: SourceType.OFFICIAL_EXTERNAL,
            sourceName: `${g.name} 官方下载`,
            url: g.url,
            verificationStatus: VerificationStatus.VERIFIED,
            lastHttpStatus: 200,
            lastCheckedAt: new Date(),
            isActive: true,
          }
        });
        console.log(`Added official download source for ${g.name}`);
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
