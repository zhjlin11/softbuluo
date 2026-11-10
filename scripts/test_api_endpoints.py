import urllib.request
import json

slugs = ['windows-11', 'windows-10', 'windows-ltsc', 'windows-server', 'windows-7', 'office-2024', 'office-2021', 'microsoft-365', 'office-mac', 'ab-download-manager']

lines = []
for slug in slugs:
    url = f"http://localhost:3001/api/v1/resources/{slug}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("success"):
                sw = data.get("data", {}).get("resource", {})
                name = sw.get("name")
                history = sw.get("historyVersions", [])
                latest = sw.get("latestVersion", {})
                lines.append(f"[OK] {name} ({slug}) | {len(history)} versions")
                lines.append(f"     Latest: {latest.get('version')} [{latest.get('fileSize')}]")
                for s in latest.get("downloadSources", []):
                    lines.append(f"        * [{s.get('label')}]: {s.get('url')}")
                for h in history:
                    if h.get('version') != latest.get('version'):
                        lines.append(f"     Other: {h.get('version')} [{h.get('fileSize')}]")
                        for s in h.get("downloadSources", []):
                            lines.append(f"        * [{s.get('label')}]: {s.get('url')}")
            else:
                lines.append(f"[FAIL] {slug}: {data}")
    except Exception as e:
        lines.append(f"[ERROR] {slug}: {e}")

with open("scripts/api_results.utf8.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("Results written to scripts/api_results.utf8.txt")
