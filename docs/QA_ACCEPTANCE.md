# QA Acceptance - LF Solucoes Website

Checklist objetivo para validar consistencia de navegacao, UX/UI e conteudo apos mudancas.

## 1) Validacao automatica minima

Rodar no repo:

```bash
python3 scripts/validate_site_structure.py
```

Esperado:

- `OK: estrutura validada (menus, links e secao Sobre)`
- `scripts/diagnostic.js` <= 12 KB
- `scripts/roi-simulator.js` <= 6 KB

Comando:

```bash
wc -c scripts/diagnostic.js scripts/roi-simulator.js
```

## 2) Smoke visual desktop

Subir servidor local:

```bash
python3 -m http.server 8080
```

Validar em:

- `http://localhost:8080/`
- `http://localhost:8080/dashboards/`
- `http://localhost:8080/sobre/nossa-equipe.html`
- `http://localhost:8080/solucoes/automacao-processos.html`
- `http://localhost:8080/solucoes/business-intelligence.html`
- `http://localhost:8080/solucoes/ia-aplicada-servicos.html`
- `http://localhost:8080/solucoes/whatsapp-automation.html`

Checagens:

- Menu principal igual em todas as paginas.
- Link `Dashboards` abre na mesma aba.
- Secao `#servicos` na home com 3 botoes `Saiba mais` ativos.
- Dashboard sem botao `Voltar ao site`.
- Atalhos do dashboard navegam para as secoes corretas.
- Secao `Sobre` na home contem bloco de equipe operacional.

## 3) Smoke visual mobile

No DevTools (360x800 e 390x844):

- Menu hamburguer abre/fecha corretamente.
- Ao clicar em item do menu, o menu fecha.
- Cards nao estouram horizontalmente.
- Atalhos do dashboard continuam navegaveis por scroll horizontal.

## 3.1) Teclado: links de acesso rapido (skip links)

Contrato: todo `.skip-link` aponta para um `#id` que resolve para exatamente um `<main ... tabindex="-1">`.
Sem `tabindex="-1"` o Enter muda o hash, mas o foco fica no link e o proximo Tab volta ao cabecalho.
`python3 scripts/validate_site_structure.py` e `python3 -m unittest discover -s scripts -p 'test_*.py'` rejeitam destinos nao focaveis;
`python3 scripts/build_product_catalog.py --check` rejeita paginas de produto sem `main#conteudo` focavel.

Paginas com skip link (15): `/`, `/dashboards/`, `/solucoes/openalex-enrichment.html`,
`/solucoes/wikidata-entity-graph.html`, `/solucoes/worldbank-risk-pricing.html`, `/produtos/` e as 9 paginas
`/produtos/*.html`.

Roteiro em navegador real (Chromium e Firefox; desktop, 360x800, 390x844 e com `prefers-reduced-motion: reduce`
emulado no DevTools ou no sistema). Servir com `python3 -m http.server 8080 --bind 127.0.0.1` e, em cada pagina:

1. Abrir a URL **sem fragmento**, clicar fora de qualquer controle (ou recarregar) e nao usar `focus()` no console.
2. `Tab`: o skip link aparece com foco visivel (`document.activeElement` e o `.skip-link`).
3. `Enter`: o hash vira `#conteudo` ou `#main-content`, a pagina rola ate o `main` e
   `document.activeElement` e o proprio `<main>` (conferir no console: `document.activeElement.tagName === 'MAIN'`).
4. `Tab` de novo: o foco vai para o primeiro controle focavel **dentro** do `main`
   (`document.querySelector('main').contains(document.activeElement) === true`), e nao para o logo/menu do cabecalho.
5. Com movimento reduzido, o salto e imediato (sem rolagem suave) no skip link.
6. Regressoes vizinhas: ancoras comuns (`#servicos`, `#contato`), menu hamburguer em mobile e atalhos do dashboard
   continuam levando as secoes corretas. Nos produtos (sem JavaScript) o comportamento deve ser identico.

Para automacao, usar eventos de teclado reais (por exemplo `page.keyboard.press('Tab')` / `press('Enter')` no
Playwright) e apenas ler `document.activeElement`/`location.hash`; nunca chamar `focus()` para preparar ou provar o resultado.
Registrar navegador e versao, viewport, hash, elemento ativo apos cada tecla e resultado.

Observacao: `styles.css` aplica `:focus-visible` global; se o navegador considerar o foco no `main` como
foco visivel, aparece um contorno ao redor do conteudo. Isso e esperado e nao foi alterado.

## 4) Conteudo e linguagem

- Nomes de cargos e responsabilidades em portugues.
- Sem slugs tecnicos em ingles na apresentacao institucional.
- Contato e CTA visiveis no topo e no fim das paginas.

## 5) Gate para publicar

Publicar somente se:

- Validacao automatica passou.
- Smoke desktop/mobile passou.
- Nao ha regressao de navegacao entre home, dashboard, sobre e solucoes.
