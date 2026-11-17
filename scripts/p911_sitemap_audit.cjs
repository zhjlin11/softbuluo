const http = require('http');

const sitemaps = [
  'sitemap.xml',
  'sitemap-software.xml',
  'sitemap-tutorials.xml',
  'sitemap-games.xml',
  'sitemap-essentials.xml',
  'sitemap-updates.xml',
  'sitemap-comparisons.xml',
  'sitemap-categories.xml',
  'sitemap-topics.xml',
  'sitemap-community.xml',
  'sitemap-developers.xml',
];

async function fetchUrl(path) {
  return new Promise((resolve) => {
    http.get('http://127.0.0.1:3008/' + path, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', (e) => resolve({ status: 500, error: e.message }));
  });
}

async function main() {
  console.log('=== SITEMAP AUDIT ON FASTIFY 3008 ===');
  const allUrls = new Set();
  const urlOccurrences = {};

  for (const sm of sitemaps) {
    const res = await fetchUrl(sm);
    if (res.status !== 200) {
      console.log(`❌ ${sm}: HTTP ${res.status}`);
      continue;
    }

    const locs = [];
    const regex = /<loc>(.*?)<\/loc>/g;
    let match;
    while ((match = regex.exec(res.data)) !== null) {
      locs.push(match[1]);
    }

    console.log(`✅ ${sm}: HTTP 200, URLs count: ${locs.length}`);

    // Check for duplicates or invalid entries
    for (const u of locs) {
      urlOccurrences[u] = (urlOccurrences[u] || 0) + 1;
      allUrls.add(u);
    }
  }

  console.log(`\nTotal Unique URLs across all sitemaps: ${allUrls.size}`);

  // Check duplicates across sitemaps (ignoring sitemap.xml index)
  const crossDuplicates = Object.entries(urlOccurrences).filter(([u, cnt]) => cnt > 1 && !u.endsWith('.xml'));
  console.log(`Cross-sitemap duplicate page URLs: ${crossDuplicates.length}`);
  if (crossDuplicates.length > 0) {
    crossDuplicates.slice(0, 10).forEach(([u, cnt]) => console.log(`  - ${u} (appears ${cnt} times)`));
  }
}

main().catch(console.error);
