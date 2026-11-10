async function test() {
  const loginRes = await fetch('http://localhost:3001/api/v1/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@softbuluo.com', password: 'Admin@123456' }),
  });
  const cookie = loginRes.headers.get('set-cookie')?.split(';')[0];
  console.log('Login status:', loginRes.status, 'Cookie:', cookie);

  const endpoints = [
    '/api/v1/admin/analytics/overview',
    '/api/v1/admin/analytics/search',
    '/api/v1/admin/governance/metrics',
    '/api/v1/admin/seo/search-consoles',
  ];

  for (const ep of endpoints) {
    const res = await fetch('http://localhost:3001' + ep, { headers: { Cookie: cookie || '' } });
    console.log(ep, '-> Status:', res.status);
    if (res.status >= 400) {
      console.log('Error text:', await res.text());
    }
  }
}

test().catch(console.error);
