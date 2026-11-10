import os
import re
import json

DOCS_DIR = "scripts/massgrave_docs"

ROW_PATTERN_3 = re.compile(r'\|\s*([^\|]+?)\s*\|\s*([^\|]+?)\s*\|\s*\[([^\]]+)\]\(([^\)]+)\)')
ROW_PATTERN_2 = re.compile(r'\|\s*([^\|]+?)\s*\|\s*(https?://[^\s\|]+|\[([^\]]+)\]\(([^\)]+)\))')

parsed_catalog = {}

for fname in os.listdir(DOCS_DIR):
    if not fname.endswith(".md"):
        continue
    fpath = os.path.join(DOCS_DIR, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    
    current_tab = "General"
    lines = content.splitlines()
    entries = []
    
    for line in lines:
        tab_match = re.search(r'<TabItem[^>]+label="([^"]+)"', line)
        if tab_match:
            current_tab = tab_match.group(1)
        elif line.startswith("## ") or line.startswith("### ") or line.startswith("#### "):
            current_tab = line.replace("#", "").strip()
        
        # Try 3 col first
        m3 = ROW_PATTERN_3.search(line)
        if m3:
            c1, c2, link_text, link_url = [g.strip() for g in m3.groups()]
            if c1.lower() not in ["language", "product", "edition", "version", "name", ":---", "---"]:
                entries.append({
                    "section": current_tab,
                    "col1": c1,
                    "col2": c2,
                    "filename": link_text,
                    "url": link_url
                })
            continue
        
        # Try 2 col
        m2 = ROW_PATTERN_2.search(line)
        if m2:
            c1 = m2.group(1).strip()
            if c1.lower() not in ["application", "software", "name", ":---", "---"]:
                raw_or_link = m2.group(2).strip()
                if raw_or_link.startswith("http"):
                    entries.append({
                        "section": current_tab,
                        "col1": c1,
                        "col2": "Direct",
                        "filename": c1,
                        "url": raw_or_link
                    })
                elif m2.group(3) and m2.group(4):
                    entries.append({
                        "section": current_tab,
                        "col1": c1,
                        "col2": "Direct",
                        "filename": m2.group(3).strip(),
                        "url": m2.group(4).strip()
                    })

    parsed_catalog[fname] = {
        "file": fname,
        "total_entries": len(entries),
        "entries": entries
    }
    print(f"[{fname}] Parsed {len(entries)} entries")

with open("scripts/parsed_massgrave_catalog.json", "w", encoding="utf-8") as out:
    json.dump(parsed_catalog, out, ensure_ascii=False, indent=2)

print("Saved to scripts/parsed_massgrave_catalog.json")
