import json

with open("scripts/extracted_media_links.json", "r", encoding="utf-8") as f:
    items = json.load(f)

# Group by product
products = {}
for it in items:
    p = it["product"]
    if p not in products:
        products[p] = []
    products[p].append(it)

lines = []
for p, list_items in products.items():
    lines.append(f"=== {p} ({len(list_items)} links) ===")
    zh_links = [x for x in list_items if x["lang"] == "简体中文"]
    en_links = [x for x in list_items if x["lang"] == "English"]
    lines.append(f"  Chinese: {len(zh_links)}, English: {len(en_links)}")
    for x in zh_links[:3]:
        lines.append(f"    [ZH] {x['filename']} -> {x['url']}")
    for x in en_links[:2]:
        lines.append(f"    [EN] {x['filename']} -> {x['url']}")

with open("scripts/extracted_summary.utf8.txt", "w", encoding="utf-8") as out:
    out.write("\n".join(lines))
print("Saved summary to scripts/extracted_summary.utf8.txt")
