#!/usr/bin/env python3
import json
import time
import subprocess
import sys

# Query download sources from postgres
query = """
SELECT ds.id, sv."softwareId", s.name, s.slug, ds."sourceName", ds.url, ds."sourceType", ds."directFileUrl", ds."verificationStatus", ds."scanStatus"
FROM "DownloadSource" ds
JOIN "SoftwareVersion" sv ON sv.id = ds."versionId"
JOIN "Software" s ON s.id = sv."softwareId"
WHERE s.status = 'PUBLISHED'
ORDER BY s.name, ds.id;
"""

# Run docker psql query
res = subprocess.run([
    'docker', 'exec', 'vasto-postgres', 'psql', '-U', 'vasto_admin', '-d', 'softbuluo',
    '-t', '-A', '-F', '\t', '-c', query
], capture_output=True, text=True)

if res.returncode != 0:
    print("Error querying postgres:", res.stderr)
    sys.exit(1)

rows = res.stdout.strip().split('\n')
sources = []
for row in rows:
    if not row.strip():
        continue
    parts = row.split('\t')
    if len(parts) >= 8:
        sources.append({
            'id': parts[0],
            'softwareId': parts[1],
            'softwareTitle': parts[2],
            'softwareSlug': parts[3],
            'name': parts[4],
            'url': parts[5],
            'sourceType': parts[6],
            'directFileUrl': parts[7],
            'verificationStatus': parts[8] if len(parts) > 8 else 'PENDING',
            'scanStatus': parts[9] if len(parts) > 9 else 'PENDING'
        })

print(f"Total published software download sources found: {len(sources)}")

# Import checker
from p891_download_checker import check_url

results = []
summary = {
    'total': len(sources),
    'https_count': 0,
    'reachable_count': 0,
    'auth_or_forbidden': 0,
    'redirect_count': 0,
    'timeout_or_failed': 0,
    'source_types': {},
}

for i, src in enumerate(sources):
    st = src['sourceType']
    summary['source_types'][st] = summary['source_types'].get(st, 0) + 1
    
    url = src['url']
    if url.startswith('https://'):
        summary['https_count'] += 1
        
    check = check_url(url, timeout=5)
    item = {**src, **check}
    results.append(item)
    
    if check['status'] == 'REACHABLE':
        summary['reachable_count'] += 1
    elif check['status'] == 'AUTH_OR_FORBIDDEN':
        summary['auth_or_forbidden'] += 1
    else:
        summary['timeout_or_failed'] += 1
        
    time.sleep(0.15) # gentle pacing

with open('/tmp/p891_download_audit_result.json', 'w', encoding='utf-8') as f:
    json.dump({'summary': summary, 'results': results}, f, ensure_ascii=False, indent=2)

print("Audit summary:")
print(json.dumps(summary, indent=2, ensure_ascii=False))
