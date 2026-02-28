# site-lf-solucoes

Site institucional da **LF Solucoes**, publicado via GitHub Pages.

## Estrutura principal

- `index.html` - home institucional
- `styles.css` / `script.js` - base visual e comportamento global
- `sobre/` - pagina institucional da equipe
- `solucoes/` - paginas de ofertas
- `dashboards/` - painel operacional
- `docs/` - runbooks e checklists de qualidade
- `scripts/` - validadores e utilitarios locais

## Rodar localmente

```bash
python3 -m http.server 8080
```

Abrir:

- `http://localhost:8080/`
- `http://localhost:8080/dashboards/`

## Validacoes locais

Validacao estrutural de navegacao e links:

```bash
python3 scripts/validate_site_structure.py
```

Baseline de ativos estaticos:

```bash
python3 scripts/collect_perf_baseline.py
```

## Qualidade automatizada (CI)

- Workflow: `.github/workflows/lighthouse-observe.yml`
- Configs:
  - `.lighthouserc.collect.json`
  - `.lighthouserc.observe.json`
  - `.lighthouserc.json`

O CI executa:

1. coleta de Lighthouse em URLs chave
2. assert em modo observacao
3. quality gate bloqueante (Performance, SEO, A11y e budgets)

## Deploy

- Publicacao automatica em GitHub Pages via `.github/workflows/deploy-pages.yml`
- Branch de deploy: `main`
