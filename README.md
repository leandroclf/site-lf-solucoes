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

Smoke de qualidade (SEO/A11y basico):

```bash
python3 scripts/quality_smoke.py
```

Budgets estaticos:

```bash
python3 scripts/budget_check.py
```

Baseline de ativos estaticos:

```bash
python3 scripts/collect_perf_baseline.py
```

## Qualidade automatizada (CI)

- Workflow: `.github/workflows/lighthouse-observe.yml`
- Workflow adicional: `.github/workflows/quality-smoke.yml`
- Configs:
  - `.lighthouserc.collect.json`
  - `.lighthouserc.observe.json`
  - `.lighthouserc.json`

O CI executa:

1. coleta de Lighthouse em URLs chave
2. assert em modo observacao
3. quality gate bloqueante (Performance, SEO, A11y e budgets)

Thresholds atuais:

- Home e Sobre: Performance >= 90, SEO >= 95, A11y >= 95, Best Practices >= 90
- Dashboard operacional: Performance >= 80, SEO >= 95, A11y >= 86, Best Practices >= 90

Obs.: dashboard possui gate transitorio com melhoria planejada no backlog (`Ticket 11`).

## Deploy

- Publicacao automatica em GitHub Pages via `.github/workflows/deploy-pages.yml`
- Branch de deploy: `main`
