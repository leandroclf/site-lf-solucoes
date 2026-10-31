# Revisão da correção da issue #125 — links de acesso rápido (skip links)

- Plano: `16abc81ef7f88ea0e88ab2081aae19094dafd107a62c3b2fecc5bb70a3587277` (risco R1)
- Commit revisado (correção da issue): `ae4f6d391be491cf21dfd3fefd4048fd341b53f3`
- HEAD no início desta revisão: `0f544f306e0273faf5bdba9003fa6a909e0d7b13` (branch `ai-team/977c5a70185a40e09bc1293e4f7a628a`, checkout limpo)
- Fora do escopo: publicação, push, PR, deploy, refatorações e mudanças de conteúdo. Nada disso foi feito.

## 1. Escopo e inventário (T1)

O commit `ae4f6d3` altera apenas `script.js`, o script compartilhado do site:

- o fallback agora só define `id="conteudo"` quando **não** existe `#conteudo` e há um `main:not([id])`, então IDs existentes (por exemplo `#main-content`) são preservados;
- o handler genérico de âncoras retorna cedo para `.skip-link`, mantendo a navegação nativa por fragmento.

Inventário dos 15 skip links (confirmado por inspeção do markup):

| Página | href | Destino estático | JavaScript |
|---|---|---|---|
| `index.html` | `#conteudo` | `<main id="conteudo">` (único) | `script.js` compartilhado |
| `solucoes/openalex-enrichment.html` | `#main-content` | `<main id="main-content">` (único) | `../script.js` + módulo inline |
| `solucoes/wikidata-entity-graph.html` | `#main-content` | `<main id="main-content">` (único) | `../script.js` + módulo inline |
| `solucoes/worldbank-risk-pricing.html` | `#main-content` | `<main id="main-content">` (único) | `../script.js` + módulo inline |
| `produtos/index.html` + 9 páginas de detalhe | `#conteudo` | `<main id="conteudo">` (gerado por `scripts/build_product_catalog.py`) | nenhum |
| `dashboards/index.html` | `#main-content` | `<main id="main-content">` (único) | `dashboards/script.js` (próprio) |

Páginas com `<main>` sem ID que recebem o fallback `#conteudo` via `script.js`: `solucoes/automacao-processos.html`, `ai-assistants.html`, `integrations-apis.html`, `ia-aplicada-servicos.html`, `business-intelligence.html`, `whatsapp-automation.html` e `sobre/nossa-equipe.html`. Nenhuma delas tem outro elemento `#conteudo`, então o fallback não gera duplicação. Essas páginas e `solucoes/index.html` não têm skip link. Essa lacuna já existia e não foi alterada.

## 2. Findings

### F1 — Dashboard intercepta o skip link (corrigido)

`dashboards/script.js` não usa o `script.js` compartilhado. O handler próprio (`for (const link of document.querySelectorAll('a[href^="#"]'))`) chamava `event.preventDefault()` e `scrollIntoView({behavior:'smooth'})` para **todos** os links `#`, inclusive `.skip-link`. Efeitos, verificados por inspeção:

- o hash não muda para `#main-content`;
- sem navegação nativa por fragmento, o ponto inicial da navegação sequencial de foco não vai para o `main`. O Tab seguinte continua a partir do skip link, no cabeçalho e nos atalhos, em vez de seguir pelo conteúdo principal (AC3);
- a rolagem é sempre suave e ignora `prefers-reduced-motion` nesse caminho.

**Correção mínima:** retorno antecipado para `link.classList.contains('skip-link')` no handler do dashboard, igual ao que `ae4f6d3` fez em `script.js`. Os demais atalhos e CTAs do dashboard continuam interceptados, com rolagem e telemetria como antes. Como o CSS do dashboard não define `scroll-behavior`, o salto nativo é imediato e respeita o movimento reduzido.

### F2 — Validador estrutural não verificava destinos dos skip links (lacuna de verificação, corrigida)

`scripts/validate_site_structure.py` só validava menus e links locais com caminho. Foi adicionado `check_skip_links()`, que usa `html.parser` (ignora o conteúdo de `<script>`) e exige que cada `.skip-link` aponte para um fragmento local que resolva para **exatamente um** `id`. A checagem roda em `FILES`, no catálogo e nas páginas de detalhe de produto.

### Observação não corrigida (pré-existente, fora do escopo)

