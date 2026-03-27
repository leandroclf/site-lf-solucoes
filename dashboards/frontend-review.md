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
4. **Acompanhamento de ondas ativas**
   - Painel `Ondas ativas e implementação` mostra waves em progresso e destaca `ISSUE-022` enquanto estiver sob monitoramento.
   - A visão de `repo-sync` e `recentAdvances` agora torna o progresso dos repositórios visível no mesmo painel.
5. **Comparativos reais persistidos**
   - `metrics-history.json` passa a guardar snapshots históricos do board e do deploy status.
   - O painel `Comparativos reais` mostra abertura, conclusão, saúde dos repositórios e a tendência entre snapshots.
6. **CTAs imediatas e metas visuais**
   - O topo do dashboard agora traz uma faixa de ações imediatas com drill para alertas, funil comercial, comparativos reais e kanban.
   - As sparklines exibem linha de meta e informam se a meta visual foi atingida ou não.
7. **Analytics tracking do dashboard**
   - O dashboard registra cliques, mudanças de visão, filtros e exportações em `localStorage`.
   - O novo painel `Sinais rastreados` mostra cobertura ativa, família mais ativa, recência e os últimos sinais capturados.

## Benefício esperado
- Melhor navegabilidade mobile no site principal.
- Menor atrito de operação no dashboard.
- Visibilidade imediata de gargalos HUMAN e pendências sem runbook.
- Leitura executiva mais clara da implementação em andamento, sem precisar abrir o board completo.
- Drill operacional direto a partir do estado geral e metas visuais por gráfico.
- Leitura de sinais de interação para acompanhar adoção real do dashboard.

## Próxima evolução recomendada
- Persistir filtros na URL (query params) para compartilhamento do estado do dashboard.
- Modo impressão/relatório para status semanal.
- Refresh automático (polling leve) do `kanban.json` a cada 2-5 min.
- Persistir comparativos semanais do `metrics-history.json` com retenção maior e exportação semanal.
