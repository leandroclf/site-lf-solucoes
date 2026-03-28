# Autonomy Supervisor Snapshot

Atualizado em: `2026-03-28T12:20:32.937551Z`
Status: `Autonomia em atenção`
Score de autonomia: `74`

## Próxima ação
- `Reconciliar openclaw-workspace`
- Motivo: openclaw-workspace em amarelo
- Tipo: `reconcile-warning`

## Sinais
- Issues AUTO elegíveis: `40`
- AUTO em progresso: `3`
- AUTO autorizadas: `0`
- AUTO planejadas: `0`
- Repos verdes: `4`
- Repos em alerta: `1`
- Bloqueios: `0`
- Fila de ações: `5`

## Próximos 5 passos
- `Reconciliar openclaw-workspace` — openclaw-workspace em amarelo | tipo: `reconcile-warning`
- `Revisar lf-openalex-enrichment-mvp` — Repo estagnado há 115.8h: fix(openalex): clarify coverage metrics | tipo: `refresh-stale-repo`
- `Revisar lf-wikidata-entity-graph` — Repo estagnado há 113.7h: Merge pull request #4 from leandroclf/feature/issue-002-grafo-de-entidades-com-wikidata-para-normaliza-o | tipo: `refresh-stale-repo`
- `Continuar wave ISSUE-007` — Manter a wave ativa: ISSUE-007 (infra-analyst + builder-repo) | tipo: `continue-wave`
- `Continuar wave ISSUE-008` — Manter a wave ativa: ISSUE-008 (strategist-product + growth-sales) | tipo: `continue-wave`

## Candidatos priorizados
- `ISSUE-007` Hardening transversal de CI (anti-regressão de imports/PYTHONPATH) — in_progress | owner: infra-analyst + builder-repo | repo: n/d
- `ISSUE-008` Funil cliente + JTBD semanal por ICP — in_progress | owner: strategist-product + growth-sales | repo: n/d
- `ISSUE-009` Product accountability por responsável — in_progress | owner: reviewer-delivery + strategist-product | repo: n/d

## Bloqueios
- nenhum

## Alertas amarelos
- `deploy-status.json` — openclaw-workspace em amarelo

## Alertas de saúde
- Deploy green/yellow/red: 4/1/0
- Autopilot SLA: 96.67%
- Intervenções humanas: 1
- Semáforo: green (consecutiveRed=0)

## Repos estagnados
- `lf-openalex-enrichment-mvp` — stale | age 115.8h | fix(openalex): clarify coverage metrics
- `lf-wikidata-entity-graph` — stale | age 113.7h | Merge pull request #4 from leandroclf/feature/issue-002-grafo-de-entidades-com-wikidata-para-normaliza-o

---
Agente: reviewer-delivery + orchestrator
Skill: n/a (execução direta determinística)
Workflow: autonomy-supervisor
