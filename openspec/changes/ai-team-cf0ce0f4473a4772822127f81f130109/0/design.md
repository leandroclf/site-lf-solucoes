# Isolated plan

Plan ID: 47d7939a2e4a62a44aaa8500134be73360ab0759d964cbc7f7f8e0d2a18f0b3d
Planning HEAD: 3e0cf5c89714a8d2f921fddab330faabbed6f899
Risk: R1

## Assumptions

- O HEAD informado foi confirmado e o checkout estava limpo na inspeção.
- Não existe AGENTS.md local nem em /AGENTS.md. Aplicam-se as instruções fornecidas pelo operador e a documentação disponível; essa ausência não bloqueia o plano.
- Foram lidos o OpenSpec existente, o relatório da issue #125, documentação de qualidade, código, gerador, validadores e regressões relevantes.
- /handoff/capabilities.json não existe; capability_decisions deve permanecer vazio.
- A inspeção encontrou 15 skip links cujos mains não possuem tabindex: home, dashboard, três soluções especializadas e dez páginas do catálogo.
- Os handlers compartilhado e do dashboard já preservam a navegação nativa dos skip links. O teste atual verifica existência e unicidade do destino, mas não sua capacidade de receber foco.
- Esta etapa realizou somente planejamento e leitura: nenhum arquivo foi editado e nenhum código, teste, build, servidor ou navegador do checkout foi executado.
- As execuções descritas abaixo pertencem à etapa posterior de implementação/validação. O teto R2 está autorizado pelo operador; este plano permanece em R1.

## Validation

- Na etapa de execução, obter baseline e resultado final de: python3 scripts/validate_site_structure.py; python3 scripts/quality_smoke.py; python3 scripts/security_smoke.py; python3 scripts/budget_check.py.
- Executar python3 -m unittest discover -s scripts -p 'test_*.py' com Node disponível para incluir as regressões comportamentais. Não considerar testes ignorados como aprovados.
- Executar python3 scripts/verify_public_catalog.py --local e python3 scripts/build_product_catalog.py --check. Em cópia temporária, gerar novamente o catálogo e comprovar os destinos focáveis; remover tabindex de uma amostra temporária para verificar a rejeição.
- Servir localmente com python3 -m http.server 8080 --bind 127.0.0.1. Em cada página, começar sem fragmento e registrar a sequência Tab → Enter → Tab, elemento ativo em cada etapa, hash, visibilidade e rolagem. Não usar focus() como preparação ou prova de sucesso.
- Repetir a validação em Chromium e Firefox, desktop, 360x800 e 390x844, incluindo prefers-reduced-motion. Se houver indisponibilidade de navegador, registrar a lacuna e manter essa validação pendente.
- Executar Lighthouse local conforme .github/workflows/lighthouse-observe.yml, usando @lhci/cli@0.15.1: collect com .lighthouserc.collect.json e asserts com .lighthouserc.observe.json e .lighthouserc.json, sem upload.
- Executar python3 scripts/collect_perf_baseline.py em cópia temporária limpa, antes de gerar dist ou instalar ferramentas dentro dela, para evitar contagem duplicada e alterações documentais incidentais.
- Executar python3 scripts/build_cloudflare_pages.py preservando qualquer dist anterior; conferir dist/index.html, dist/produtos/index.html, os mains afetados e a ausência de dist/data, dist/.github e dist/serverless.
- Se algum JavaScript precisar ser alterado por finding comprovado, executar node --check separadamente para cada arquivo alterado e repetir suas regressões.
- Revisar o diff final e executar git diff --check, git status --short e git rev-parse HEAD; registrar o SHA testado e quaisquer alterações ainda não commitadas.
