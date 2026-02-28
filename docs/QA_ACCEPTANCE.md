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
- `http://localhost:8080/solucoes/whatsapp-automation.html`

Checagens:

- Menu principal igual em todas as paginas.
- Link `Dashboards` abre na mesma aba.
- Dashboard sem botao `Voltar ao site`.
- Atalhos do dashboard navegam para as secoes corretas.
- Secao `Sobre` na home contem bloco de equipe operacional.

## 3) Smoke visual mobile

No DevTools (360x800 e 390x844):

- Menu hamburguer abre/fecha corretamente.
- Ao clicar em item do menu, o menu fecha.
- Cards nao estouram horizontalmente.
- Atalhos do dashboard continuam navegaveis por scroll horizontal.

## 4) Conteudo e linguagem

- Nomes de cargos e responsabilidades em portugues.
- Sem slugs tecnicos em ingles na apresentacao institucional.
- Contato e CTA visiveis no topo e no fim das paginas.

## 5) Gate para publicar

Publicar somente se:

- Validacao automatica passou.
- Smoke desktop/mobile passou.
- Nao ha regressao de navegacao entre home, dashboard, sobre e solucoes.
