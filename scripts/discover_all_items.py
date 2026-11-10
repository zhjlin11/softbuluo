import urllib.request
import json

all_items = {}

def get(url):
    try:
        req = urllib.request.urlopen(url)
        return json.loads(req.read().decode('utf-8'))
    except Exception as e:
        print('Error', url, e)
        return None

# 1. Search with common vowels to discover all items
for char in ['', 'a', 'e', 'i', 'o', 'u', 'w', 's', 'm', 'd', 'p', 'g']:
    res = get(f'http://localhost:3001/api/v1/search?q={char}&limit=100')
    if res and 'data' in res:
        for it in res['data'].get('items', []):
            all_items[it['slug']] = it

print(f"Total discovered from search: {len(all_items)}")
for slug, it in sorted(all_items.items()):
    print(f"SLUG: {slug:<22} | NAME: {it['name']:<30} | CATEGORY: {it.get('categorySlug', '')}")
