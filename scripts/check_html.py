import urllib.request

req = urllib.request.Request("https://massgrave.dev/windows_11_links", headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=15) as resp:
    html = resp.read().decode("utf-8", errors="ignore")

print("Length of fetched html:", len(html))
print("Contains 'zh-cn':", "zh-cn" in html.lower())
print("Contains 'consumer_editions':", "consumer_editions" in html.lower())
print("Contains '<table':", "<table" in html.lower())
