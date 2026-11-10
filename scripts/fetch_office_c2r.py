import urllib.request

urls = [
    "https://fastly.jsdelivr.net/gh/massgravel/massgrave.dev@main/docs/office_c2r_links.md",
    "https://cdn.jsdelivr.net/gh/massgravel/massgrave.dev@main/docs/office_c2r_links.md"
]

for u in urls:
    try:
        print(f"Trying {u}...")
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read().decode("utf-8")
        with open("scripts/massgrave_docs/office_c2r_links.md", "w", encoding="utf-8") as f:
            f.write(data)
        print(f"Success! {len(data)} characters saved to scripts/massgrave_docs/office_c2r_links.md")
        break
    except Exception as e:
        print(f"Error with {u}: {e}")
