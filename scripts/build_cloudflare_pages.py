#!/usr/bin/env python3
"""Build a static, public-only directory for Cloudflare Pages."""
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "dist"
TOP_LEVEL = ("index.html", "styles.css", "brand-system.css",
             "contrast-fix.css", "script.js", "robots.txt", "sitemap.xml")
STATIC_DIRS = ("assets", "produtos", "solucoes", "dashboards", "sobre", "divulgacao")
ALLOWED = {".html", ".css", ".js", ".json", ".svg", ".png", ".jpg", ".jpeg",
           ".webp", ".ico", ".woff", ".woff2", ".ttf", ".txt", ".xml", ".pdf"}

def build():
    if OUTPUT.is_symlink():
        raise ValueError("symlink build output forbidden")
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir()
    for name in TOP_LEVEL:
        source = ROOT / name
        if not source.is_file() or source.is_symlink():
            raise ValueError(f"required file missing or linked: {name}")
        shutil.copy2(source, OUTPUT / name)
    for dirname in STATIC_DIRS:
        directory = ROOT / dirname
        if not directory.is_dir() or directory.is_symlink():
            raise ValueError(f"static directory missing or linked: {dirname}")
        for file in directory.rglob("*"):
            if file.is_symlink():
                raise ValueError("symlinks forbidden in public site")
            if not file.is_file():
                continue
            if file.suffix.lower() not in ALLOWED:
                raise ValueError(f"unexpected public file type: {file.relative_to(ROOT)}")
            target = OUTPUT / file.relative_to(ROOT)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(file, target)
    catalog = OUTPUT / "produtos/index.html"
    if not catalog.is_file():
        raise ValueError("catalog was not included in public output")
    print("Static public site ready:", OUTPUT)

if __name__ == "__main__":
    try:
        build()
    except (OSError, ValueError) as exc:
        print("BUILD_BLOCKED:", exc, file=sys.stderr)
        sys.exit(2)
