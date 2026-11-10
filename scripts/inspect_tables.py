import urllib.request
from bs4 import BeautifulSoup
import json

def inspect_page(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode("utf-8", errors="ignore")
    soup = BeautifulSoup(html, "html.parser")
    tables = soup.find_all("table")
    print(f"URL: {url}, found {len(tables)} tables")
    
    for i, t in enumerate(tables[:3]):
        headers = [th.get_text(strip=True) for th in t.find_all("th")]
        print(f"  Table {i+1} headers: {headers}")
        for r in t.find_all("tr")[:4]:
            cells = []
            for td in r.find_all(["td", "th"]):
                a = td.find("a", href=True)
                if a:
                    cells.append(f"{td.get_text(strip=True)} ({a['href'][:50]}...)")
                else:
                    cells.append(td.get_text(strip=True))
            print("    Row:", cells)

print("--- Windows 11 ---")
inspect_page("https://massgrave.dev/windows_11_links")

print("\n--- Windows LTSC ---")
inspect_page("https://massgrave.dev/windows_ltsc_links")

print("\n--- Office C2R ---")
inspect_page("https://massgrave.dev/office_c2r_links")
