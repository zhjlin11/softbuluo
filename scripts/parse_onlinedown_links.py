import urllib.request
import re
from bs4 import BeautifulSoup

url = "https://www.onlinedown.net/"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')

soup = BeautifulSoup(html, 'html.parser')

print("=== ONLINEDOWN HOMEPAGE NAV LINKS ===")
nav_links = []
for a in soup.find_all('a', href=True):
    href = a['href']
    text = a.get_text(strip=True)
    if text and ('onlinedown.net' in href or href.startswith('/')):
        if any(kw in text for kw in ['软件', '排行', '专题', '教程', '资讯', '手游', '安卓', '苹果', '电脑', '驱动', '装机']):
            nav_links.append((text, href))

# unique nav links
seen = set()
unique_nav = []
for t, h in nav_links:
    if h not in seen and len(t) < 15:
        seen.add(h)
        unique_nav.append((t, h))

for t, h in unique_nav[:30]:
    print(f"  {t:15} -> {h}")

print("\n=== SAMPLE SOFTWARE DETAIL LINKS ===")
soft_links = []
for a in soup.find_all('a', href=True):
    href = a['href']
    text = a.get_text(strip=True)
    if '/soft/' in href and text and len(text) > 1 and len(text) < 25:
        soft_links.append((text, href))

seen_soft = set()
unique_soft = []
for t, h in soft_links:
    if h not in seen_soft:
        seen_soft.add(h)
        unique_soft.append((t, h))

for t, h in unique_soft[:15]:
    print(f"  {t:20} -> {h}")

print("\n=== SAMPLE CATEGORY / CHANNEL LINKS ===")
cat_links = []
for a in soup.find_all('a', href=True):
    href = a['href']
    text = a.get_text(strip=True)
    if ('/sort/' in href or '/channel/' in href or '/pc/' in href) and text:
        cat_links.append((text, href))

seen_cat = set()
for t, h in cat_links:
    if h not in seen_cat and len(t) < 15:
        seen_cat.add(h)
        print(f"  {t:15} -> {h}")

print("\n=== SAMPLE TOPIC & ARTICLE LINKS ===")
other_links = []
for a in soup.find_all('a', href=True):
    href = a['href']
    text = a.get_text(strip=True)
    if ('/zt/' in href or '/it/' in href or '/top/' in href or '/article/' in href) and text:
        other_links.append((text, href))

seen_other = set()
for t, h in other_links[:20]:
    if h not in seen_other and len(t) < 25:
        seen_other.add(h)
        print(f"  {t:20} -> {h}")
