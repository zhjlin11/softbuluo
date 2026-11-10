import urllib.request
import json

try:
    req = urllib.request.urlopen('http://localhost:3001/api/v1/home')
    data = json.loads(req.read().decode('utf-8'))
    print("API Status:", data.get('status'))
    d = data.get('data', {})
    all_software = {}
    for k in ['featured', 'popular', 'latest', 'repairTools']:
        items = d.get(k, [])
        for it in items:
            all_software[it['slug']] = it
    
    print(f"Total unique softwares on home: {len(all_software)}")
    for slug, it in sorted(all_software.items()):
        print(f"SLUG: {slug:<20} | NAME: {it['name']:<25} | ICON: {it.get('iconUrl')}")
except Exception as e:
    print('Home API Error:', e)
