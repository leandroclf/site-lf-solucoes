# Objective

Revisar a correção commitada da issue #125, comprovar localmente a preservação dos destinos, a navegação por teclado e a qualidade estrutural das páginas, corrigir somente findings concretos e registrar relatório e SHA final.

## Original request

Revise a correção commitada da issue #125 para os links de acesso rápido. Confirme por inspeção e testes locais que os destinos são preservados, que o foco por teclado funciona e que as páginas estáticas mantêm a qualidade estrutural. Corrija somente findings concretos; registre relatório e SHA final. Não publique, não faça push, não crie PR e não faça deploy.

## Out of scope

- Publicação, push, criação de PR e deploy.
- Refatorações amplas, mudanças de conteúdo ou correções sem relação comprovada com o objetivo.
- Ações R3.

## Acceptance

- AC1: A inicialização preserva IDs existentes, especialmente #main-content e #conteudo. O fallback atribui conteudo somente ao main sem ID quando esse identificador não existe, sem criar duplicação ou erro quando não há main.
- AC2: Cada skip link existente mantém seu href e resolve para exatamente um destino correto antes e depois da inicialização. A ativação preserva a navegação por fragmento, inclusive nas páginas de produtos sem JavaScript.
- AC3: Em navegador real, Tab revela o skip link com foco visível e Enter permite continuar pelo conteúdo principal; o Tab seguinte não recomeça pelo cabeçalho. A evidência verifica foco e sequência de navegação, além de rolagem e hash, em desktop e mobile.
- AC4: As alterações não causam regressões nos destinos ou funcionamento das âncoras comuns, menus e atalhos do dashboard. Movimento reduzido é verificado nos caminhos afetados.
- AC5: As validações locais confirmam a integridade estrutural e os requisitos existentes de SEO/A11y, links locais, catálogo, segurança e budgets. O build estático mantém os arquivos públicos esperados e exclui data, .github e serverless na raiz de dist. Falhas preexistentes são identificadas separadamente.
- AC6: Toda alteração funcional corresponde a um finding documentado e possui evidência reproduzível antes/depois. As regressões detectam o comportamento defeituoso; não há refatoração ou correção especulativa.
- AC7: O relatório registra resultados reais, testes não executados e limitações, quando houver. A entrega informa o SHA completo final e o estado do checkout. Não ocorre publicação, push, PR ou deploy.
