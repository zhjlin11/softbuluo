import json

with open('scripts/all_software.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

print(f"Total software items: {len(items)}")

# Print by categories
cat_map = {}
for it in items:
    cat = it.get('category', {}).get('slug') if it.get('category') else 'none'
    cat_map.setdefault(cat, []).append(it)

for cat, lst in sorted(cat_map.items()):
    print(f"\n=== CATEGORY: {cat} ({len(lst)}) ===")
    for it in lst:
        print(f"  {it['slug']:<25} | {it['name']}")
