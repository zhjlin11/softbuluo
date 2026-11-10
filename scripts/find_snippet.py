import urllib.request

req = urllib.request.Request("https://massgrave.dev/windows_11_links", headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=15) as resp:
    html = resp.read().decode("utf-8", errors="ignore")

idx = html.find("zh-cn")
if idx != -1:
    snippet = html[max(0, idx - 200): min(len(html), idx + 200)]
    with open("scripts/raw_snippet.html", "w", encoding="utf-8") as f:
        f.write(snippet)
    print("Found snippet, saved to scripts/raw_snippet.html")
else:
    print("zh-cn not found")
