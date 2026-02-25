# Frontend Review — Site + Dashboard

## Melhorias aplicadas nesta rodada

### Site institucional (`index.html`, `styles.css`, `script.js`)
1. **Menu mobile funcional**
   - Antes: menu ocultava no mobile sem navegação alternativa.
   - Agora: botão hamburguer com abertura/fechamento do menu.
2. **Acessibilidade básica do menu**
   - `aria-expanded`, `aria-controls`, `aria-label` no botão de menu.

### Dashboard (`dashboards/*`)
1. **Métricas dinâmicas no topo**
   - `Pendências HUMAN` calculada pelos cards filtrados.
   - `HUMAN sem runbook` calculada automaticamente.
2. **Ação rápida de usabilidade**
   - Botão `Limpar filtros` para reset completo.
3. **Consistência de governança**
   - Runbook obrigatório para HUMAN continua com alerta bloqueante.

## Benefício esperado
- Melhor navegabilidade mobile no site principal.
- Menor atrito de operação no dashboard.
- Visibilidade imediata de gargalos HUMAN e pendências sem runbook.

## Próxima evolução recomendada
- Persistir filtros na URL (query params) para compartilhamento do estado do dashboard.
- Modo impressão/relatório para status semanal.
- Refresh automático (polling leve) do `kanban.json` a cada 2-5 min.
