import urllib.request
import json

slugs = [
    'windows-11', 'windows-10', 'windows-ltsc', 'windows-server', 'windows-7',
    'office-2024', 'office-2021', 'microsoft-365', 'office-mac', 'ab-download-manager'
]

print("=== MASSGRAVE GENUINE INSTALLATION MEDIA API VERIFICATION ===")
for slug in slugs:
    url = f"http://localhost:3001/api/v1/resources/{slug}"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))['data']['resource']
            name = data.get('name')
            category = data.get('categoryName')
            latest = data.get('latestVersion', {}) or {}
            ver = latest.get('version', 'N/A')
            sources = latest.get('downloadSources', []) or []
            history = data.get('historyVersions', []) or []
            print(f"\n[OK] {slug} | {name} | Cat: {category}")
            print(f"     Latest: {ver} | Total Versions: {len(history)}")
            for v in history:
                v_sources = v.get('downloadSources', []) or []
                print(f"     * Version: {v.get('version')} ({v.get('fileSize')}) -> {len(v_sources)} source(s)")
                for s in v_sources:
                    print(f"        - [{s.get('sourceType')}] {s.get('label') or s.get('sourceName')}: {s.get('url')[:65]}...")
    except Exception as e:
        print(f"[ERR] {slug}: {e}")

print("\n=== TOPIC VERIFICATION ===")
topic_url = "http://localhost:3001/api/v1/topics/genuine-microsoft-installation-media"
try:
    req = urllib.request.Request(topic_url)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))['data']
        topic = data.get('topic', {}) or {}
        resources = data.get('resources', []) or []
        print(f"[OK] Topic: {topic.get('title')} | Slug: {topic.get('slug')} | Resources linked: {len(resources)}")
        for r in resources:
            print(f"      * {r.get('name')} ({r.get('slug')})")
except Exception as e:
    print(f"[ERR] Topic: {e}")
