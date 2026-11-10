import os
import json
import urllib.request
import urllib.parse

USER_AGENT = 'SoftBuluoBot/1.0 (contact: admin@softbuluo.com; pairs with Wikimedia API)'

def get_wikimedia_url(file_title):
    api_url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(file_title)}&prop=imageinfo&iiprop=url&format=json"
    req = urllib.request.Request(api_url, headers={'User-Agent': USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data['query']['pages']
            for pid in pages:
                if 'imageinfo' in pages[pid]:
                    return pages[pid]['imageinfo'][0]['url']
    except Exception as e:
        print(f"Error resolving {file_title}: {e}")
    return None

def download_file(url, target_path):
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    if os.path.exists(target_path) and os.path.getsize(target_path) > 1000:
        print(f"Already exists: {target_path}")
        return True
    
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=25) as resp, open(target_path, 'wb') as f:
            f.write(resp.read())
        print(f"Downloaded -> {target_path} ({os.path.getsize(target_path)} bytes)")
        return True
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False

def main():
    print("=== Downloading Official High-Res Software & Game Screenshots ===")
    
    # 1. Mindustry (Steam API)
    try:
        steam_req = urllib.request.Request('https://store.steampowered.com/api/appdetails?appids=1127400', headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(steam_req, timeout=15) as resp:
            mind_data = json.loads(resp.read().decode('utf-8'))['1127400']['data']
            download_file(mind_data['header_image'], 'public/images/games/mindustry-cover.jpg')
            for i, sc in enumerate(mind_data['screenshots'][:3]):
                download_file(sc['path_full'], f'public/images/games/mindustry-screen-{i+1}.jpg')
    except Exception as e:
        print(f"Mindustry fetch error: {e}")

    # 2. SuperTuxKart (Wikimedia Commons)
    stk_files = [
        ('File:SuperTuxKart in-race (2018).png', 'public/images/games/supertuxkart-cover.jpg'),
        ('File:STK track 1.png', 'public/images/games/supertuxkart-screen-1.jpg'),
        ('File:STK track 2.png', 'public/images/games/supertuxkart-screen-2.jpg'),
        ('File:Battleisland arena in STK.png', 'public/images/games/supertuxkart-screen-3.jpg'),
    ]
    for ft, dest in stk_files:
        u = get_wikimedia_url(ft)
        if u:
            download_file(u, dest)

    # 3. Software Screenshots (Wikimedia Commons)
    sw_files = [
        ('File:VS Code (Insiders).png', 'public/images/software/vscode-screen-1.png'),
        ('File:VS Code Screenshot.png', 'public/images/software/vscode-screen-2.png'),
        ('File:Blender 3.1.0 screenshot.png', 'public/images/software/blender-screen-1.png'),
        ('File:Blender 2.92.0 screenshot.png', 'public/images/software/blender-screen-2.png'),
        ('File:OBS Studio Interface.png', 'public/images/software/obs-studio-screen-1.png'),
        ('File:OBS Studio W11.png', 'public/images/software/obs-studio-screen-2.png'),
        ('File:Wireshark 3.0.0.png', 'public/images/software/wireshark-screen-1.png'),
        ('File:FileZilla 3.51.0 screenshot.png', 'public/images/software/filezilla-screen-1.png'),
        ('File:7-Zip 19.00 on Windows 10.png', 'public/images/software/7zip-screen-1.png'),
        ('File:Rufus 3.13.png', 'public/images/software/rufus-screen-1.png'),
        ('File:PeaZip 8.4.0.png', 'public/images/software/peazip-screen-1.png'),
        ('File:Sublime Text 4 Build 4126.png', 'public/images/software/sublime-text-screen-1.png'),
        ('File:LibreOffice 7.0 Writer screenshot.png', 'public/images/software/libreoffice-screen-1.png'),
        ('File:VLC 3.0.18 screenshot.png', 'public/images/software/vlc-screen-1.png'),
        ('File:Windows 11 screenshot.png', 'public/images/software/windows-11-screen-1.png'),
        ('File:Windows 10 desktop.png', 'public/images/software/windows-10-screen-1.png'),
    ]
    for ft, dest in sw_files:
        u = get_wikimedia_url(ft)
        if u:
            download_file(u, dest)

if __name__ == '__main__':
    main()
