async function main() {
  const urls = [
    'http://134.175.230.107:8080/',
    'http://134.175.230.107:8080/software',
    'http://134.175.230.107:8080/system-tools',
    'http://134.175.230.107:8080/games',
    'http://134.175.230.107:8080/essentials',
    'http://134.175.230.107:8080/tutorials',
    'http://134.175.230.107:8080/updates',
    'http://134.175.230.107:8080/compare',
    'http://134.175.230.107:8080/community',
    'http://134.175.230.107:8080/api/v1/community/stats',
    'http://134.175.230.107:8080/api/v1/channels/compare',
    'http://134.175.230.107:8080/sitemap-comparisons.xml',
    'http://134.175.230.107:8080/sitemap-community.xml'
  ];

  console.log('--- 生产环境公网端点 P8.7.9 冒烟测试 ---');
  let hasError = false;
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      console.log(`[STATUS ${res.status}] ${url}`);
      if (res.status !== 200) hasError = true;
    } catch (err: any) {
      console.log(`[ERROR] ${url}: ${err.message}`);
      hasError = true;
    }
  }

  if (hasError) {
    console.error('❌ 生产环境冒烟测试存在异常端点!');
    process.exit(1);
  } else {
    console.log('🎉 生产环境所有端点 100% 冒烟测试通过！');
  }
}

main();
