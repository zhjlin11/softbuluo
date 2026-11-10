import asyncio
import json
from playwright.async_api import async_playwright

async def inspect():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})

        # 1. Homepage inspection
        await page.goto("https://www.onlinedown.net/", wait_until="domcontentloaded")
        await page.wait_for_timeout(1000)
        home = await page.evaluate("""() => {
            function getProps(el) {
                if (!el) return null;
                const s = window.getComputedStyle(el);
                return {
                    tag: el.tagName,
                    class: el.className,
                    width: el.offsetWidth,
                    height: el.offsetHeight,
                    padding: s.padding,
                    margin: s.margin,
                    display: s.display,
                    flexDirection: s.flexDirection,
                    gridTemplateColumns: s.gridTemplateColumns,
                    fontSize: s.fontSize,
                    fontWeight: s.fontWeight,
                    lineHeight: s.lineHeight,
                    color: s.color,
                    background: s.backgroundColor,
                    borderRadius: s.borderRadius,
                    border: s.border,
                    boxShadow: s.boxShadow
                };
            }

            const searchInput = document.querySelector('form input[type="text"], input.search');
            const searchBtn = document.querySelector('form button, .search-btn, input[type="submit"]');
            const nav = document.querySelector('.nav, .menu, .header-nav');
            const navLinks = Array.from(document.querySelectorAll('.nav a, .menu a')).slice(0, 5).map(a => ({
                text: a.innerText,
                props: getProps(a)
            }));
            const quickIcons = Array.from(document.querySelectorAll('.top-soft a, .quick-soft a, div[class*="icon"] a, .m-soft a')).slice(0, 4).map(a => ({
                text: a.innerText.trim(),
                props: getProps(a),
                img: getProps(a.querySelector('img'))
            }));

            // Main 3 column section
            const leftCol = document.querySelector('.sort-box, .cate-list, .left-nav, .type-box');
            const midCol = document.querySelector('.banner-box, .focus-box, .slide-box');
            const rightCol = document.querySelector('.hot-news, .rank-box, .right-box');

            return {
                searchInput: getProps(searchInput),
                searchBtn: getProps(searchBtn),
                nav: getProps(nav),
                navLinks,
                quickIcons,
                leftCol: getProps(leftCol),
                midCol: getProps(midCol),
                rightCol: getProps(rightCol)
            };
        }""")

        # 2. Detail page inspection
        await page.goto("https://www.onlinedown.net/soft/120118.htm", wait_until="domcontentloaded")
        await page.wait_for_timeout(1000)
        detail = await page.evaluate("""() => {
            function getProps(el) {
                if (!el) return null;
                const s = window.getComputedStyle(el);
                return {
                    tag: el.tagName,
                    class: el.className,
                    width: el.offsetWidth,
                    height: el.offsetHeight,
                    padding: s.padding,
                    margin: s.margin,
                    display: s.display,
                    fontSize: s.fontSize,
                    fontWeight: s.fontWeight,
                    lineHeight: s.lineHeight,
                    color: s.color,
                    background: s.backgroundColor,
                    borderRadius: s.borderRadius,
                    border: s.border,
                    boxShadow: s.boxShadow
                };
            }

            const h1 = document.querySelector('h1');
            const icon = document.querySelector('h1')?.parentElement?.querySelector('img') || document.querySelector('.soft-icon img, .detail-head img');
            const metaItems = Array.from(document.querySelectorAll('.msg-list li, .info-list li, .soft-msg p, .meta-item')).slice(0, 6).map(li => ({
                text: li.innerText.trim(),
                props: getProps(li)
            }));
            const btns = Array.from(document.querySelectorAll('a[class*="down"], button[class*="down"], .btn')).slice(0, 4).map(b => ({
                text: b.innerText.trim(),
                props: getProps(b)
            }));
            const tabs = Array.from(document.querySelectorAll('.tab a, .tabs li, .menu-title span')).slice(0, 5).map(t => ({
                text: t.innerText.trim(),
                props: getProps(t)
            }));

            return {
                h1: getProps(h1),
                icon: getProps(icon),
                metaItems,
                btns,
                tabs
            };
        }""")

        # 3. Leaderboard (/hits/) inspection
        await page.goto("https://www.onlinedown.net/hits/", wait_until="domcontentloaded")
        await page.wait_for_timeout(1000)
        hits = await page.evaluate("""() => {
            function getProps(el) {
                if (!el) return null;
                const s = window.getComputedStyle(el);
                return {
                    tag: el.tagName,
                    class: el.className,
                    width: el.offsetWidth,
                    height: el.offsetHeight,
                    padding: s.padding,
                    margin: s.margin,
                    display: s.display,
                    fontSize: s.fontSize,
                    fontWeight: s.fontWeight,
                    lineHeight: s.lineHeight,
                    color: s.color,
                    background: s.backgroundColor,
                    borderRadius: s.borderRadius,
                    border: s.border
                };
            }
            const cols = Array.from(document.querySelectorAll('.hit-col, .rank-col, .col, .w-col, div[class*="col"]')).slice(0, 4).map(c => getProps(c));
            const topOne = document.querySelector('.top1, .item-first, .first');
            const topNum = document.querySelector('.num-1, .num, .rank-num');
            return {
                cols,
                topOne: getProps(topOne),
                topNum: getProps(topNum)
            };
        }""")

        await browser.close()

        with open("scripts/onlinedown_ui_specs.json", "w", encoding="utf-8") as f:
            json.dump({"home": home, "detail": detail, "hits": hits}, f, indent=2, ensure_ascii=False)
        print("Specs extracted successfully!")

asyncio.run(inspect())
