#!/usr/bin/env python3
"""Fail-closed checks for published LF Soluções product pages (no external deps)."""
import argparse
import json
import time
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 2_000_000

def expected():
    data = json.loads((ROOT / "data/product-catalog.json").read_text(encoding="utf-8"))
    products = data["products"]
    if not products or len({p["slug"] for p in products}) != len(products):
        raise ValueError("empty or duplicate product catalog")
    return products

def check_local(products):
    home = (ROOT / "index.html").read_text(encoding="utf-8")
    catalog = (ROOT / "produtos/index.html").read_text(encoding="utf-8")
    if 'href="./produtos/"' not in home:
        raise ValueError("home has no product navigation")
    for product in products:
        slug = product["slug"]
        path = ROOT / "produtos" / (slug + ".html")
        if not path.is_file() or f'{slug}.html' not in catalog:
            raise ValueError(f"missing product detail: {slug}")
    print(f"LOCAL_CATALOG_OK products={len(products)}")

def fetch(url, origin):
    p = urlsplit(url)
    if p.scheme != "https" or p.netloc != origin or p.username or p.password:
        raise ValueError("unexpected destination")
    req = Request(url, headers={"User-Agent": "LF-Pages-Catalog-Check/1.0"})
    with urlopen(req, timeout=12) as response:
        destination = urlsplit(response.url)
        if destination.scheme != "https" or destination.netloc != origin:
            raise ValueError("cross-domain redirect")
        if response.status != 200:
            raise ValueError(f"HTTP status {response.status}")
        content = response.read(MAX_BYTES + 1)
        if len(content) > MAX_BYTES:
            raise ValueError("oversize page")
    return content.decode("utf-8")

def check_remote(base, products):
    url = base.rstrip("/") + "/"
    origin = urlsplit(url).netloc
    home = fetch(url, origin)
    catalog = fetch(urljoin(url, "produtos/"), origin)
    if 'href="./produtos/"' not in home:
        raise ValueError("published home missing product navigation")
    for product in products:
        slug = product["slug"]
        if f'{slug}.html' not in catalog:
            raise ValueError(f"published catalog missing {slug}")
        detail = fetch(urljoin(url, f"produtos/{slug}.html"), origin)
        if product["title"].replace("&", "&amp;") not in detail:
            raise ValueError(f"published detail is missing title: {slug}")
    print(f"PUBLIC_CATALOG_OK products={len(products)}")

def main():
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--local", action="store_true")
    mode.add_argument("--remote")
    parser.add_argument("--attempts", type=int, default=1)
    parser.add_argument("--delay", type=int, default=0)
    args = parser.parse_args()
    if not 1 <= args.attempts <= 10 or not 0 <= args.delay <= 30:
        parser.error("invalid polling bounds")
    try:
        products = expected()
        if args.local:
            check_local(products)
            return 0
        if urlsplit(args.remote).scheme != "https" or not urlsplit(args.remote).hostname:
            raise ValueError("HTTPS origin required")
        for attempt in range(args.attempts):
            try:
                check_remote(args.remote, products)
                return 0
            except (ValueError, OSError, HTTPError, URLError, UnicodeError) as exc:
                print(f"catalog not ready ({attempt + 1}/{args.attempts}): {type(exc).__name__}")
                if attempt + 1 < args.attempts:
                    time.sleep(args.delay)
        return 2
    except (ValueError, OSError, KeyError, TypeError, json.JSONDecodeError) as exc:
        print(f"CATALOG_BLOCK: {type(exc).__name__}")
        return 2

if __name__ == "__main__":
    raise SystemExit(main())
