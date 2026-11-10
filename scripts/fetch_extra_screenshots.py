import urllib.request
import json
import base64
import re
import os

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def download_img(url, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as r, open(dest, 'wb') as f:
            f.write(r.read())
        print(f"Downloaded -> {dest} ({os.path.getsize(dest)} bytes)")
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

# 1. AB Download Manager from README
try:
    req = urllib.request.Request('https://api.github.com/repos/amir1376/ab-download-manager/readme', headers=HEADERS)
    data = json.loads(urllib.request.urlopen(req, timeout=10).read().decode('utf-8'))
    readme = base64.b64decode(data['content']).decode('utf-8')
    imgs = re.findall(r'https://[^\s\)\"]+\.(?:png|jpg|webp)', readme)
    print("Found AB Download Manager images:", imgs)
    if imgs:
        download_img(imgs[0], 'public/images/software/ab-download-manager-screen-1.png')
        if len(imgs) > 1:
            download_img(imgs[1], 'public/images/software/ab-download-manager-screen-2.png')
except Exception as e:
    print(f"AB fetch error: {e}")

# 2. Rufus
try:
    req = urllib.request.Request('https://api.github.com/repos/pbatard/rufus/readme', headers=HEADERS)
    data = json.loads(urllib.request.urlopen(req, timeout=10).read().decode('utf-8'))
    readme = base64.b64decode(data['content']).decode('utf-8')
    imgs = re.findall(r'https://[^\s\)\"]+\.(?:png|jpg|webp)', readme)
    print("Found Rufus images:", imgs)
    for i, img in enumerate(imgs[:2]):
        download_img(img, f'public/images/software/rufus-screen-{i+1}.png')
except Exception as e:
    print(f"Rufus fetch error: {e}")

# 3. PeaZip
try:
    req = urllib.request.Request('https://api.github.com/repos/peazip/PeaZip/readme', headers=HEADERS)
    data = json.loads(urllib.request.urlopen(req, timeout=10).read().decode('utf-8'))
    readme = base64.b64decode(data['content']).decode('utf-8')
    imgs = re.findall(r'https://[^\s\)\"]+\.(?:png|jpg|webp)', readme)
    print("Found PeaZip images:", imgs)
    for i, img in enumerate(imgs[:2]):
        download_img(img, f'public/images/software/peazip-screen-{i+1}.png')
except Exception as e:
    print(f"PeaZip fetch error: {e}")

