import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()

        # 1. Capture GameSection on Homepage
        print("Navigating to homepage games section...")
        await page.goto("http://localhost:3000/", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Spotlight screenshot in FeaturedSoftware
        featured_elem = await page.query_selector("#featured")
        if featured_elem:
            await featured_elem.scroll_into_view_if_needed()
            await page.wait_for_timeout(500)
            await page.screenshot(
                path=r"C:\Users\Administrator\.gemini\antigravity\brain\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea\visual_01_featured_spotlight.png"
            )
            print("Captured featured spotlight screenshot")

        # GameSection
        games_elem = await page.query_selector("#games")
        if games_elem:
            await games_elem.scroll_into_view_if_needed()
            await page.wait_for_timeout(500)
            await page.screenshot(
                path=r"C:\Users\Administrator\.gemini\antigravity\brain\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea\visual_02_game_section.png"
            )
            print("Captured game section screenshot")

        # 2. Detail Page: VS Code with Screenshot Gallery
        print("Navigating to VS Code detail page...")
        await page.goto("http://localhost:3000/software/vscode", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(
            path=r"C:\Users\Administrator\.gemini\antigravity\brain\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea\visual_03_vscode_gallery.png"
        )
        print("Captured VS Code gallery screenshot")

        # 3. Detail Page: Blender with 3D Rendering Screenshot
        print("Navigating to Blender detail page...")
        await page.goto("http://localhost:3000/software/blender", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.screenshot(
            path=r"C:\Users\Administrator\.gemini\antigravity\brain\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea\visual_04_blender_gallery.png"
        )
        print("Captured Blender gallery screenshot")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
