#!/usr/bin/env python3
"""Lightweight structural checks for LF Solucoes static website."""

from __future__ import annotations

import re
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

    if hrefs != expected:
        return [
            f"{path.relative_to(ROOT)}: menu inconsistente\n"
            f"  esperado={expected}\n"
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

    index_text = read_text(ROOT / "index.html")
    if "./sobre/nossa-equipe.html" in index_text:
        errors.append("index.html: link separado para pagina de equipe ainda existe no menu")
    if 'id="sobre-equipe"' not in index_text:
        errors.append('index.html: bloco de equipe ausente na secao Sobre (id="sobre-equipe")')

    if errors:
        print("ERRO: validacao estrutural falhou:")
        for item in errors:
            print(f"- {item}")
        return 1

    print("OK: estrutura validada (menus, links e secao Sobre)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
