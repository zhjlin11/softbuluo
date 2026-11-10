import urllib.request
from bs4 import BeautifulSoup
import json

HEADERS = {"User-Agent": "Mozilla/5.0"}
req = urllib.request.Request("https://massgrave.dev/windows_11_links", headers=HEADERS)
with urllib.request.urlopen(req, timeout=15) as resp:
    soup = BeautifulSoup(resp.read().decode("utf-8", errors="ignore"), "html.parser")

tbody = soup.find("tbody")
if tbody:
    trs = tbody.find_all("tr", recursive=False)
    print("Found tbody with trs:", len(trs))
    for tr in trs:
        tds = tr.find_all("td", recursive=False)
        if len(tds) >= 3:
            lang = tds[0].get_text(strip=True)
            arch = tds[1].get_text(strip=True)
            links = [(a.get_text(strip=True), a["href"]) for a in tds[2].find_all("a", href=True)]
            if "Chinese" in lang or "English" in lang:
                print(f"[{lang} - {arch}]: {links}")
