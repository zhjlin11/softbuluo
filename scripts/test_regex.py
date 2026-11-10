import re

with open("scripts/table_raw.html", "r", encoding="utf-8") as f:
    text = f.read()

pattern = re.compile(r'<tr><td[^>]*>([^<]+)<td[^>]*>([^<]+)<td[^>]*><a[^>]+href="([^"]+)"[^>]*>([^<]+)</a>')
matches = pattern.findall(text)
print("Matches found:", len(matches))
for m in matches:
    print(m)
