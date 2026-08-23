#!/usr/bin/env python3
"""Regression checks for the static site's security-sensitive rendering paths."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


def main() -> int:
    errors: list[str] = []

    dashboard = read("dashboards/script.js")
    for symbol in ("escapeHtml", "safeExternalUrl"):
        if f"function {symbol}" not in dashboard:
            errors.append(f"dashboards/script.js: missing {symbol} helper")
    for pattern in (
        r'href="\$\{p\.repo\}',
        r'\$\{task\.title\}</strong>',
        r'\$\{repoName\}</strong>',
        r'\$\{r\.label\}</strong>',
    ):
        if re.search(pattern, dashboard):
            errors.append(f"dashboards/script.js: raw dynamic HTML interpolation remains: {pattern}")

    forbidden = {
        "scripts/api-sandbox.js": ("btn.innerHTML", "paramsEl.innerHTML"),
        "scripts/diagnostic.js": ("header.innerHTML",),
        "scripts/roi-simulator.js": ("li.innerHTML",),
    }
    for relative, patterns in forbidden.items():
        content = read(relative)
        for pattern in patterns:
            if pattern in content:
                errors.append(f"{relative}: unsafe DOM sink remains: {pattern}")

    for relative in ("scripts/diagnostic.js", "scripts/roi-simulator.js"):
        content = read(relative)
        if "localStorage.setItem" in content:
            errors.append(f"{relative}: sensitive form data must not be persisted with localStorage")

    proposal_worker = read("serverless/proposal-value-worker.js")
    for marker in ("PROPOSAL_API_TOKEN", "Rate limit exceeded", "Number.isFinite(dealSize)", "dealSize > 100000", "Cache-Control", "X-Content-Type-Options"):
        if marker not in proposal_worker:
            errors.append(f"serverless/proposal-value-worker.js: missing {marker}")

    cloudflare_worker = read("serverless/cloudflare-worker-template.js")
    for marker in ("REPORT_API_TOKEN", "forbidden_origin", "Array.isArray(payload)", "Cache-Control", "X-Content-Type-Options"):
        if marker not in cloudflare_worker:
            errors.append(f"serverless/cloudflare-worker-template.js: missing {marker}")

    for page in sorted(ROOT.rglob("*.html")):
        content = page.read_text(encoding="utf-8")
        if 'http-equiv="Content-Security-Policy"' not in content:
            errors.append(f"{page.relative_to(ROOT)}: missing Content-Security-Policy meta")
        if 'name="referrer" content="strict-origin-when-cross-origin"' not in content:
            errors.append(f"{page.relative_to(ROOT)}: missing strict referrer policy")

    if errors:
        print("ERROR: security smoke failed")
        for error in errors:
            print(f"- {error}")
        return 1

    print("OK: security smoke passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