- Os atalhos e CTAs do dashboard (não os skip links) ainda usam `behavior:'smooth'` fixo e ignoram `prefers-reduced-motion`. Não há relação com a issue #125, então nada foi alterado. Recomenda-se uma issue separada.

### Confirmações por inspeção (sem alteração)

- `script.js` (`ae4f6d3`): preserva `#main-content` e `#conteudo` existentes. Não falha sem `main` (`querySelector` retorna `null`, e a condição curto-circuita). Âncoras comuns continuam com `preventDefault` + `scrollIntoView`, `auto` quando há movimento reduzido.
- Foco visível: `styles.css` (`.skip-link:focus { top: 1rem }`) e `dashboards/styles-base.css` (`.skip-link:focus-visible { left: 12px; top: 12px }`).
- Produtos: HTML estático sem JavaScript, então a navegação por fragmento é sempre nativa. O gerador (`build_product_catalog.py`) emite o mesmo skip link e `main#conteudo` e não precisou de ajuste.

## 3. Regressões adicionadas (T3)

`scripts/test_skip_links.py` (descoberto por `python3 -m unittest discover -s scripts -p 'test_*.py'`):

- **Estruturais:** alvo válido, alvo ausente, alvo duplicado, href sem fragmento, ID dentro de `<script>` que não conta como alvo, inventário real dos skip links com exatamente um destino cada, e `main` sem ID com fallback único.
- **Comportamentais:** usam Node com um DOM mínimo e são ignoradas com motivo explícito se `node` não estiver disponível.
  - `script.js`: preserva o ID existente do `main`, aplica o fallback no `main` sem ID, não duplica um `#conteudo` existente, mantém `main#conteudo` e não falha sem `main`. O skip link não chama `preventDefault`. A âncora comum rola com `smooth`, ou com `auto` quando há movimento reduzido.
  - `dashboards/script.js`: executa o bloco real do handler, extraído do arquivo. O skip link não é interceptado nem rastreado. O atalho de navegação e o CTA `data-dashboard-action` continuam com `preventDefault`, rolagem e telemetria (1 sinal).
- **Detecção do defeito:** `test_dashboard_skip_link_keeps_native_navigation` falha no código anterior (`prevented == true`) e passa com a correção.

## 4. Comandos e resultados (T2/T5)

Pelas regras deste ambiente, o agente **não executa** código do checkout (testes, validadores, build, servidor local ou navegador). Essas execuções ficam com o host, sem credenciais. Até lá, **nenhum** dos itens abaixo pode ser considerado aprovado:

| Comando / verificação | Status |
|---|---|
| `python3 scripts/validate_site_structure.py` (baseline e final) | não executado pelo agente |
| `python3 scripts/quality_smoke.py` | não executado pelo agente |
| `python3 scripts/security_smoke.py` | não executado pelo agente |
| `python3 scripts/budget_check.py` | não executado pelo agente |
| `python3 -m unittest discover -s scripts -p 'test_*.py'` | não executado pelo agente |
| `python3 scripts/verify_public_catalog.py --local` | não executado pelo agente |
| `python3 scripts/build_product_catalog.py --check` | não executado pelo agente (gerador e páginas não foram alterados) |
| `python3 scripts/build_cloudflare_pages.py` + limites do artefato de `dist` | não executado pelo agente |
| `node --check dashboards/script.js` | não executado pelo agente |
| Teclado em Chromium/Firefox (Tab → Enter → Tab), desktop, 360x800, 390x844, `prefers-reduced-motion` | **não executado**: não há navegador disponível para o agente. A evidência de AC3 em navegador real continua pendente |
| `git diff --check`, `git status --short`, `git rev-parse HEAD` | não executado pelo agente |

Roteiro manual sugerido para AC3, em cada página do inventário: servir com `python3 -m http.server 8080 --bind 127.0.0.1`; pressionar Tab e confirmar que o skip link fica visível; pressionar Enter e confirmar o hash `#main-content`/`#conteudo` e a rolagem até o `main`; pressionar Tab de novo e confirmar que o foco vai para o primeiro elemento focável **dentro** do `main`, e não para o cabeçalho. No dashboard, repetir o roteiro antes e depois de F1.

## 5. Alterações

- `dashboards/script.js`: retorno antecipado para `.skip-link` no handler de âncoras (F1).
- `scripts/validate_site_structure.py`: `check_skip_links()` e sua aplicação às páginas validadas (F2).
- `scripts/test_skip_links.py`: regressões estruturais e comportamentais (novo).
- `docs/review-issue-125.md`: este relatório.

