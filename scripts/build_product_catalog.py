#!/usr/bin/env python3
"""Deterministic, dependency-free LF public product catalog generator.

Local source only. New products require reviewed catalog metadata.
Use --check in CI to reject stale generated pages.
"""
import argparse
from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data/product-catalog.json"
OUTPUT = ROOT / "produtos"
SLUG = re.compile(r"^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$")
RUNTIMES = {"typescript-server", "python-server", "self-hosted-fxserver", "local-first-browser"}


def load_catalog():
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    if data.get("schema_version") != 1 or not isinstance(data.get("products"), list):
        raise ValueError("Invalid product catalog schema")
    if data.get("portal_role") != "flagship-corporate-product":
        raise ValueError("LF corporate website must be flagged as the flagship product")
    products = data["products"]
    ids = set()
    for p in products:
        if not isinstance(p, dict):
            raise ValueError("Invalid product entry")
        slug = p.get("slug")
        if not isinstance(slug, str) or not SLUG.fullmatch(slug) or slug in ids:
            raise ValueError("Duplicate or invalid product slug")
        ids.add(slug)
        if p.get("id") != slug or p.get("detail_url") != f"/produtos/{slug}.html":
            raise ValueError("Product identity or permalink drift")
        if p.get("visibility") != "public" or p.get("runtime") not in RUNTIMES:
            raise ValueError("Unreviewed product visibility or runtime")
        for key in ("title", "category", "summary", "highlights"):
            if not isinstance(p.get(key), str) or not (3 if key == "title" else 8) <= len(p[key]) <= 600:
                raise ValueError("Missing or implausible public product content: " + key)
        link = p.get("product_url")
        if link is not None and (not isinstance(link, str) or not link.startswith("https://")):
            raise ValueError("External product link must be reviewed HTTPS or null")
    if len(ids) != len(products) or not ids:
        raise ValueError("Missing or duplicated product")
    return sorted(products, key=lambda p: (p["wave"], p["title"].casefold()))


def base_html(title, description, canonical, content):
    return f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="{escape(description, quote=True)}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; object-src 'none'; base-uri 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'">
<title>{escape(title)} | LF Soluções</title>
<link rel="canonical" href="{escape(canonical, quote=True)}">
<link rel="icon" href="../assets/lf-mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="../styles.css"><link rel="stylesheet" href="../brand-system.css"><link rel="stylesheet" href="catalog.css">
</head><body><a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
<header class="header"><div class="container nav">
<a class="brand" href="../index.html" aria-label="LF Soluções — página inicial"><img class="brand-lockup" src="../assets/lf-logo-horizontal.svg" alt="LF Soluções"></a>
<nav aria-label="Navegação do portfólio" class="catalog-nav"><a href="../index.html">Empresa</a><a href="./">Produtos</a><a href="../solucoes/">Soluções</a><a href="../index.html#contato">Contato</a></nav>
</div></header><main id="conteudo" tabindex="-1">{content}</main>
<footer class="footer"><div class="container"><strong>LF Soluções</strong><span> · Tecnologia que gera valor.</span><p>Os produtos possuem identidades e ciclos de evolução próprios. O catálogo apresenta suas capacidades sem afirmar disponibilidade comercial não verificada.</p></div></footer></body></html>
'''


def catalog_page(products):
    cards = []
    for p in products:
        href = escape(p["slug"] + ".html", quote=True)
        cards.append(f'''<article class="card catalog-card">
<p class="catalog-category">{escape(p["category"])}</p>
<h2><a href="{href}">{escape(p["title"])}</a></h2><p>{escape(p["summary"])}</p>
<a class="btn btn-secondary" href="{href}" aria-label="Conhecer {escape(p["title"], quote=True)}">Conhecer produto</a>
</article>''')
    return base_html("Produtos e plataformas", "Conheça os produtos e plataformas da LF Soluções: tecnologia aplicada a mobilidade, finanças, documentos, dados, educação e operação.", "https://lfsolucoes.etc.br/produtos/",
    '''<section class="hero catalog-hero"><div class="container"><p class="eyebrow">Ecossistema LF Soluções</p>
