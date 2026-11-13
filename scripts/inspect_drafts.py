import asyncio
import json
import subprocess

# Query all DRAFT software from local database using tsx
code = """
import { prisma } from '../server/src/db';

async function main() {
  const drafts = await prisma.software.findMany({
    where: { status: 'DRAFT', isTestData: false },
    include: {
      versions: {
        include: {
          downloadSources: true
        }
      },
      sources: true,
    },
    orderBy: { name: 'asc' }
  });

  console.log(JSON.stringify(drafts.map(d => {
    const totalDlSources = d.versions.reduce((acc, v) => acc + v.downloadSources.length, 0);
    return {
      id: d.id,
      name: d.name,
      slug: d.slug,
      type: d.type,
      category: d.category,
      developer: d.developer,
      officialWebsite: d.officialWebsite,
      license: d.license,
      isFree: d.isFree,
      summary: d.summary ? d.summary.slice(0, 50) : null,
      iconUrl: d.iconUrl,
      versionCount: d.versions.length,
      latestVersion: d.versions.find(v => v.isLatest)?.version || (d.versions[0]?.version ?? null),
      sourceCount: d.sources.length,
      downloadSourceCount: totalDlSources,
    };
  }), null, 2));
}

main().finally(() => prisma.$disconnect());
"""

with open('scripts/tmp_query_drafts.ts', 'w', encoding='utf-8') as f:
    f.write(code)

res = subprocess.check_output(['npx', 'tsx', 'scripts/tmp_query_drafts.ts'], shell=True).decode('utf-8')
data = json.loads(res)
print(f"Total DRAFT software in local DB: {len(data)}")

# Group by category / type
categories = {}
for d in data:
    cat = f"[{d['type']}][{d['category']}]"
    categories.setdefault(cat, []).append(d)

for cat, sw_list in categories.items():
    print(f"\n=== {cat} ({len(sw_list)}) ===")
    for sw in sw_list:
        print(f"  • {sw['name']} ({sw['slug']}) | Dev: {sw['developer']} | Ver: {sw['latestVersion']} | Web: {sw['officialWebsite']} | DL Sources: {sw['downloadSourceCount']}")
