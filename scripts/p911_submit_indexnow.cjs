const inv = require('../published_inventory.json');

async function submitIndexNow() {
  const host = 'softtribe.top';
  const key = 'e3d7a8c9b2f14e5a9c8b7d6e5f4a3b2c';
  const keyLocation = `https://${host}/${key}.txt`;

  const urlList = [
    `https://${host}/`,
    `https://${host}/software`,
    `https://${host}/system-tools`,
    `https://${host}/games`,
    `https://${host}/essentials`,
    `https://${host}/tutorials`,
    `https://${host}/updates`,
    ...inv.software.map(s => `https://${host}/software/${s.slug}`),
    ...inv.tutorials.map(t => `https://${host}/tutorials/${t.slug}`),
  ];

  console.log(`Submitting ${urlList.length} URLs to IndexNow...`);

  const payload = {
    host,
    key,
    keyLocation,
    urlList,
  };

  // Submit to Bing / IndexNow
  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
  ];

  for (const ep of endpoints) {
    try {
      console.log(`Sending payload to ${ep}...`);
      const res = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      console.log(`Response from ${ep}: HTTP ${res.status} ${res.statusText}`);
      if (res.status === 200 || res.status === 202) {
        console.log(`✅ Successfully accepted by ${ep}! URLs queued for crawling and indexing.`);
      } else {
        const text = await res.text();
        console.warn(`Response body:`, text);
      }
    } catch (err) {
      console.error(`Error submitting to ${ep}:`, err.message);
    }
  }
}

submitIndexNow().catch(console.error);
