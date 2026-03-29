# Autonomy Supervisor Snapshot

Atualizado em: `2026-03-29T02:59:03.877252Z`
Status: `Autonomia em atenção`
Score de autonomia: `71`

## Próxima ação
- `Continuar monitorando ISSUE-007`
- Motivo: Gate 5/5 por repo crítico: lf-openalex-enrichment-mvp 3/5, site-lf-solucoes 3/5, lf-wikidata-entity-graph 1/5, lf-worldbank-risk-pricing 1/5 (próximo repo: lf-openalex-enrichment-mvp).
- Tipo: `monitor-ci-gate`

## Sinais
- Issues AUTO elegíveis: `40`
- AUTO em progresso: `2`
- AUTO autorizadas: `0`
- AUTO planejadas: `0`
- Alertas de governança: `1`
- Repos verdes: `5`
- Repos em alerta: `0`
- Bloqueios: `0`
- Fila de ações: `5`

## Governança
- Baseline pronta: `True`
- Delta anterior disponível: `True`
- Issues no board: `40`
- Coverage de packet: `22.2`%
- Novas issues: `0`
- Issues atualizadas: `0`
- Artifacts rastreados: `35`

### Novas/Atualizadas
- baseline inicial estabelecida; nenhuma issue nova ou alterada no snapshot atual.

### Packets pendentes
- nenhum packet pendente no snapshot atual.

### Artifacts recentes
- nenhum artifact recente detectado.

## CI gate ISSUE-007
- Target: `5/5` por repo crítico
- Completo: `False`
- Resumo: `lf-openalex-enrichment-mvp 3/5, site-lf-solucoes 3/5, lf-wikidata-entity-graph 1/5, lf-worldbank-risk-pricing 1/5`
- Próximo repo: `lf-openalex-enrichment-mvp`
- `lf-openalex-enrichment-mvp`: `3/5` restante `2`
- `site-lf-solucoes`: `3/5` restante `2`
- `lf-wikidata-entity-graph`: `1/5` restante `4`
- `lf-worldbank-risk-pricing`: `1/5` restante `4`

## Próximos 5 passos
- `Continuar monitorando ISSUE-007` — Gate 5/5 por repo crítico: lf-openalex-enrichment-mvp 3/5, site-lf-solucoes 3/5, lf-wikidata-entity-graph 1/5, lf-worldbank-risk-pricing 1/5 (próximo repo: lf-openalex-enrichment-mvp). | tipo: `monitor-ci-gate`
- `Continuar wave ISSUE-007` — Manter a wave ativa: ISSUE-007 (infra-analyst + builder-repo) | tipo: `continue-wave`
- `Continuar wave ISSUE-008` — Manter a wave ativa: ISSUE-008 (strategist-product + growth-sales) | tipo: `continue-wave`
- `Revisar lf-wikidata-entity-graph` — Repo estagnado há 147.7h: Merge pull request #4 from leandroclf/feature/issue-002-grafo-de-entidades-com-wikidata-para-normaliza-o | tipo: `refresh-stale-repo`
- `Revisar lf-worldbank-risk-pricing` — Repo estagnado há 48.8h: feat(worldbank): add telemetry and contract governance | tipo: `refresh-stale-repo`

## Candidatos priorizados
- `ISSUE-007` Hardening transversal de CI (anti-regressão de imports/PYTHONPATH) — in_progress | owner: infra-analyst + builder-repo | repo: n/d
- `ISSUE-008` Funil cliente + JTBD semanal por ICP — in_progress | owner: strategist-product + growth-sales | repo: n/d

## Bloqueios
- nenhum

## Alertas de saúde
- Deploy green/yellow/red: 5/0/0
- Autopilot SLA: 96.67%
- Intervenções humanas: 1
- Semáforo: green (consecutiveRed=0)

## Repos estagnados
- `lf-wikidata-entity-graph` — stale | age 147.7h | Merge pull request #4 from leandroclf/feature/issue-002-grafo-de-entidades-com-wikidata-para-normaliza-o
- `lf-worldbank-risk-pricing` — stale | age 48.8h | feat(worldbank): add telemetry and contract governance

---
Agente: reviewer-delivery + orchestrator
Skill: n/a (execução direta determinística)
Workflow: autonomy-supervisor
