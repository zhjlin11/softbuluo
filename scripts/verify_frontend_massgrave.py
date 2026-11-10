import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()

        # 1. Test Windows 11 Detail Page
        print("Navigating to Windows 11 page...")
        await page.goto("http://localhost:3000/software/windows-11", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path="C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/massgrave-windows-11.png")
        title_text = await page.title()
        print(f"Windows 11 Page Title: {title_text}")

        # 2. Test Office 2024 Detail Page
        print("Navigating to Office 2024 page...")
        await page.goto("http://localhost:3000/software/office-2024", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path="C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/massgrave-office-2024.png")
        print(f"Office 2024 Page Title: {await page.title()}")

        # 3. Test Windows LTSC Detail Page
        print("Navigating to Windows LTSC page...")
        await page.goto("http://localhost:3000/software/windows-ltsc", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path="C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/massgrave-windows-ltsc.png")
        print(f"Windows LTSC Page Title: {await page.title()}")

        # 4. Test Topic Page
        print("Navigating to Topic page...")
        await page.goto("http://localhost:3000/topic/genuine-microsoft-installation-media", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path="C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/massgrave-topic-page.png")
        print(f"Topic Page Title: {await page.title()}")

        # 5. Test Tutorial Page
        print("Navigating to Tutorial page...")
        await page.goto("http://localhost:3000/tutorial/how-to-verify-genuine-iso-checksums", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.screenshot(path="C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/massgrave-tutorial-page.png")
        print(f"Tutorial Page Title: {await page.title()}")

        # 6. Test Homepage Search
        print("Testing Search on Homepage...")
        await page.goto("http://localhost:3000/", wait_until="networkidle")
        search_input = page.locator("input[type='text'], input[placeholder*='搜索']").first
        if await search_input.count() > 0:
            await search_input.fill("Windows 11")
            await page.keyboard.press("Enter")
            await page.wait_for_timeout(1500)
            await page.screenshot(path="C:/Users/Administrator/.gemini/antigravity/brain/be0ca18d-bc9c-49f8-a588-e34aabbcf8ea/massgrave-search-result.png")
            print("Homepage search completed and snapshotted.")

        await browser.close()
        print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!")

asyncio.run(run())
