import json

with open('scripts/p891_download_audit_result.json', encoding='utf-8') as f:
    data = json.load(f)

summary = data['summary']
print("=== DOWNLOAD SOURCES AUDIT SUMMARY ===")
print(f"Total Sources Audited: {summary['total']}")
print(f"HTTPS Sources: {summary['https_count']} ({summary['https_count']/summary['total']*100:.1f}%)")
print(f"Reachable (HTTP 200/OK): {summary['reachable_count']} ({summary['reachable_count']/summary['total']*100:.1f}%)")
print(f"Auth / Forbidden (401/403/WAF): {summary['auth_or_forbidden']}")
print(f"Timeout / Other Failed: {summary['timeout_or_failed']}")
print("\nSource Types Breakdown:")
for k, v in summary['source_types'].items():
    print(f"  - {k}: {v}")

results = data['results']
status_counts = {}
for r in results:
    s = r.get('status')
    status_counts[s] = status_counts.get(s, 0) + 1
print("\nStatus Distribution:")
for k, v in status_counts.items():
    print(f"  - {k}: {v}")

print("\nSample Non-Reachable Sources (Requiring Manual Review):")
non_reachable = [r for r in results if r.get('status') != 'REACHABLE']
for r in non_reachable[:15]:
    print(f"  • [{r.get('status')}] {r.get('softwareTitle')} | {r.get('name')}: {r.get('url')} (HTTP {r.get('http_code')})")
