const http = require('http');

async function main() {
  http.get('http://127.0.0.1:3008/sitemap-software.xml', (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      const locs = [];
      const regex = /<loc>(.*?)<\/loc>/g;
      let match;
      while ((match = regex.exec(data)) !== null) {
        locs.push(match[1]);
      }
      console.log(`Total URLs in sitemap-software.xml: ${locs.length}`);
      console.log('Sample 30 URLs:');
      locs.slice(0, 30).forEach(u => console.log('  ', u));
      console.log('\nLast 30 URLs:');
      locs.slice(-30).forEach(u => console.log('  ', u));

      // Check duplicates within sitemap-software.xml
      const counts = {};
      locs.forEach(u => counts[u] = (counts[u] || 0) + 1);
      const dupes = Object.entries(counts).filter(([_, c]) => c > 1);
      console.log(`Internal duplicates in sitemap-software.xml: ${dupes.length}`);
      dupes.forEach(([u, c]) => console.log(`  DUPE: ${u} x${c}`));
    });
  });
}

main().catch(console.error);
