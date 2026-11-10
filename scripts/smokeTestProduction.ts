async function main() {
  const urls = [
    'http://134.175.230.107:8080/',
    'http://134.175.230.107:8080/software',
    'http://134.175.230.107:8080/system-tools',
    'http://134.175.230.107:8080/games',
    'http://134.175.230.107:8080/essentials',
    'http://134.175.230.107:8080/compare',
    'http://134.175.230.107:8080/community',
    'http://134.175.230.107:8080/api/v1/community/stats',
    'http://134.175.230.107:8080/sitemap-community.xml'
  ];

  console.log('--- 生产环境公网端点冒烟测试 ---');
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      console.log(`[STATUS ${res.status}] ${url}`);
    } catch (err: any) {
      console.log(`[ERROR] ${url}: ${err.message}`);
    }
  }
}

main();
