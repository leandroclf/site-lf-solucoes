# Autonomy Supervisor Snapshot

Atualizado em: `2026-03-29T12:17:21.297865Z`
Status: `Autonomia em atenção`
Score de autonomia: `68`

## Próxima ação
- `Continuar monitorando ISSUE-007`
- Motivo: Gate 5/5 por repo crítico: lf-wikidata-entity-graph 19/5, lf-worldbank-risk-pricing 9/5, lf-openalex-enrichment-mvp 3/5, site-lf-solucoes 0/5 (próximo repo: lf-openalex-enrichment-mvp).
- Tipo: `monitor-ci-gate`

## Sinais
- Issues AUTO elegíveis: `40`
- AUTO em progresso: `2`
- AUTO autorizadas: `0`
- AUTO planejadas: `0`
- Alertas de governança: `1`
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
- `ISSUE-008` — ops/multiagent/delivery/issue-008-009-jtbd-accountability-reconciliation-v1.md, ops/multiagent/delivery/issue-008-009-operational-checklist.md, ops/multiagent/delivery/issue-008-jtbd-interview-plan-2026-02-25.md, ops/multiagent/delivery/issue-008-progress-2026-02-27-1242.md, ops/multiagent/delivery/issue-009-ownership-map-2026-02-25.md, ops/multiagent/delivery/issue-013-revenue-hypotheses-backlog-v1.md, ops/multiagent/delivery/issue-013-revenue-hypotheses-pack-v1.md, issues/ISSUE-008.md, issues/ISSUE-009-D7-preliminary-decisions-W09.md, issues/ISSUE-009-D7-weekly-decision-template.md, issues/ISSUE-009.md | packet=True | board=True | 2026-03-29 12:08 UTC
- `ISSUE-009` — ops/multiagent/delivery/issue-008-009-jtbd-accountability-reconciliation-v1.md, ops/multiagent/delivery/issue-008-009-operational-checklist.md, ops/multiagent/delivery/issue-009-decision-enforcement-checklist-2026-02-25-2301.md, ops/multiagent/delivery/issue-009-ownership-map-2026-02-25.md, issues/ISSUE-009-D7-preliminary-decisions-W09.md, issues/ISSUE-009-D7-weekly-decision-template.md, issues/ISSUE-009.md | packet=True | board=True | 2026-03-29 12:08 UTC
- `ISSUE-013` — ops/multiagent/delivery/issue-008-progress-2026-02-27-1242.md, ops/multiagent/delivery/issue-013-revenue-hypotheses-backlog-v1.md, ops/multiagent/delivery/issue-013-revenue-hypotheses-pack-v1.md, ops/multiagent/delivery/issue-013-saas-b2b-commercial-pilot-closeout-v1.md, ops/multiagent/delivery/issue-013-saas-b2b-commercial-pilot-pack-v1.md, ops/multiagent/delivery/issue-013-saas-b2b-commercial-pilot-scorecard-v1.md, ops/multiagent/delivery/issue-013-saas-b2b-commercial-pilot-v1.md, issues/ISSUE-008.md | packet=True | board=True | 2026-03-29 12:08 UTC
- `ISSUE-025` — ops/multiagent/delivery/issue-025-productivity-recovery-closeout-v1.md | packet=True | board=True | 2026-03-29 12:08 UTC
- `ISSUE-004` — ops/multiagent/delivery/issue-009-decision-enforcement-checklist-2026-02-25-2301.md, ops/multiagent/delivery/issue-009-ownership-map-2026-02-25.md, ops/multiagent/delivery/issue-012-lgpd-source-matrix-v1.md | packet=True | board=True | 2026-03-29 12:08 UTC

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
- `Continuar wave ISSUE-007` — Manter a wave ativa: ISSUE-007 (infra-analyst + builder-repo) | tipo: `continue-wave`
- `Continuar wave ISSUE-008` — Manter a wave ativa: ISSUE-008 (strategist-product + growth-sales) | tipo: `continue-wave`
- `Revisar lf-wikidata-entity-graph` — Repo estagnado há 157.2h: Merge pull request #4 from leandroclf/feature/issue-002-grafo-de-entidades-com-wikidata-para-normaliza-o | tipo: `refresh-stale-repo`

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

## Repos estagnados
- `lf-wikidata-entity-graph` — stale | age 157.2h | Merge pull request #4 from leandroclf/feature/issue-002-grafo-de-entidades-com-wikidata-para-normaliza-o
- `lf-worldbank-risk-pricing` — stale | age 58.3h | feat(worldbank): add telemetry and contract governance

---
Agente: reviewer-delivery + orchestrator
Skill: n/a (execução direta determinística)
Workflow: autonomy-supervisor
