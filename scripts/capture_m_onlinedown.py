import asyncio
import os
from playwright.async_api import async_playwright

OUTPUT_DIR = r"C:\Users\Administrator\.gemini\antigravity\brain\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea"

async def capture_m():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        )
        page = await context.new_page()

        print("[*] Navigating to m.onlinedown.net...")
        await page.goto("https://m.onlinedown.net/", wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(2000)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "onlinedown_m_homepage.png"), full_page=False)

        print("[*] Navigating to mobile software detail...")
        await page.goto("https://m.onlinedown.net/soft/120118.html", wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(2000)
        await page.screenshot(path=os.path.join(OUTPUT_DIR, "onlinedown_m_detail.png"), full_page=False)

        await browser.close()
    print("[*] Done capturing m.onlinedown.net!")

asyncio.run(capture_m())
