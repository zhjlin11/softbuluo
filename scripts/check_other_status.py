import json

with open('scripts/p891_download_audit_result.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for r in data['results']:
    if r.get('http_code') not in [200, 301, 302, 404]:
        print(f"[{r.get('status')}] {r.get('softwareTitle')} | {r.get('name')} | HTTP {r.get('http_code')} | URL: {r.get('url')}")
