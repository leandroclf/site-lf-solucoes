#!/usr/bin/env python3
"""Lightweight structural checks for LF Solucoes static website."""

from __future__ import annotations

import re
import importlib.util
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FILES = [
    ROOT / "index.html",
    ROOT / "dashboards" / "index.html",
    ROOT / "sobre" / "nossa-equipe.html",
    *sorted((ROOT / "solucoes").glob("*.html")),
]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def extract_nav_hrefs(text: str) -> list[str]:
    nav_match = re.search(
        r'<nav id="main-menu" class="menu" aria-label="Menu principal">(.*?)</nav>',
        text,
        flags=re.S,
    )
    if not nav_match:
        return []
    return re.findall(r'href="([^"]+)"', nav_match.group(1))


def contains_in_order(actual: list[str], required: list[str]) -> bool:
    """Allow richer menus (for example mega-menu links) while preserving core navigation."""
    cursor = 0
    for href in actual:
        if cursor < len(required) and href == required[cursor]:
            cursor += 1
    return cursor == len(required)


def check_expected_nav(path: Path, hrefs: list[str]) -> list[str]:
    if path.name == "index.html" and path.parent == ROOT:
        expected = [
            "#servicos",
            "#solucoes-especializadas",
            "#mini-cases",
            "#sobre",
            "#faq",
            "./dashboards/",
            "#contato",
        ]
    elif path == ROOT / "solucoes" / "index.html":
        expected = [
            "../index.html#servicos",
            "./",
            "../index.html#mini-cases",
            "../index.html#sobre",
            "../index.html#faq",
            "../dashboards/",
            "../index.html#contato",
        ]
    elif path.parent.name == "dashboards":
        expected = [
            "../index.html#servicos",
            "../index.html#solucoes-especializadas",
            "../index.html#mini-cases",
            "../index.html#sobre",
            "../index.html#faq",
            "./",
            "../index.html#contato",
        ]
    else:
        expected = [
            "../index.html#servicos",
            "../index.html#solucoes-especializadas",
            "../index.html#mini-cases",
            "../index.html#sobre",
            "../index.html#faq",
            "../dashboards/",
            "../index.html#contato",
        ]

    if not contains_in_order(hrefs, expected):
        return [
            f"{path.relative_to(ROOT)}: menu inconsistente\n"
            f"  esperado_em_ordem={expected}\n"
            f"  atual={hrefs}"
        ]
    return []


def check_local_links(path: Path, text: str) -> list[str]:
    errors: list[str] = []
    for href in re.findall(r'href="([^"]+)"', text):
        if href.startswith(("http://", "https://", "mailto:", "tel:", "#", "javascript:")):
            continue
        target_path = href.split("#", 1)[0].split("?", 1)[0]
        if not target_path:
            continue

        resolved = (path.parent / target_path).resolve()
        exists = (resolved / "index.html").exists() if target_path.endswith("/") else resolved.exists()
        if not exists:
            errors.append(f"{path.relative_to(ROOT)}: link local quebrado -> {href}")
    return errors


def main() -> int:
    errors: list[str] = []

    for html_file in FILES:
        text = read_text(html_file)
        hrefs = extract_nav_hrefs(text)
        if not hrefs:
            errors.append(f"{html_file.relative_to(ROOT)}: menu principal nao encontrado")
        else:
            errors.extend(check_expected_nav(html_file, hrefs))

        errors.extend(check_local_links(html_file, text))

        if "Voltar ao site" in text:
            errors.append(f'{html_file.relative_to(ROOT)}: string proibida "Voltar ao site" encontrada')
        if 'target="_blank" rel="noreferrer">Dashboards' in text:
            errors.append(f"{html_file.relative_to(ROOT)}: menu Dashboards ainda abre em nova aba")

    # Portfolio is a first-class publishing surface. Every registered product needs
    # a discoverable, current detail page; fail CI rather than silently omit it.
    spec = importlib.util.spec_from_file_location("catalog", ROOT / "scripts" / "build_product_catalog.py")
    catalog = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(catalog)
    try:
        pages = catalog.expected_files()
        product_ids = [p["slug"] for p in catalog.load_catalog()]
        catalog_html = ROOT / "produtos" / "index.html"
        if not catalog_html.is_file():
            errors.append("produtos/index.html: catalogo ausente")
        else:
            catalog_text = read_text(catalog_html)
            errors.extend(check_local_links(catalog_html, catalog_text))
            for slug in product_ids:
                if f'{slug}.html' not in catalog_text:
                    errors.append(f"produtos/index.html: produto {slug} ausente")
                detail = ROOT / "produtos" / f"{slug}.html"
                if not detail.is_file():
                    errors.append(f"produtos/{slug}.html: pagina ausente")
                else:
                    text = read_text(detail)
                    errors.extend(check_local_links(detail, text))
                    product = next(p for p in catalog.load_catalog() if p["slug"] == slug)
                    if product["title"].replace("&", "&amp;") not in text or product["summary"].replace("&", "&amp;") not in text:
                        errors.append(f"produtos/{slug}.html: conteudo defasado")
        stale = [f.name for f in (ROOT / "produtos").glob("*.html") if f not in pages]
        if stale:
            errors.append("Paginas de produto fora do catalogo: " + ", ".join(stale))
    except (ValueError, OSError, KeyError) as exc:
        errors.append(f"Catalogo de produtos invalido: {exc}")

    # Reuse existing protected site CI to enforce registry-snapshot/catalog consistency.
    spec_sync = importlib.util.spec_from_file_location("portal_sync", ROOT / "scripts" / "validate_portal_registry_sync.py")
    sync = importlib.util.module_from_spec(spec_sync)
    spec_sync.loader.exec_module(sync)
    try:
        import json
        snapshot = json.loads(read_text(ROOT / "data" / "platform-portfolio.snapshot.json"))
        catalog_data = json.loads(read_text(ROOT / "data" / "product-catalog.json"))
        errors.extend("portal registry: " + message for message in sync.validate(snapshot, catalog_data))
    except (ValueError, OSError, KeyError) as exc:
        errors.append("portal registry snapshot: " + str(exc))

    index_text = read_text(ROOT / "index.html")
    if "./sobre/nossa-equipe.html" in index_text:
        errors.append("index.html: link separado para pagina de equipe ainda existe no menu")

    if errors:
        print("ERRO: validacao estrutural falhou:")
        for item in errors:
            print(f"- {item}")
        return 1

    print("OK: estrutura validada (menus e links locais)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
