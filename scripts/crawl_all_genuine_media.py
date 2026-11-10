import urllib.request
import re
import json

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

def fetch_html(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read().decode("utf-8", errors="ignore")

PAGES = [
    ("win11", "Windows 11 官方原版镜像", "https://massgrave.dev/windows_11_links"),
    ("win10", "Windows 10 官方原版镜像", "https://massgrave.dev/windows_10_links"),
    ("win_ltsc", "Windows 10 / 11 Enterprise LTSC 长期服务版", "https://massgrave.dev/windows_ltsc_links"),
    ("win_arm", "Windows ARM64 官方原版镜像", "https://massgrave.dev/windows_arm_links"),
    ("win_server", "Windows Server 官方服务器操作系统镜像", "https://massgrave.dev/windows-server-links"),
    ("win7", "Windows 7 SP1 官方典藏原版镜像", "https://massgrave.dev/windows_7_links"),
    ("win81", "Windows 8.1 官方原版镜像", "https://massgrave.dev/windows_8.1_links"),
    ("office_c2r", "Microsoft Office 原厂 C2R 离线安装镜像", "https://massgrave.dev/office_c2r_links"),
    ("office_mac", "Microsoft Office for Mac 官方原版安装包", "https://massgrave.dev/office_for_mac"),
]

# Patterns for table rows
pattern_3col = re.compile(r'<tr><td[^>]*>([^<]+)<td[^>]*>([^<]+)<td[^>]*><a[^>]+href="([^"]+)"[^>]*>([^<]+)</a>', re.IGNORECASE)
pattern_any_link = re.compile(r'<a[^>]+href="([^"]+)"[^>]*>([^<]+)</a>', re.IGNORECASE)

catalog = []

for key, title, url in PAGES:
    print(f"Crawling {title} from {url}...")
    try:
        html = fetch_html(url)
        matches = pattern_3col.findall(html)
        
        # If 3-column table found
        page_items = []
        for lang, arch, link, filename in matches:
            l_lower = lang.lower()
            f_lower = filename.lower()
            # Prioritize Chinese Simplified and English
            is_zh = "chinese-simplified" in l_lower or "zh-cn" in f_lower or "chinese" in l_lower
            is_en = "english" in l_lower or "en-us" in f_lower or "en-gb" in f_lower
            
            if is_zh or is_en:
                page_items.append({
                    "language": "简体中文" if is_zh else "English",
                    "arch": arch.strip(),
                    "filename": filename.strip(),
                    "url": link.strip()
                })
        
        # If no 3-col table or special page (like office_c2r or office_mac)
        if not page_items:
            # Look for general download links (.iso, .pkg, .exe, officecdn, zerofs, buzzheavier)
            all_links = pattern_any_link.findall(html)
            for link, text in all_links:
                link_l = link.lower()
                text_l = text.lower()
                if any(ext in link_l or ext in text_l for ext in [".iso", ".pkg", ".exe", "officecdn", "zerofs.link", "buzzheavier.com", "archive.org"]):
                    is_zh = "zh-cn" in link_l or "zh-cn" in text_l or "chinese" in text_l or "中文" in text
                    is_en = "en-us" in link_l or "en-us" in text_l or "english" in text_l
                    if is_zh or is_en or key in ["office_mac", "office_c2r"]:
                        page_items.append({
                            "language": "简体中文" if is_zh else ("English" if is_en else "多国语言"),
                            "arch": "x64" if "x64" in link_l or "x64" in text_l or "64" in text_l else ("ARM64" if "arm" in link_l else "x86/x64"),
                            "filename": text.strip() or link.split("/")[-1],
                            "url": link.strip()
                        })
        
        print(f"  -> Found {len(page_items)} target items for {key}")
        catalog.append({
            "key": key,
            "title": title,
            "url": url,
            "items": page_items
        })
    except Exception as e:
        print(f"  -> Error fetching {key}: {e}")

with open("scripts/genuine_media_catalog.json", "w", encoding="utf-8") as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)

print("Done. Saved to scripts/genuine_media_catalog.json")
