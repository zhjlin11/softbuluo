import urllib.request
from bs4 import BeautifulSoup
import json
import re

url = "https://massgrave.dev/genuine-installation-media"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=15) as resp:
    html = resp.read().decode("utf-8", errors="ignore")

soup = BeautifulSoup(html, "html.parser")
article = soup.find("article") or soup.find("main") or soup

data = {
    "title": soup.title.string if soup.title else "",
    "sections": []
}

current_section = {"heading": "Overview", "links": [], "paragraphs": []}

for el in article.find_all(["h1", "h2", "h3", "h4", "p", "ul", "ol", "table"]):
    if el.name in ["h1", "h2", "h3", "h4"]:
        if current_section["links"] or current_section["paragraphs"]:
            data["sections"].append(current_section)
        current_section = {
            "level": el.name,
            "heading": el.get_text(strip=True),
            "links": [],
            "paragraphs": []
        }
    elif el.name == "p":
        txt = el.get_text(strip=True)
        if txt:
            current_section["paragraphs"].append(txt)
            for a in el.find_all("a", href=True):
                current_section["links"].append({"text": a.get_text(strip=True), "href": a["href"]})
    elif el.name in ["ul", "ol"]:
        for li in el.find_all("li"):
            for a in li.find_all("a", href=True):
                current_section["links"].append({"text": a.get_text(strip=True), "href": a["href"], "full_li": li.get_text(strip=True)})
    elif el.name == "table":
        for a in el.find_all("a", href=True):
            current_section["links"].append({"text": a.get_text(strip=True), "href": a["href"]})

if current_section["links"] or current_section["paragraphs"]:
    data["sections"].append(current_section)

with open("scripts/massgrave_parsed.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Parsed {len(data['sections'])} sections. Saved to scripts/massgrave_parsed.json")
