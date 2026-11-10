import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()

        print("Navigating to homepage...")
        await page.goto("http://localhost:3000/", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # 1. Capture Essential Suites
        essential_elem = await page.query_selector("#essential")
        if essential_elem:
            await essential_elem.scroll_into_view_if_needed()
            await page.wait_for_timeout(500)
            await page.screenshot(
                path=r"C:\Users\Administrator\.gemini\antigravity\brain\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea\refactored_01_essential_suites.png"
            )
            print("Captured essential suites screenshot")

        # 2. Capture MultiCategory Leaderboard
        hits_elem = await page.query_selector("#hits")
        if hits_elem:
            await hits_elem.scroll_into_view_if_needed()
            await page.wait_for_timeout(500)
            await page.screenshot(
                path=r"C:\Users\Administrator\.gemini\antigravity\brain\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea\refactored_02_leaderboard_hits.png"
            )
            print("Captured leaderboard screenshot")

        # 3. Capture Resource Detail Page
        print("Navigating to VS Code detail page...")
        await page.goto("http://localhost:3000/software/vscode", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(
            path=r"C:\Users\Administrator\.gemini\antigravity\brain\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea\refactored_03_detail_page.png"
        )
        print("Captured detail page screenshot")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
