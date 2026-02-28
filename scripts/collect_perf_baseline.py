#!/usr/bin/env python3
"""Collect static asset baseline for the LF Solucoes website."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOC_PATH = ROOT / "docs" / "perf-baseline.md"


def bytes_to_kb(size: int) -> float:
    return round(size / 1024, 2)


def collect_files(patterns: tuple[str, ...]) -> list[Path]:
    files: list[Path] = []
    for pattern in patterns:
        files.extend(ROOT.rglob(pattern))
    return sorted({p for p in files if p.is_file() and ".git/" not in str(p)})


def total_size(files: list[Path]) -> int:
    return sum(p.stat().st_size for p in files)


def markdown_top_files(files: list[Path], limit: int = 12) -> str:
    rows = ["| Arquivo | Tamanho (KB) |", "|---|---:|"]
    for path in sorted(files, key=lambda item: item.stat().st_size, reverse=True)[:limit]:
        rel = path.relative_to(ROOT)
        rows.append(f"| `{rel}` | {bytes_to_kb(path.stat().st_size):.2f} |")
    return "\n".join(rows)


def main() -> None:
    html_files = collect_files(("*.html",))
    css_files = collect_files(("*.css",))
    js_files = collect_files(("*.js",))
    image_files = collect_files(("*.jpg", "*.jpeg", "*.png", "*.svg", "*.webp"))

    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    content = f"""# Baseline de Performance

Gerado automaticamente em: **{generated_at}**

## Inventario de tamanho estatico

- HTML total: **{bytes_to_kb(total_size(html_files)):.2f} KB** ({len(html_files)} arquivos)
- CSS total: **{bytes_to_kb(total_size(css_files)):.2f} KB** ({len(css_files)} arquivos)
- JS total: **{bytes_to_kb(total_size(js_files)):.2f} KB** ({len(js_files)} arquivos)
- Imagens totais: **{bytes_to_kb(total_size(image_files)):.2f} KB** ({len(image_files)} arquivos)

## Maiores arquivos (top 12)

{markdown_top_files(html_files + css_files + js_files + image_files)}

## Lighthouse

Observacao: a baseline de Lighthouse sera coletada pelo workflow de CI para
garantir execucao em ambiente padrao e repetivel.

Metas de qualidade (gate):

- Performance >= 90
- SEO >= 95
- Acessibilidade >= 95
- Best Practices >= 90
"""

    DOC_PATH.parent.mkdir(parents=True, exist_ok=True)
    DOC_PATH.write_text(content, encoding="utf-8")
    print(f"Baseline atualizado em {DOC_PATH}")


if __name__ == "__main__":
    main()
