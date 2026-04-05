# Autonomy Supervisor Snapshot

Atualizado em: `2026-04-05T18:47:29.206896Z`
Status: `Autonomia em atenção`
Score de autonomia: `61`

## Próxima ação
- `Continuar monitorando ISSUE-007`
- Motivo: Gate 5/5 por repo crítico: lf-wikidata-entity-graph 19/5, lf-worldbank-risk-pricing 9/5, lf-openalex-enrichment-mvp 3/5, site-lf-solucoes 0/5 (próximo repo: lf-openalex-enrichment-mvp).
- Tipo: `monitor-ci-gate`

## Sinais
- Issues AUTO elegíveis: `40`
- AUTO em progresso: `2`
- AUTO autorizadas: `0`
- AUTO planejadas: `0`
- Alertas de governança: `2`
- Repos verdes: `4`
- Repos em alerta: `1`
- Bloqueios: `0`
- Fila de ações: `5`

## Governança
- Baseline pronta: `True`
- Delta anterior disponível: `True`
- Issues no board: `40`
- Coverage de packet: `44.4`%
- Novas issues: `0`
- Issues atualizadas: `0`
- Artifacts rastreados: `35`

### Novas/Atualizadas
- baseline inicial estabelecida; nenhuma issue nova ou alterada no snapshot atual.

### Packets pendentes
- nenhum packet pendente no snapshot atual.

### Artifacts recentes
- `ISSUE-011` — ops/multiagent/delivery/issue-011-financial-baseline-weekly-2026-04-05.md, ops/multiagent/delivery/issue-011-financial-baseline-weekly-pack-v1.md, ops/multiagent/delivery/issue-011-financial-baseline-weekly-template.md | packet=True | board=True | 2026-04-05 18:35 UTC
- `ISSUE-012` — ops/multiagent/delivery/issue-012-lgpd-openaq-osm-source-matrix-2026-04-05.md, ops/multiagent/delivery/issue-012-lgpd-openaq-osm-source-matrix-template.md, ops/multiagent/delivery/issue-012-lgpd-source-matrix-v1.md | packet=True | board=True | 2026-04-05 18:35 UTC

## CI gate ISSUE-007
- Target: `5/5` por repo crítico
- Completo: `False`
- Resumo: `lf-wikidata-entity-graph 19/5, lf-worldbank-risk-pricing 9/5, lf-openalex-enrichment-mvp 3/5, site-lf-solucoes 0/5`
- Próximo repo: `lf-openalex-enrichment-mvp`
- `lf-wikidata-entity-graph`: `19/5` restante `0`
- `lf-worldbank-risk-pricing`: `9/5` restante `0`
- `lf-openalex-enrichment-mvp`: `3/5` restante `2`
- `site-lf-solucoes`: `0/5` restante `5`

## Próximos 5 passos
- `Continuar monitorando ISSUE-007` — Gate 5/5 por repo crítico: lf-wikidata-entity-graph 19/5, lf-worldbank-risk-pricing 9/5, lf-openalex-enrichment-mvp 3/5, site-lf-solucoes 0/5 (próximo repo: lf-openalex-enrichment-mvp). | tipo: `monitor-ci-gate`
- `Reconciliar site-lf-solucoes` — site-lf-solucoes em amarelo | tipo: `reconcile-warning`
- `Finance export autowire em execução` — Status atual: capture_failed | candidatos: 3 | tipo: `finance-export-autowire`
- `Continuar wave ISSUE-007` — Manter a wave ativa: ISSUE-007 (infra-analyst + builder-repo) | tipo: `continue-wave`
- `Continuar wave ISSUE-008` — Manter a wave ativa: ISSUE-008 (strategist-product + growth-sales) | tipo: `continue-wave`

## Candidatos priorizados
- `ISSUE-007` Hardening transversal de CI (anti-regressão de imports/PYTHONPATH) — in_progress | owner: infra-analyst + builder-repo | repo: n/d
- `ISSUE-008` Funil cliente + JTBD semanal por ICP — in_progress | owner: strategist-product + growth-sales | repo: n/d

## Bloqueios
- nenhum

## Alertas amarelos
- `deploy-status.json` — site-lf-solucoes em amarelo

## Alertas de saúde
- Deploy green/yellow/red: 4/1/0
- Autopilot SLA: 96.67%
- Intervenções humanas: 1
- Semáforo: green (consecutiveRed=0)
- Ledger export watchdog: stable | exists=True | /home/leandro/openclaw/data/finance/ledger.csv | sugestão=/home/leandro/openclaw/data/finance/ledger.csv | candidatos=3
- Finance autowire: capture_failed | candidatos=3 | sugestão=/home/leandro/openclaw/data/finance/ledger.csv

## Repos estagnados
- `lf-openalex-enrichment-mvp` — stale | age 217.6h | fix(openalex): normalize shim file endings
- `lf-wikidata-entity-graph` — stale | age 331.7h | Merge pull request #4 from leandroclf/feature/issue-002-grafo-de-entidades-com-wikidata-para-normaliza-o
- `lf-worldbank-risk-pricing` — stale | age 232.8h | feat(worldbank): add telemetry and contract governance

---
Agente: reviewer-delivery + orchestrator
Skill: n/a (execução direta determinística)
Workflow: autonomy-supervisor
