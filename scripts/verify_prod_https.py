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
    'https://127.0.0.1/api/health',
    'https://127.0.0.1/sitemap.xml'
]

for u in urls:
    try:
        req = urllib.request.Request(u, headers={'Host': 'softtribe.top', 'User-Agent': 'Verifier'})
        res = urllib.request.urlopen(req, context=ctx, timeout=5)
        path = u.replace('https://127.0.0.1', '')
        print(f'✓ {res.status} OK: https://softtribe.top{path}')
    except Exception as e:
        print(f'✗ FAIL: {u} -> {e}')