Nenhum HTML, CSS, conteúdo ou gerador de produtos foi alterado.

## 6. SHA e estado do checkout

- Por instrução do ambiente, o agente **não fez commit**. As alterações acima estão no working tree, sobre `0f544f306e0273faf5bdba9003fa6a909e0d7b13`.
- O SHA final testado será o do commit criado pelo host após rodar as validações. Ele deve ser obtido com `git rev-parse HEAD` e registrado junto deste relatório, separado de qualquer commit posterior só de documentação.
- Não houve publicação, push, PR ou deploy.

---

# Continuação — destino do skip link não recebia foco

- Plano: `47d7939a2e4a62a44aaa8500134be73360ab0759d964cbc7f7f8e0d2a18f0b3d` (risco R1); base do plano `3e0cf5c89714a8d2f921fddab330faabbed6f899`.
- HEAD do checkout ao implementar: `a4b567909ef92b986448760f20d735a1105fa198` (branch `ai-team/cf0ce0f4473a4772822127f81f130109`, limpo no início; o commit `a4b5679` contém só os registros OpenSpec da orquestração).
- Alterações no working tree, **sem commit**. Nada foi publicado, enviado (push), aberto como PR ou implantado.

## 7. Defeito

Evidência fornecida pelo operador (Chromium, não reproduzida pelo agente): na home, Tab → Enter no skip link muda o hash para `#conteudo`, mas o foco permanece no link, e o próximo Tab volta ao logo do cabeçalho.

Causa, confirmada por inspeção: os 15 destinos eram `<main id="...">` sem `tabindex`. Um `main` não é focável por padrão, então a navegação nativa por fragmento rola até ele, mas não move `document.activeElement`. A correção anterior (`ae4f6d3` e F1) só garantiu que o JavaScript não interceptasse o link. O validador verificava que o destino existia e era único, mas não que podia receber foco.

## 8. Correção

- `tabindex="-1"` adicionado **somente** aos 15 `main` que são destino de skip link: `index.html`, `dashboards/index.html`, `solucoes/openalex-enrichment.html`, `solucoes/wikidata-entity-graph.html`, `solucoes/worldbank-risk-pricing.html`, `produtos/index.html` e as 9 páginas `produtos/*.html`. IDs, hrefs, classes e conteúdo foram preservados. Nenhum JavaScript foi alterado: a navegação continua nativa, sem `preventDefault` nem `focus()` artificial, inclusive nos produtos sem JavaScript.
- `scripts/build_product_catalog.py`: `base_html` agora emite `<main id="conteudo" tabindex="-1">`. No `--check`, o fragmento literal `<main id="conteudo">` foi trocado por `has_focusable_main()`, que usa `html.parser`. Ele exige exatamente um `main#conteudo` com `tabindex="-1"` e aceita qualquer ordem ou estilo de aspas dos atributos, o que preserva a tolerância a refinamentos manuais.
- `scripts/validate_site_structure.py`: `check_skip_links()` agora exige que o destino único seja `<main>` com `tabindex="-1"`. O validador também verifica a saída em memória do gerador (`gerador:produtos/*.html`), não apenas as páginas versionadas.
- Mains sem skip link (`solucoes/index.html`, as 6 soluções genéricas e `sobre/nossa-equipe.html`) **não** foram alterados.
- `styles.css` tem `:focus-visible` global. Se o navegador tratar o foco no `main` como visível, aparece um contorno ao redor do conteúdo. A alteração de CSS ficou fora do escopo.

## 9. Regressões (`scripts/test_skip_links.py`)

- Variações aceitas: ordem dos atributos, aspas simples, sem aspas, `class` extra e espaços no valor.
- Rejeições: ausência de `tabindex` (o markup exato anterior), valores `0`, vazio, `1`, `-2`, `abc` e atributo sem valor, além de destino que não é `<main>`. Destino ausente, duplicado ou fora do fragmento e IDs dentro de `<script>` continuam cobertos.
- Inventário real: exatamente 15 skip links, todos com destino focável. Remover o `tabindex` de qualquer um dos 15 (`test_previous_site_markup_is_rejected`) gera exatamente um erro "nao recebe foco".
- Mains em páginas sem skip link não podem ter `tabindex` (`test_mains_without_skip_link_are_left_unchanged`).
- Gerador: as 10 saídas contêm `main#conteudo` focável. O `--check` real roda sobre uma **cópia temporária** de `produtos/` e: aceita as páginas versionadas; aceita a reordenação manual dos atributos; aceita a saída recém-gerada; rejeita `produtos/index.html` e `produtos/ai-docs.html` sem `tabindex`.
- Comportamental (Node): `script.js` mantém `tabindex="-1"` em `main#main-content`/`#conteudo` depois de inicializar e não intercepta o skip link. Os testes de fallback, IDs preservados, navegação nativa do dashboard e atalhos foram mantidos.

