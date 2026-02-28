#!/usr/bin/env python3
"""Static asset budget checks for conservative performance control."""

from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

BUDGETS = {
    "html_total_bytes": 170_000,
    "css_total_bytes": 80_000,
    "js_total_bytes": 170_000,
    "image_total_bytes": 450_000,
    "diagnostic_js_bytes": 12_000,
    "roi_js_bytes": 6_000,
}


def collect(patterns: tuple[str, ...]) -> list[Path]:
    out: list[Path] = []
    for pattern in patterns:
        out.extend(ROOT.rglob(pattern))
    return sorted({p for p in out if p.is_file() and ".git/" not in str(p)})


def total_size(paths: list[Path]) -> int:
    return sum(p.stat().st_size for p in paths)


def kb(n: int) -> str:
    return f"{n / 1024:.2f} KB"


def main() -> int:
    html_files = collect(("*.html",))
    css_files = collect(("*.css",))
    js_files = collect(("*.js",))
    image_files = collect(("*.jpg", "*.jpeg", "*.png", "*.svg", "*.webp"))

    current = {
        "html_total_bytes": total_size(html_files),
        "css_total_bytes": total_size(css_files),
        "js_total_bytes": total_size(js_files),
        "image_total_bytes": total_size(image_files),
        "diagnostic_js_bytes": (ROOT / "scripts" / "diagnostic.js").stat().st_size,
        "roi_js_bytes": (ROOT / "scripts" / "roi-simulator.js").stat().st_size,
    }

    print("Static budget report:")
    for key, value in current.items():
        print(f"- {key}: {value} ({kb(value)}) / budget {BUDGETS[key]} ({kb(BUDGETS[key])})")

    failures = [key for key, value in current.items() if value > BUDGETS[key]]
    if failures:
        print("\nERROR: budget exceeded")
        for key in failures:
            over = current[key] - BUDGETS[key]
            print(f"- {key}: +{over} bytes ({kb(over)}) over budget")
        return 1

    print("\nOK: all budgets within limits")
    return 0


if __name__ == "__main__":
    sys.exit(main())
