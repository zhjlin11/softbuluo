#!/bin/bash
set -e

echo "=========================================="
echo "    SOFTTRIBE PRODUCTION SMOKE TEST     "
echo "=========================================="

test_url() {
    local url="$1"
    local desc="$2"
    local code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$code" -eq 200 ] || [ "$code" -eq 301 ] || [ "$code" -eq 302 ]; then
        echo " [PASS] $code - $desc ($url)"
    else
        echo " [FAIL] $code - $desc ($url)"
        exit 1
    fi
}

test_ssr() {
    local route="$1"
    local desc="$2"
    local expected_str="$3"
    local out=$(curl -s -A "Googlebot" "http://127.0.0.1:8080$route")
    if echo "$out" | grep -q "$expected_str"; then
        echo " [PASS] SSR - $desc ($route contains '$expected_str')"
    else
        echo " [FAIL] SSR - $desc ($route does not contain '$expected_str')"
        echo "Snippet: ${out:0:300}"
        exit 1
    fi
}

echo -e "\n1. TESTING CHANNELS & CORE PAGES (STATIC / SPA):"
test_url "http://127.0.0.1:8080/" "Homepage"
test_url "http://127.0.0.1:8080/software" "Software Channel"
test_url "http://127.0.0.1:8080/system-tools" "System Tools Channel"
test_url "http://127.0.0.1:8080/games" "Game Center Channel"
test_url "http://127.0.0.1:8080/essentials" "Essentials Channel"
test_url "http://127.0.0.1:8080/tutorials" "Tutorials Channel"
test_url "http://127.0.0.1:8080/updates" "Updates Channel"
test_url "http://127.0.0.1:8080/compare" "Legacy Compare Route"
test_url "http://127.0.0.1:8080/community" "Legacy Community Route"

echo -e "\n2. TESTING CRAWLER SSR (SEARCH ENGINE BOT):"
test_ssr "/updates" "Updates SSR Title" "最新版本更新中心"
test_ssr "/tutorials" "Tutorials SSR Title" "电脑软件教程与实用技术指南"
test_ssr "/software" "Software SSR Title" "电脑软件"
test_ssr "/system-tools" "System Tools SSR Title" "系统工具"
test_ssr "/games" "Games SSR Title" "游戏"
test_ssr "/essentials" "Essentials SSR Title" "装机必备"
test_ssr "/compare" "Compare SSR Title" "对比"
test_ssr "/community" "Community SSR Title" "社区"

echo -e "\n3. TESTING SITEMAPS & ROBOTS:"
test_url "http://127.0.0.1:8080/robots.txt" "Robots.txt"
test_url "http://127.0.0.1:8080/sitemap.xml" "Sitemap Index"
test_url "http://127.0.0.1:8080/sitemap-software.xml" "Software Sitemap"
test_url "http://127.0.0.1:8080/sitemap-games.xml" "Games Sitemap"
test_url "http://127.0.0.1:8080/sitemap-essentials.xml" "Essentials Sitemap"
test_url "http://127.0.0.1:8080/sitemap-comparisons.xml" "Comparisons Sitemap"
test_url "http://127.0.0.1:8080/sitemap-categories.xml" "Categories Sitemap"
test_url "http://127.0.0.1:8080/sitemap-topics.xml" "Topics Sitemap"
test_url "http://127.0.0.1:8080/sitemap-tutorials.xml" "Tutorials Sitemap"
test_url "http://127.0.0.1:8080/sitemap-developers.xml" "Developers Sitemap"
test_url "http://127.0.0.1:8080/sitemap-community.xml" "Community Sitemap"
test_url "http://127.0.0.1:8080/sitemap-updates.xml" "Updates Sitemap"

echo -e "\n4. TESTING SITEMAP CONTENTS & URL CORRECTIONS:"
# Check that sitemap-developers.xml has /developers
if curl -s http://127.0.0.1:8080/sitemap-developers.xml | grep -q "<loc>https://softtribe.top/developers</loc>"; then
    echo " [PASS] Sitemap Developers root <loc> verified"
else
    echo " [FAIL] Sitemap Developers missing /developers"
    exit 1
fi

# Check that sitemap-community.xml has /community
if curl -s http://127.0.0.1:8080/sitemap-community.xml | grep -q "<loc>https://softtribe.top/community</loc>"; then
    echo " [PASS] Sitemap Community root <loc> verified"
else
    echo " [FAIL] Sitemap Community missing /community"
    exit 1
fi

# Check tutorial count in sitemap is 28 (1 channel + 27 tutorials)
TUT_COUNT=$(curl -s http://127.0.0.1:8080/sitemap-tutorials.xml | grep -c "<loc>")
if [ "$TUT_COUNT" -eq 28 ]; then
    echo " [PASS] Tutorials Sitemap contains exactly 28 <loc> entries (1 index + 27 guides)"
else
    echo " [FAIL] Tutorials Sitemap has $TUT_COUNT <loc> entries (expected 28)"
    exit 1
fi

echo -e "\n5. TESTING BACKEND CHANNELS API:"
test_url "http://127.0.0.1:8080/api/v1/channels/software" "Software API"
test_url "http://127.0.0.1:8080/api/v1/channels/system-tools" "System Tools API"
test_url "http://127.0.0.1:8080/api/v1/channels/games" "Games API"
test_url "http://127.0.0.1:8080/api/v1/channels/essentials" "Essentials API"
test_url "http://127.0.0.1:8080/api/v1/channels/tutorials" "Tutorials API"
test_url "http://127.0.0.1:8080/api/v1/channels/updates" "Updates API"

echo -e "\n=========================================="
echo "    ALL 28 PRODUCTION SMOKE CHECKS PASSED "
echo "=========================================="
