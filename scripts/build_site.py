#!/usr/bin/env python3
"""Prepare Daymark's static files and URL-aware sitemap for GitHub Pages."""
from pathlib import Path
import shutil
import sys
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "dist"


def main() -> None:
    if len(sys.argv) != 2 or not sys.argv[1].strip():
        raise SystemExit("Usage: python3 scripts/build_site.py https://username.github.io/repository")

    base_url = sys.argv[1].strip().rstrip("/")
    if not (base_url.startswith("https://") or base_url.startswith("http://")):
        raise SystemExit("The site URL must start with https:// or http://")

    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir(parents=True)

    for filename in ("index.html", "style.css", "app.js"):
        shutil.copy2(ROOT / filename, OUTPUT / filename)

    page_url = f"{base_url}/"
    sitemap_url = f"{base_url}/sitemap.xml"
    (OUTPUT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"  <url><loc>{escape(page_url)}</loc></url>\n"
        "</urlset>\n",
        encoding="utf-8",
    )
    (OUTPUT / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\nSitemap: {sitemap_url}\n",
        encoding="utf-8",
    )
    (OUTPUT / ".nojekyll").touch()
    print(f"Built static site for {base_url}")


if __name__ == "__main__":
    main()
