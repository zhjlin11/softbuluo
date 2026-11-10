import json

with open("scripts/parsed_massgrave_catalog.json", "r", encoding="utf-8") as f:
    catalog = json.load(f)

lines = []
for doc_name, data in catalog.items():
    lines.append(f"=== {doc_name} ({data['total_entries']} items) ===")
    entries = data["entries"]
    
    zh_entries = [e for e in entries if "chinese" in e["col1"].lower() or "zh-cn" in e["filename"].lower() or "chinese" in e["filename"].lower()]
    en_entries = [e for e in entries if "english" in e["col1"].lower() or "en-us" in e["filename"].lower()]
    
    lines.append(f"  Chinese items: {len(zh_entries)}")
    for z in zh_entries[:5]:
        lines.append(f"    [ZH] Sec: {z['section']} | {z['col1']} ({z['col2']}) | {z['filename']} -> {z['url']}")
    
    lines.append(f"  English items: {len(en_entries)}")
    for en in en_entries[:3]:
        lines.append(f"    [EN] Sec: {en['section']} | {en['col1']} ({en['col2']}) | {en['filename']} -> {en['url']}")

with open("scripts/parsed_summary.utf8.txt", "w", encoding="utf-8") as out:
    out.write("\n".join(lines))
print("Saved summary directly to scripts/parsed_summary.utf8.txt")
