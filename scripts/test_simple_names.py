import json
import re

with open('scripts/all_software.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

# Rule to get simple software name
def get_simple_name(name, en_name):
    if en_name and len(en_name) < 25 and not any(k in en_name for k in ['Genuine', 'Installation', 'Media']):
        return en_name
    
    # Common mappings
    clean = name
    # If starts with Windows
    if re.match(r'^Windows\s+11', clean, re.I): return 'Windows 11'
    if re.match(r'^Windows\s+10\s*/\s*11\s+Enterprise', clean, re.I): return 'Windows LTSC'
    if re.match(r'^Windows\s+10', clean, re.I): return 'Windows 10'
    if re.match(r'^Windows\s+7', clean, re.I): return 'Windows 7 SP1'
    if re.match(r'^Windows\s+Server', clean, re.I): return 'Windows Server'
    if re.match(r'^Microsoft\s+365', clean, re.I): return 'Microsoft 365'
    if re.match(r'^Microsoft\s+Office\s+2024', clean, re.I): return 'Office 2024'
    if re.match(r'^Microsoft\s+Office\s+2021', clean, re.I): return 'Office 2021'
    if re.match(r'^Microsoft\s+Office\s+for\s+Mac', clean, re.I): return 'Office for Mac'
    if re.match(r'^Sysinternals\s+(\w+)', clean, re.I):
        m = re.match(r'^Sysinternals\s+(\w+(?:\s+\w+)?)', clean, re.I)
        return m.group(1)
    if re.match(r'^TechPowerUp\s+GPU-Z', clean, re.I): return 'GPU-Z'
    if re.match(r'^Go\s+语言', clean): return 'Go (Golang)'
    if re.match(r'^Node\.js', clean, re.I): return 'Node.js'
    if re.match(r'^Draw\.io', clean, re.I): return 'Draw.io'
    if re.match(r'^Shattered\s+Pixel\s+Dungeon', clean, re.I): return '破碎的像素地牢'
    if re.match(r'^Luanti', clean, re.I): return 'Luanti (Minetest)'
    if re.match(r'^Mindustry', clean, re.I): return 'Mindustry'
    if re.match(r'^0\s*A\.D\.', clean, re.I): return '0 A.D.'
    if re.match(r'^Battle\s+for\s+Wesnoth', clean, re.I): return 'Battle for Wesnoth'
    if re.match(r'^Warzone\s+2100', clean, re.I): return 'Warzone 2100'
    if re.match(r'^Endless\s+Sky', clean, re.I): return 'Endless Sky'

    # Split by first space if following text contains Chinese
    parts = clean.split(' ')
    if len(parts) > 1:
        # Check if first part or first two parts are brand
        first = parts[0]
        second = parts[1] if len(parts) > 1 else ''
        if any(second.lower() == k for k in ['extreme', 'uninstaller', 'scanner', 'desktop', 'text', 'temp', 'studio', 'pro', 'plus', 'player', 'manager']):
            return f"{first} {second}"
        # If second has Chinese, just first
        if re.search(r'[\u4e00-\u9fa5]', second):
            return first
        if len(parts) > 2 and re.search(r'[\u4e00-\u9fa5]', parts[2]):
            return f"{first} {second}"
    return clean.split(' ')[0]

for it in items:
    simp = get_simple_name(it['name'], it.get('englishName'))
    print(f"{it['name'][:28]:<30}  ===>  {simp}")
