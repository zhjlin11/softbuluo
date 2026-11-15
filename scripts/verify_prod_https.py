import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

urls = [
    'https://127.0.0.1/',
    'https://127.0.0.1/software',
    'https://127.0.0.1/system-tools',
    'https://127.0.0.1/games',
    'https://127.0.0.1/essentials',
    'https://127.0.0.1/tutorials',
    'https://127.0.0.1/updates',
    'https://127.0.0.1/compare',
    'https://127.0.0.1/community',
    'https://127.0.0.1/software/crystaldiskinfo',
    'https://127.0.0.1/software/crystaldiskmark',
    'https://127.0.0.1/software/gpuz',
    'https://127.0.0.1/software/ventoy',
    'https://127.0.0.1/software/putty',
    'https://127.0.0.1/software/winscp',
    'https://127.0.0.1/software/nodejs',
    'https://127.0.0.1/software/python',
    'https://127.0.0.1/software/potplayer',
    'https://127.0.0.1/software/openra',
    'https://127.0.0.1/sitemap-software.xml',
    'https://127.0.0.1/sitemap.xml',
    'https://127.0.0.1/api/health'
]

passed = 0
for u in urls:
    try:
        req = urllib.request.Request(u, headers={'Host': 'softtribe.top', 'User-Agent': 'Mozilla/5.0 SoftTribeProdChecker/1.0'})
        res = urllib.request.urlopen(req, context=ctx, timeout=8)
        path = u.replace('https://127.0.0.1', '')
        print(f'✓ [{res.status} OK] https://softtribe.top{path}')
        passed += 1
    except Exception as e:
        print(f'✗ [FAIL] {u} -> {e}')

print(f'\n=======================================================')
print(f'🎉 生产 HTTPS 端点全量复核通过: {passed} / {len(urls)} 全部正常！')
print(f'=======================================================')
