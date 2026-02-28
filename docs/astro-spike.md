# Astro Spike (Sem Cutover)

Objetivo: avaliar migracao para Astro sem alterar o deploy atual em GitHub Pages
ate que os ganhos sejam comprovados.

## Escopo do spike

- Nao substituir `index.html` atual.
- Nao alterar workflow de deploy existente.
- Nao alterar URLs publicas.
- Validar apenas viabilidade tecnica e plano de migracao incremental.

## Hipoteses

1. Astro pode reduzir manutencao de componentes sem aumentar bundle JS.
2. Conteudo estatico continua compativel com GitHub Pages.
3. Modulos interativos podem ser isolados em ilhas com hidratacao sob demanda.

## Riscos

- Regressao de SEO por metadata inconsistente na migracao.
- Regressao de navegacao (ancoras e links relativos).
- Regressao de performance por hidratacao excessiva em paginas estaticas.

## Mitigacao

- Migrar por pagina (home -> sobre -> solucoes -> dashboard) em branch dedicada.
- Validar Lighthouse CI e links locais a cada etapa.
- Manter fallback com os arquivos HTML atuais ate o cutover final.

## Criterio de Go/No-Go

Go somente se:

- Lighthouse igual ou melhor no CI.
- Bundle JS nao aumentar de forma relevante no baseline.
- Deploy em Pages continuar estavel sem ajustes manuais.

No-Go se:

- houver regressao de SEO/performance sem ganho funcional claro.
