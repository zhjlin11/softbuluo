import json
import os

with open('E:/Code/新建文件夹/.system_generated/steps/6312/output.txt', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

import re
items = re.findall(r'ITEM:\s*\[([^\]]+)\]\s*"([^"]+)"\s*\(([^)]*)\)\s*\[cat:\s*([^\]]*)\]\s*icon:\s*(\S+)', text)
print(f'Total parsed: {len(items)}')

slugs = [it[0] for it in items]
print(slugs)
