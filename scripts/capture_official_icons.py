import os
from playwright.sync_api import sync_playwright

artifact_dir = r'C:\Users\Administrator\.gemini\antigravity\brain\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea'

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    
    # 1. Homepage essential suites & tools
    page.goto('http://localhost:3000/')
    page.wait_for_timeout(2000)
    page.evaluate('window.scrollTo(0, 1000)')
    page.wait_for_timeout(1000)
    page.screenshot(path=os.path.join(artifact_dir, 'official_icons_01_home_suites.png'), full_page=False)

    # 2. Office Category (Windows, Office 365, 2024, Sublime, PeaZip)
    page.goto('http://localhost:3000/category/office')
    page.wait_for_timeout(1500)
    page.screenshot(path=os.path.join(artifact_dir, 'official_icons_02_office.png'), full_page=False)

    # 3. Sys Tools Category (Windows 11/10/7, Ventoy, Geek Uninstaller, etc.)
    page.goto('http://localhost:3000/category/sys-tools')
    page.wait_for_timeout(1500)
    page.screenshot(path=os.path.join(artifact_dir, 'official_icons_03_sys_tools.png'), full_page=False)

    # 4. Dev Category (VS Code, Docker, Python, Go, Node, Postman, DBeaver)
    page.goto('http://localhost:3000/category/dev')
    page.wait_for_timeout(1500)
    page.screenshot(path=os.path.join(artifact_dir, 'official_icons_04_dev.png'), full_page=False)

    browser.close()

print('Official icon screenshots captured successfully!')
