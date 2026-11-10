import urllib.request
from bs4 import BeautifulSoup
import json
import re

PAGES = [
    ("windows_11", "https://massgrave.dev/windows_11_links"),
    ("windows_10", "https://massgrave.dev/windows_10_links"),
    ("windows_ltsc", "https://massgrave.dev/windows_ltsc_links"),
    ("windows_arm", "https://massgrave.dev/windows_arm_links"),
    ("windows_server", "https://massgrave.dev/windows-server-links"),
    ("windows_7", "https://massgrave.dev/windows_7_links"),
    ("office_c2r", "https://massgrave.dev/office_c2r_links"),
    ("office_mac", "https://massgrave.dev/office_for_mac"),
]

results = {}

for name, url in PAGES:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
        soup = BeautifulSoup(html, "html.parser")
        article = soup.find("article") or soup.find("main") or soup
        
        links = []
        for a in article.find_all("a", href=True):
            href = a["href"]
            text = a.get_text(strip=True)
            # Look for direct ISO / installer / official links
            if any(ext in href.lower() for ext in [".iso", ".pkg", ".exe", ".zip", "software-download", "officecdn", "microsoft.com", "archive.org", "massgrave"]):
                links.append({"text": text, "href": href})
        
        # Also grab tables if any
        tables = []
        for t in article.find_all("table"):
            headers = [th.get_text(strip=True) for th in t.find_all("th")]
            rows = []
            for tr in t.find_all("tr")[1:]:
                cells = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
                a_tag = tr.find("a", href=True)
                download_url = a_tag["href"] if a_tag else ""
                if cells:
                    rows.append({"cells": cells, "url": download_url})
            if rows:
                tables.append({"headers": headers, "rows": rows})
        
        results[name] = {
            "title": soup.title.string if soup.title else "",
            "total_links": len(links),
            "sample_links": links[:15],
            "total_tables": len(tables),
            "tables_summary": [{"headers": t["headers"], "row_count": len(t["rows"])} for t in tables]
        }
        print(f"[{name}] {results[name]['title']}: {len(links)} download links, {len(tables)} tables")
    except Exception as e:
        print(f"[{name}] Error: {e}")

with open("scripts/massgrave_subpages_summary.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
