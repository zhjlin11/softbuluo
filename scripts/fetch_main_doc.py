import urllib.request

url = "https://cdn.jsdelivr.net/gh/massgravel/massgrave.dev@main/docs/genuine-installation-media.md"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=10) as resp:
    data = resp.read().decode("utf-8")

with open("scripts/genuine-installation-media.md", "w", encoding="utf-8") as f:
    f.write(data)

print(f"Downloaded {len(data)} bytes to scripts/genuine-installation-media.md")