## 10. Comandos e resultados desta etapa

Pelas regras do ambiente, o agente **não executou** código do checkout. As execuções ficam com o host, sem credenciais. Nada abaixo deve ser considerado aprovado até que o host registre o resultado:

| Comando / verificação | Status |
|---|---|
| Baseline em `3e0cf5c`/`a4b5679` (validadores e reprodução Chromium) | não executado pelo agente; só existe a evidência do operador |
| `python3 scripts/validate_site_structure.py` | não executado pelo agente (esperado: OK; no markup anterior, 15 erros "nao recebe foco" e mais 10 do gerador) |
| `python3 scripts/quality_smoke.py`, `security_smoke.py`, `budget_check.py` | não executado pelo agente |
| `python3 -m unittest discover -s scripts -p 'test_*.py'` (com Node) | não executado pelo agente |
| `python3 scripts/verify_public_catalog.py --local`, `python3 scripts/build_product_catalog.py --check` | não executado pelo agente |
| Regeneração em cópia temporária / rejeição de amostra sem `tabindex` | coberta por testes; não executada pelo agente |
| Lighthouse local (`@lhci/cli@0.15.1`, sem upload), `collect_perf_baseline.py` | não executado pelo agente |
| `python3 scripts/build_cloudflare_pages.py` + limites de `dist` | não executado pelo agente |
| Teclado real em Chromium/Firefox (desktop, 360x800, 390x844, movimento reduzido) | **não executado**: não há navegador disponível. AC3 continua pendente. Roteiro em `docs/QA_ACCEPTANCE.md` §3.1 |
| `git diff --check`, `git status --short`, `git rev-parse HEAD` | não executado pelo agente |

Limitação pré-existente, sem relação com esta correção: os atalhos comuns do dashboard continuam com `behavior:'smooth'` fixo (ver seção 2).

## 11. Validação do host — HEAD `c6ecac1`

O host repetiu os checks sobre o branch final após integrar a correção do `ai-team`:

| Verificação | Resultado |
|---|---|
| `node --check script.js` e `node --check dashboards/script.js` | passou |
| `python3 -m unittest discover -s scripts -p 'test_*.py'` | 39 testes passaram |
| `validate_site_structure.py`, `quality_smoke.py` (23 HTML), `security_smoke.py` | passaram |
| `budget_check.py`, `verify_public_catalog.py --local`, `build_product_catalog.py --check` | passaram; 9 produtos |
| `build_cloudflare_pages.py` e inspeção do diretório `dist` | passou; sem `data`, `.github` ou `serverless` na raiz |
| `git diff --check` | passou |

### Teclado real em Chromium

Executado com Chrome headless `google-chrome` via CDP contra o site servido localmente no próprio HEAD. Para cada página abaixo, o fluxo usou Tab → Enter → Tab em viewports 1280×900, 360×800 e 390×844, com `prefers-reduced-motion: reduce`:

| Página | Após Enter | Próximo Tab |
|---|---|---|
| Home (`/`) | `document.activeElement` é `main#conteudo` | link “Discutir um projeto”, dentro do `main` |
| Dashboard (`/dashboards/`) | `document.activeElement` é `main#main-content` | botão `#view-executive`, dentro do `main` |

Em ambos os destinos, `:focus-visible` correspondeu e o `outline` computado foi `3px solid`; a navegação preservou o fragmento. A comparação com o estado anterior reproduziu o problema da home: após Enter, o foco permanecia no skip link e o próximo Tab retornava ao logo. A validação de todos os outros 13 destinos foi estrutural, pelo validador e pelos testes; o roteiro de navegador foi exercitado na home e no dashboard.

Firefox não foi testado. Lighthouse local e coleta de baseline de performance também não foram executados; não são evidência de aceitação desta correção de foco.
