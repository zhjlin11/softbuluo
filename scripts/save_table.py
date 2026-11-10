import urllib.request
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0"}
req = urllib.request.Request("https://massgrave.dev/windows_11_links", headers=HEADERS)
with urllib.request.urlopen(req, timeout=15) as resp:
    soup = BeautifulSoup(resp.read().decode("utf-8", errors="ignore"), "html.parser")

table = soup.find("table")
with open("scripts/table_raw.html", "w", encoding="utf-8") as f:
    f.write(str(table)[:2000])
print("Saved first 2000 chars of table to scripts/table_raw.html")
