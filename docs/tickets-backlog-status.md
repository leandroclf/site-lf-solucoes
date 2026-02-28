# Backlog de Evolucao (Status Final)

Status consolidado dos tickets planejados para evolucao segura do site.

## Ticket 01 - Baseline tecnico e metas
- Status: Concluido
- Entrega: `docs/perf-baseline.md`, `scripts/collect_perf_baseline.py`
- Metricas: baseline de tamanho estatico por tipo de ativo

## Ticket 02 - Lighthouse CI + budgets
- Status: Concluido
- Entrega: `.github/workflows/lighthouse-observe.yml`, `.lighthouserc*.json`
- Metricas: gates para perf/seo/a11y e limite de peso de recursos

## Ticket 03 - Design system minimo
- Status: Concluido
- Entrega: tokens e componentes base em `styles.css`
- Metricas: consistencia visual sem dependencia externa

## Ticket 04 - Microinteracoes seguras
- Status: Concluido
- Entrega: transicoes leves e reveal por IntersectionObserver em `script.js`
- Metricas: motion curta, suporte a `prefers-reduced-motion`

## Ticket 05 - Diagnostico 60s
- Status: Concluido
- Entrega: modulo `scripts/diagnostic.js` + secao em `index.html`
- Metricas: bundle local <= 12 KB

## Ticket 06 - Simulador ROI
- Status: Concluido
- Entrega: modulo `scripts/roi-simulator.js` + secao em `index.html`
- Metricas: bundle local <= 6 KB

## Ticket 07 - Instrumentacao de eventos
- Status: Concluido
- Entrega: `window.LFSiteTrack` no `script.js`
- Metricas: eventos de CTA/diagnostico/roi sem bloqueio de carregamento

## Ticket 08 - IA opcional com guardrails
- Status: Concluido (modo opcional)
- Entrega: `docs/serverless-mini-report.md`, `serverless/cloudflare-worker-template.js`
- Metricas: fallback local obrigatorio + contrato seguro

## Ticket 09 - SEO tecnico
- Status: Concluido
- Entrega: `robots.txt`, `sitemap.xml`
- Metricas: rastreabilidade para Pages

## Ticket 10 - Hardening final
- Status: Concluido
- Entrega: `docs/hardening-checklist.md`, `scripts/quality_smoke.py`, `scripts/budget_check.py`, workflow `quality-smoke.yml`
- Metricas: checks automatizados para evitar regressao estrutural/SEO/A11y basico

## Ticket 11 - Dashboard Lighthouse uplift
- Status: Concluido
- Objetivo: elevar `dashboards/` para Performance >= 0.90 e A11y >= 0.95
- Entrega:
  - carregamento por prioridade (core -> medio -> baixo impacto) em `dashboards/script.js`
  - cache de leitura JSON com TTL para reduzir custo de runtime
  - render incremental em listas grandes do Kanban via `requestAnimationFrame`
  - melhorias de acessibilidade (skip link, `aria-live`, foco visivel, contraste)
  - thresholds finais restaurados em `.lighthouserc.observe.json` e `.lighthouserc.json`

## Ticket 12 - Servicos principais com paginas detalhadas
- Status: Concluido
- Entrega:
  - links `Saiba mais` em `index.html#servicos`
  - novas paginas:
    - `solucoes/automacao-processos.html`
    - `solucoes/business-intelligence.html`
    - `solucoes/ia-aplicada-servicos.html`
  - `sitemap.xml` e `docs/QA_ACCEPTANCE.md` atualizados
