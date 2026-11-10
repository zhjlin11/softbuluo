import urllib.request
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0"}
req = urllib.request.Request("https://massgrave.dev/windows_11_links", headers=HEADERS)
with urllib.request.urlopen(req, timeout=15) as resp:
    soup = BeautifulSoup(resp.read().decode("utf-8", errors="ignore"), "html.parser")

table = soup.find("table")
rows = table.find_all("tr")

out_lines = [f"Total rows in Table 1: {len(rows)}"]
for r in rows[:6]:
    cells = [c.get_text(strip=True) for c in r.find_all(["th", "td"])]
    links = [a["href"] for a in r.find_all("a", href=True)]
    out_lines.append(f"Cells: {cells}")
    out_lines.append(f"Links: {links}")

out_lines.append("\nLooking for zh-cn rows:")
for r in rows:
    text = r.get_text()
    if "Chinese-Simplified" in text or "zh-cn" in text:
        cells = [c.get_text(strip=True) for c in r.find_all(["th", "td"])]
        links = [(a.get_text(strip=True), a["href"]) for a in r.find_all("a", href=True)]
        out_lines.append(f"ZH Cells: {cells}")
        out_lines.append(f"ZH Links: {links}")

with open("scripts/rows_out.utf8.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out_lines))
