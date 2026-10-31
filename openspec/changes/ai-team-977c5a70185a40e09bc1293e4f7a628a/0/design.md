# Isolated plan

Plan ID: 16abc81ef7f88ea0e88ab2081aae19094dafd107a62c3b2fecc5bb70a3587277
Planning HEAD: ae4f6d391be491cf21dfd3fefd4048fd341b53f3
Risk: R1

## Assumptions

- HEAD corresponde ao SHA informado e o checkout estava limpo na inspeção.
- Não há AGENTS.md local nem OpenSpec no checkout; aplicam-se as instruções fornecidas, README.md, docs/QA_ACCEPTANCE.md e os validadores existentes. Essas ausências não bloqueiam o plano.
- /handoff está vazio; capabilities.json não está presente.
- Esta etapa realizou somente inspeção: nenhum arquivo foi alterado e nenhum código do checkout ou teste foi executado.
- O commit altera apenas script.js: preserva IDs existentes de main e exclui skip links da interceptação de âncoras.
- O dashboard usa outro script, cujo handler ainda cancela a navegação nativa do skip link e apenas executa scrollIntoView; o efeito no teclado precisa ser reproduzido.
- O teto R2 já foi autorizado pelo operador; o trabalho previsto permanece em R1.

## Validation

- Na execução posterior, obter baseline e resultado final de python3 scripts/validate_site_structure.py e python3 scripts/quality_smoke.py.
- Executar python3 scripts/security_smoke.py, python3 scripts/budget_check.py e python3 -m unittest discover -s scripts -p 'test_*.py'.
- Executar python3 scripts/verify_public_catalog.py --local e python3 scripts/build_product_catalog.py --check.
- Executar python3 scripts/build_cloudflare_pages.py em ambiente local, preservando eventual dist preexistente, e verificar os limites do artefato definidos no workflow Quality Smoke.
- Verificar sintaxe com node --check separadamente para cada arquivo JavaScript alterado.
- Servir com python3 -m http.server 8080 --bind 127.0.0.1 e executar os testes de teclado em Chromium e Firefox; registrar navegadores, versões e qualquer limitação de disponibilidade.
- Cobrir todos os skip links existentes e os casos de inicialização de main; verificar desktop, 360x800, 390x844 e prefers-reduced-motion. Usar eventos reais de teclado, sem substituir a ação do usuário por chamadas diretas a focus().
- Revisar o diff final, executar git diff --check e registrar git status --short e git rev-parse HEAD. Não considerar verificações ausentes como aprovadas.
