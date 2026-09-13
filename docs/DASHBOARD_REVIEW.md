# Revisão da camada de Dashboard — LF Soluções

## Objetivo

Manter o dashboard operacional coerente com a identidade AI Premium da LF Soluções sem alterar sua lógica funcional, contratos de dados, IDs usados pelo JavaScript ou comportamento de atualização.

## Achados principais

1. O dashboard mantinha uma identidade visual independente e anterior à revisão institucional.
2. A navegação ainda exibia a logo JPG legada dentro de uma caixa branca, enquanto a marca oficial passou a usar o símbolo/lockup vetorial AI Premium.
3. Os tokens de cor ainda usavam azul `#35AEF1` como cor principal, divergindo da paleta institucional `#4F46E5 → #8B5CF6 → #00D4FF`.
4. Cards, botões, atalhos e funil tinham aparência mais genérica e menos editorial do que a nova home.
5. A densidade de informação é alta por natureza; por isso a revisão prioriza hierarquia, contraste e previsibilidade, evitando aumentar efeitos decorativos.

## Mudanças aplicadas

- preservação do CSS legado em `dashboards/styles-base.css`;
- `dashboards/styles.css` passa a ser uma camada de identidade e refinamento sobre a base funcional existente;
- logo do header substituída visualmente pelo lockup oficial `assets/lf-logo-horizontal.svg`, sem alterar a estrutura HTML nem o JavaScript;
- atualização de tokens de cor para a paleta AI Premium;
- cards, atalhos, filtros, CTAs, badges, funil e kanban ajustados para a linguagem enterprise da marca;
- redução de sombras e efeitos decorativos;
- manutenção dos estados verde/amarelo/vermelho como cores semânticas operacionais;
- preservação de todos os IDs e seletores funcionais usados pelo dashboard.

## Princípios específicos do Dashboard

1. **Operação acima de decoração.** Cores de marca não devem competir com estados críticos, SLA ou alertas.
2. **Semântica preservada.** Verde, amarelo e vermelho continuam reservados para saúde e risco.
3. **Marca consistente.** Header, logo, tipografia, superfícies e botões devem parecer parte da mesma empresa que a home.
4. **Alta densidade com leitura rápida.** O dashboard deve favorecer comparação e ação, não cards excessivamente chamativos.
5. **Compatibilidade funcional.** Alterações visuais não podem quebrar os seletores e contratos de dados existentes.

## Publicação e logo

Em 13/09/2026, a `main` continha a correção AI Premium e o workflow de GitHub Pages concluiu com sucesso para o commit `10f5430f7cf8629d35c90864f4fe827dd076361c`.

Entretanto, uma verificação externa do domínio `lfsolucoes.etc.br` ainda retornava o HTML antigo da home. Isso indica divergência entre o artefato publicado pelo workflow e o conteúdo efetivamente servido/observado no domínio (cache, propagação ou configuração do custom domain), e não ausência do código novo na `main`.

A cada revisão de marca, validar separadamente:

- conteúdo da `main`;
- resultado do workflow `Deploy static site to GitHub Pages`;
- conteúdo efetivamente servido no domínio customizado;
- assets SVG diretamente no navegador;
- cache local/CDN quando houver diferença entre os itens acima.
