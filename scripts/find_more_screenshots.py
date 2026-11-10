import urllib.request
import urllib.parse
import json
import os

HEADERS = {'User-Agent': 'SoftBuluoBot/1.0 (contact: admin@softbuluo.com)'}

def find_commons_image(keyword):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(keyword)}&srnamespace=6&format=json"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode('utf-8'))
            results = data.get('query', {}).get('search', [])
            for res in results:
                title = res['title']
                if any(ext in title.lower() for ext in ['.png', '.jpg', '.jpeg']) and not 'icon' in title.lower() and not 'logo' in title.lower():
                    # get direct url
                    info_url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url&format=json"
                    req2 = urllib.request.Request(info_url, headers=HEADERS)
                    with urllib.request.urlopen(req2, timeout=10) as r2:
                        d2 = json.loads(r2.read().decode('utf-8'))
                        pages = d2['query']['pages']
                        for pid in pages:
                            if 'imageinfo' in pages[pid]:
                                return title, pages[pid]['imageinfo'][0]['url']
    except Exception as e:
        print(f"Search error for {keyword}: {e}")
    return None, None

targets = {
    'chrome-screen-1.png': 'Google Chrome screenshot Windows',
    '7zip-screen-1.png': '7-Zip screenshot',
    'vlc-screen-1.png': 'VLC media player screenshot',
    'sublime-text-screen-1.png': 'Sublime Text screenshot',
    'git-screen-1.png': 'Git GUI screenshot',
    'filezilla-screen-1.png': 'FileZilla screenshot',
    'office-screen-1.png': 'Microsoft Office screenshot',
}

for dest_name, query in targets.items():
    title, img_url = find_commons_image(query)
    dest_path = os.path.join('public/images/software', dest_name)
    if img_url:
        print(f"Found {query} -> {title}")
        try:
            req = urllib.request.Request(img_url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as r, open(dest_path, 'wb') as f:
                f.write(r.read())
            print(f"Downloaded -> {dest_path} ({os.path.getsize(dest_path)} bytes)")
        except Exception as e:
            print(f"Download error: {e}")
    else:
        print(f"Not found: {query}")
