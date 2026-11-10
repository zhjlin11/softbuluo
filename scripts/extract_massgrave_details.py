import urllib.request
from bs4 import BeautifulSoup
import json
import re

HEADERS = {"User-Agent": "Mozilla/5.0"}

def fetch_soup(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return BeautifulSoup(resp.read().decode("utf-8", errors="ignore"), "html.parser")

extracted = []

# 1. Windows 11
print("Fetching Windows 11...")
s11 = fetch_soup("https://massgrave.dev/windows_11_links")
for table in s11.find_all("table"):
    for tr in table.find_all("tr"):
        text = tr.get_text()
        if "Chinese-Simplified" in text or "English" in text:
            for a in tr.find_all("a", href=True):
                extracted.append({
                    "category": "系统工具",
                    "product": "Windows 11 官方原版镜像 (24H2)",
                    "lang": "简体中文" if "Chinese" in text else "English",
                    "filename": a.get_text(strip=True),
                    "url": a["href"]
                })

# 2. Windows 10
print("Fetching Windows 10...")
s10 = fetch_soup("https://massgrave.dev/windows_10_links")
for table in s10.find_all("table"):
    for tr in table.find_all("tr"):
        text = tr.get_text()
        if "Chinese-Simplified" in text or "English" in text:
            for a in tr.find_all("a", href=True):
                extracted.append({
                    "category": "系统工具",
                    "product": "Windows 10 官方原版镜像 (22H2)",
                    "lang": "简体中文" if "Chinese" in text else "English",
                    "filename": a.get_text(strip=True),
                    "url": a["href"]
                })

# 3. Windows LTSC
print("Fetching Windows LTSC...")
sltsc = fetch_soup("https://massgrave.dev/windows_ltsc_links")
for h in sltsc.find_all(["h2", "h3"]):
    title = h.get_text(strip=True)
    next_node = h.find_next_sibling()
    while next_node and next_node.name not in ["h2", "h3"]:
        if next_node.name == "table":
            for tr in next_node.find_all("tr"):
                text = tr.get_text()
                if "Chinese-Simplified" in text or "English" in text:
                    for a in tr.find_all("a", href=True):
                        extracted.append({
                            "category": "系统工具",
                            "product": f"Windows Enterprise LTSC ({title})",
                            "lang": "简体中文" if "Chinese" in text else "English",
                            "filename": a.get_text(strip=True),
                            "url": a["href"]
                        })
        next_node = next_node.find_next_sibling()

# 4. Windows Server
print("Fetching Windows Server...")
sserver = fetch_soup("https://massgrave.dev/windows-server-links")
for h in sserver.find_all(["h2", "h3"]):
    title = h.get_text(strip=True)
    next_node = h.find_next_sibling()
    while next_node and next_node.name not in ["h2", "h3"]:
        if next_node.name == "table":
            for tr in next_node.find_all("tr"):
                text = tr.get_text()
                if "Chinese" in text or "English" in text:
                    for a in tr.find_all("a", href=True):
                        extracted.append({
                            "category": "系统工具",
                            "product": f"Windows Server ({title})",
                            "lang": "简体中文" if "Chinese" in text else "English",
                            "filename": a.get_text(strip=True),
                            "url": a["href"]
                        })
        next_node = next_node.find_next_sibling()

# 5. Windows 7
print("Fetching Windows 7...")
s7 = fetch_soup("https://massgrave.dev/windows_7_links")
for table in s7.find_all("table"):
    for tr in table.find_all("tr"):
        text = tr.get_text()
        if "Chinese-Simplified" in text or "English" in text:
            for a in tr.find_all("a", href=True):
                extracted.append({
                    "category": "系统工具",
                    "product": "Windows 7 SP1 官方原版镜像",
                    "lang": "简体中文" if "Chinese" in text else "English",
                    "filename": a.get_text(strip=True),
                    "url": a["href"]
                })

# 6. Office C2R
print("Fetching Office C2R...")
soffice = fetch_soup("https://massgrave.dev/office_c2r_links")
for h in soffice.find_all(["h2", "h3"]):
    title = h.get_text(strip=True)
    if any(k in title for k in ["2024", "2021", "2019", "365", "O365"]):
        next_node = h.find_next_sibling()
        while next_node and next_node.name not in ["h2", "h3"]:
            if next_node.name == "table":
                for tr in next_node.find_all("tr"):
                    text = tr.get_text()
                    if "Chinese" in text or "English" in text or "ProPlus" in text:
                        for a in tr.find_all("a", href=True):
                            extracted.append({
                                "category": "办公软件",
                                "product": f"Microsoft Office ({title})",
                                "lang": "简体中文" if "Chinese" in text or "zh-cn" in a["href"].lower() else "English",
                                "filename": a.get_text(strip=True),
                                "url": a["href"]
                            })
            next_node = next_node.find_next_sibling()

# 7. Office For Mac
print("Fetching Office for Mac...")
smac = fetch_soup("https://massgrave.dev/office_for_mac")
for tr in smac.find_all("tr"):
    text = tr.get_text()
    for a in tr.find_all("a", href=True):
        if ".pkg" in a["href"] or "officecdn" in a["href"]:
            extracted.append({
                "category": "办公软件",
                "product": "Microsoft Office for Mac 官方安装包",
                "lang": "多国语言 (含简体中文)",
                "filename": a.get_text(strip=True) or a["href"].split("/")[-1],
                "url": a["href"]
            })

with open("scripts/extracted_media_links.json", "w", encoding="utf-8") as f:
    json.dump(extracted, f, ensure_ascii=False, indent=2)

print(f"Total extracted items: {len(extracted)}")
