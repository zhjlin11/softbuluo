import asyncio
import os
from playwright.async_api import async_playwright

OUTPUT_DIR = r"C:\Users\Administrator\.gemini\antigravity\brain\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        tasks = [
            ("p86-post-1440px-light.png", 1440, 900, False),
            ("p86-post-1440px-dark.png", 1440, 900, True),
            ("p86-post-1024px-tablet.png", 1024, 768, False),
            ("p86-post-768px-tablet.png", 768, 1024, False),
            ("p86-post-430px-mobile.png", 430, 932, False),
            ("p86-post-390px-mobile.png", 390, 844, False),
            ("p86-post-390px-mobile-dark.png", 390, 844, True),
        ]

        for filename, width, height, dark in tasks:
            page = await browser.new_page(viewport={"width": width, "height": height})
            await page.goto("http://localhost:3000/", wait_until="domcontentloaded")
            await page.wait_for_timeout(600)

            if dark:
                await page.evaluate("""() => {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('theme', 'dark');
                }""")
                await page.wait_for_timeout(300)
            else:
                await page.evaluate("""() => {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('theme', 'light');
                }""")
                await page.wait_for_timeout(300)

            out_path = os.path.join(OUTPUT_DIR, filename)
            # Clip only top 450px to focus on Header + Hero, or full screen for mobile
            clip_height = min(height, 500) if width >= 768 else 600
            await page.screenshot(path=out_path, clip={"x": 0, "y": 0, "width": width, "height": clip_height})
            print(f"Captured {filename}")
            await page.close()

        # Also capture lower half verification screenshot on desktop (y: 400 to 1200)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        await page.goto("http://localhost:3000/", wait_until="domcontentloaded")
        await page.wait_for_timeout(600)
        await page.evaluate("() => window.scrollTo(0, 350)")
        await page.wait_for_timeout(400)
        out_lower = os.path.join(OUTPUT_DIR, "p86-post-lower-half-untouched.png")
        await page.screenshot(path=out_lower, clip={"x": 0, "y": 0, "width": 1440, "height": 700})
        print("Captured p86-post-lower-half-untouched.png")
        await page.close()

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
