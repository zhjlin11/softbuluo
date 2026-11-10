import asyncio
import json
import os
from playwright.async_api import async_playwright

PAGES = [
    {
        "name": "01_homepage",
        "title": "华军软件园-首页",
        "url": "https://www.onlinedown.net/",
    },
    {
        "name": "02_soft_channel",
        "title": "电脑软件频道页",
        "url": "https://www.onlinedown.net/soft/",
    },
    {
        "name": "03_system_tools",
        "title": "系统软件分类列表页",
        "url": "https://www.onlinedown.net/xtrj/",
    },
    {
        "name": "04_detail_wechat",
        "title": "软件详情与下载页(微信电脑版)",
        "url": "https://www.onlinedown.net/soft/120118.htm",
    },
    {
        "name": "05_leaderboard_hits",
        "title": "软件总排行榜页",
        "url": "https://www.onlinedown.net/hits/",
    },
    {
        "name": "06_nicepc",
        "title": "装机必备精选页",
        "url": "https://www.onlinedown.net/nicepc/",
    },
    {
        "name": "07_topic_zt",
        "title": "专题汇总频道页",
        "url": "https://www.onlinedown.net/zt/",
    },
    {
        "name": "08_article_tutorial",
        "title": "软件教程与攻略频道页",
        "url": "https://www.onlinedown.net/article/",
    },
]

OUTPUT_DIR = r"C:\Users\Administrator\.gemini\antigravity\brain\be0ca18d-bc9c-49f8-a588-e34aabbcf8ea"

async def inspect():
    results = {}
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        for item in PAGES:
            name = item["name"]
            url = item["url"]
            print(f"[*] Navigating to {name}: {url}...")
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(2000)

                # Above the fold screenshot
                above_fold_path = os.path.join(OUTPUT_DIR, f"onlinedown_{name}_fold.png")
                await page.screenshot(path=above_fold_path, full_page=False)

                # Extract UI metrics
                metrics = await page.evaluate("""() => {
                    const doc = document;
                    const body = doc.body;
                    const computedBody = window.getComputedStyle(body);
                    
                    const wrapEls = Array.from(doc.querySelectorAll('.wrap, .w1200, .w1000, .content, .header, .nav, .main'));
                    const containerWidths = [...new Set(wrapEls.map(c => Math.round(c.getBoundingClientRect().width)).filter(w => w > 300 && w < 1600))];

                    const h1 = doc.querySelector('h1')?.innerText?.trim() || '';
                    const navItems = Array.from(doc.querySelectorAll('.nav a, .menu a, .header-nav a')).map(a => a.innerText.trim()).filter(Boolean).slice(0, 12);
                    
                    const dlButtons = Array.from(doc.querySelectorAll('.down, .download, a[class*="down"], button[class*="down"], .btn-down, .down-btn, .xz_btn')).map(b => b.innerText.trim().replace(/\\s+/g, ' ')).filter(Boolean).slice(0, 8);

                    return {
                        title: doc.title,
                        containerWidths,
                        bodyFontFamily: computedBody.fontFamily,
                        bodyFontSize: computedBody.fontSize,
                        bodyColor: computedBody.color,
                        bodyBgColor: computedBody.backgroundColor,
                        navItems,
                        h1,
                        dlButtons
                    };
                }""")
                results[name] = {
                    "url": url,
                    "title": item["title"],
                    "metrics": metrics,
                    "above_fold_img": f"onlinedown_{name}_fold.png"
                }
                print(f"[+] Success: {name} | {metrics.get('title')}")
            except Exception as e:
                print(f"[-] Error on {name}: {e}")
                results[name] = {"url": url, "error": str(e)}

        # Mobile Viewport
        try:
            print("[*] Capturing mobile homepage...")
            await page.set_viewport_size({"width": 390, "height": 844})
            await page.goto("https://www.onlinedown.net/", wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_timeout(2000)
            await page.screenshot(path=os.path.join(OUTPUT_DIR, "onlinedown_09_mobile_home.png"), full_page=False)

            print("[*] Capturing mobile detail...")
            await page.goto("https://www.onlinedown.net/soft/120118.htm", wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_timeout(2000)
            await page.screenshot(path=os.path.join(OUTPUT_DIR, "onlinedown_10_mobile_detail.png"), full_page=False)
        except Exception as e:
            print(f"[-] Mobile capture error: {e}")

        await browser.close()

    with open(os.path.join(OUTPUT_DIR, "onlinedown_analysis.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("[*] Inspection done!")

asyncio.run(inspect())