<h1>Produtos que transformam tecnologia em valor.</h1>
<p class="hero-copy">Conheça as plataformas e iniciativas que fazem parte do portfólio. Cada produto mantém sua especialização, com padrões compartilhados de engenharia, qualidade e segurança.</p>
</div></section><section class="section"><div class="container"><div class="catalog-grid">''' + "\n".join(cards) + '''</div></div></section>''')


def detail_page(p):
    link = ""
    if p["product_url"]:
        link = f'<a class="btn btn-primary" rel="noopener noreferrer" href="{escape(p["product_url"], quote=True)}">Acessar produto</a>'
    content = f'''<section class="hero catalog-hero"><div class="container">
<p class="eyebrow">{escape(p["category"])}</p><h1>{escape(p["title"])}</h1>
<p class="hero-copy">{escape(p["summary"])}</p>
<div class="catalog-actions">{link}<a class="btn btn-secondary" href="./">Ver todos os produtos</a><a class="btn btn-outline" href="../index.html#contato">Conversar sobre a solução</a></div>
</div></section><section class="section"><div class="container catalog-detail">
<article class="card"><h2>O que oferece</h2><p>{escape(p["highlights"])}</p></article>
<article class="card"><h2>Parte do portfólio LF Soluções</h2><p>Este produto é desenvolvido como uma solução independente, com foco no seu domínio, reutilizando padrões de qualidade, segurança e engenharia da LF Soluções quando aplicáveis.</p></article>
</div></section>'''
    return base_html(p["title"], p["summary"], "https://lfsolucoes.etc.br" + p["detail_url"], content)


class _MainCollector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.mains = []

    def handle_starttag(self, tag, attrs):
        if tag == "main":
            self.mains.append(dict(attrs))

    handle_startendtag = handle_starttag


def has_focusable_main(html):
    """True when the page has exactly one main#conteudo and it can receive focus from the skip link."""
    collector = _MainCollector()
    collector.feed(html)
    collector.close()
    targets = [m for m in collector.mains if m.get("id") == "conteudo"]
    return len(targets) == 1 and (targets[0].get("tabindex") or "").strip() == "-1"


def expected_files():
    products = load_catalog()
    pages = {OUTPUT / "index.html": catalog_page(products)}
    pages.update({OUTPUT / (p["slug"] + ".html"): detail_page(p) for p in products})
    return pages


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        pages = expected_files()
        if args.check:
            issues = []
            for file, content in pages.items():
                if not file.is_file():
                    issues.append(str(file.relative_to(ROOT)) + " missing")
                    continue
                current = file.read_text(encoding="utf-8")
                # Enforce semantically required content while allowing human-reviewed markup refinements.
                for fragment in ('<html lang="pt-BR">', '<h1>', '<link rel="canonical"'):
                    if fragment not in current:
                        issues.append(str(file.relative_to(ROOT)) + " missing " + fragment)
                # The skip link target must be focusable; attribute order/quoting may be refined by hand.
                if not has_focusable_main(current):
                    issues.append(str(file.relative_to(ROOT)) + ' missing focusable <main id="conteudo" tabindex="-1">')
                slug = file.stem
                if slug != "index":
                    product = next(p for p in load_catalog() if p["slug"] == slug)
                    for fragment in (escape(product["title"]), escape(product["summary"])):
                        if fragment not in current:
                            issues.append(slug + " stale public content")
                else:
                    for product in load_catalog():
                        if f'{product["slug"]}.html' not in current:
                            issues.append("catalog missing " + product["slug"])
            additional = [str(file.relative_to(ROOT)) for file in OUTPUT.glob("*.html") if file not in pages]
            if issues or additional:
                print("PORTFOLIO_PAGES_OUTDATED:", ", ".join(issues + additional))
                return 1
            print(f"OK: {len(pages) - 1} product pages and catalog match manifest")
            return 0
        OUTPUT.mkdir(parents=True, exist_ok=True)
        for file, content in pages.items():
            file.write_text(content, encoding="utf-8")
        print(f"Generated {len(pages)} catalog HTML files")
        return 0
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        print("PORTFOLIO_CATALOG_BLOCKED:", exc, file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
