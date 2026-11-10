import urllib.request
import os

DOC_FILES = [
    "windows_11_links.md",
    "windows_10_links.md",
    "windows_ltsc_links.md",
    "windows_arm_links.md",
    "windows-server-links.md",
    "windows_7_links.md",
    "windows_8.1_links.md",
    "office_c2r_links.md",
    "office_for_mac.md",
    "office_msi_links.md"
]

os.makedirs("scripts/massgrave_docs", exist_ok=True)

for fname in DOC_FILES:
    url = f"https://cdn.jsdelivr.net/gh/massgravel/massgrave.dev@main/docs/{fname}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            content = resp.read().decode("utf-8")
        out_path = os.path.join("scripts/massgrave_docs", fname)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Downloaded {fname}: {len(content)} chars")
    except Exception as e:
        print(f"Failed {fname}: {e}")
