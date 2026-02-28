#!/usr/bin/env python3
"""Basic SEO/A11y smoke checks for static HTML pages."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = sorted(
    list(ROOT.glob("*.html"))
    + list(ROOT.glob("sobre/*.html"))
    + list(ROOT.glob("solucoes/*.html"))
    + list(ROOT.glob("dashboards/*.html"))
)


def extract(pattern: str, text: str) -> list[str]:
    return re.findall(pattern, text, flags=re.I | re.S)


def check_html(path: Path, text: str) -> list[str]:
    rel = path.relative_to(ROOT)
    errors: list[str] = []

    if not re.search(r"<html[^>]*lang=['\"]pt-BR['\"]", text, flags=re.I):
        errors.append(f"{rel}: missing lang=\"pt-BR\" in <html>")

    title_match = re.search(r"<title>(.*?)</title>", text, flags=re.I | re.S)
    if not title_match or not title_match.group(1).strip():
        errors.append(f"{rel}: missing or empty <title>")

    descriptions = extract(r"<meta[^>]*name=['\"]description['\"][^>]*>", text)
    if not descriptions:
        errors.append(f"{rel}: missing meta description")

    h1_count = len(extract(r"<h1\b", text))
    if h1_count != 1:
        errors.append(f"{rel}: expected exactly 1 <h1>, found {h1_count}")

    for img_tag in extract(r"<img\b[^>]*>", text):
        if not re.search(r"\balt=['\"][^'\"]*['\"]", img_tag, flags=re.I):
            errors.append(f"{rel}: image without alt attribute -> {img_tag[:80]}...")

    for tag in extract(r"<a\b[^>]*target=['\"]_blank['\"][^>]*>", text):
        if "rel=" not in tag.lower():
            errors.append(f"{rel}: target=\"_blank\" link without rel attribute")

    return errors


def main() -> int:
    errors: list[str] = []
    for html_file in HTML_FILES:
        text = html_file.read_text(encoding="utf-8")
        errors.extend(check_html(html_file, text))

    if errors:
        print("ERROR: quality smoke failed")
        for item in errors:
            print(f"- {item}")
        return 1

    print(f"OK: quality smoke passed for {len(HTML_FILES)} html files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
