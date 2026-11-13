import json

with open('scripts/p891_download_audit_result.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

results = data['results']
print(f"Total results: {len(results)}")
failed = [r for r in results if r.get('http_code') in [404, 410, 0] or r.get('status') in ['FAILED', 'NOT_FOUND']]
print(f"Total failed / 404 sources: {len(failed)}")

for idx, r in enumerate(failed, 1):
    print(f"[{idx:02d}] ID: {r.get('id')} | SW: {r.get('softwareTitle')} | Name: {r.get('name')} | HTTP: {r.get('http_code')} | URL: {r.get('url')}")
