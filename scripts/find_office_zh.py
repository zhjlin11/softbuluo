with open("scripts/massgrave_docs/office_c2r_links.md", "r", encoding="utf-8") as f:
    text = f.read()

import re
matches = re.findall(r'##\s*([^\n]+zh-[^\n]+)', text, re.IGNORECASE)
print("Chinese sections in Office C2R:", matches)

# Find line number of first Chinese section
idx = text.find("zh-CN")
if idx == -1:
    idx = text.find("zh-cn")
if idx == -1:
    idx = text.find("Chinese")

if idx != -1:
    line_no = text[:idx].count("\n") + 1
    print(f"First Chinese section around line {line_no}")
    print(text[idx-50:idx+250])
