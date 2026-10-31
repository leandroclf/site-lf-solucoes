# Objective

Corrigir o foco dos skip links nas 15 páginas afetadas e no gerador do catálogo, preservando a navegação nativa; exigir destinos focáveis nas regressões e comprovar o comportamento com teclado em navegador real.

## Original request

Corrija a navegação por teclado dos skip links: evidência Chromium atual mostra que na home Enter muda hash para #conteudo mas mantém foco no link, e o próximo Tab volta ao logo do cabeçalho. Faça o destino main do link realmente receber foco (por exemplo tabindex=-1) em todas as páginas afetadas, incluindo os templates/geradores que produzem esses mains; preserve a navegação nativa e evite alterar mains sem skip link sem necessidade. Atualize o teste estrutural/regressão para exigir destinos focáveis e faça teste de navegador real via instrução/documentação de validação. Execute os checks próprios do site. Não publicar, não fazer push, não abrir PR e não fazer deploy.

## Out of scope

- Publicar, fazer push, abrir PR ou executar deploy.
- Ações R3.
- Adicionar skip links ou alterar mains de páginas que atualmente não possuem skip link.
- Refatorações, mudanças editoriais e correções sem relação com o defeito, incluindo o movimento suave preexistente dos atalhos comuns do dashboard.

## Acceptance

- AC1: A inicialização continua preservando IDs existentes, incluindo conteudo e main-content. O fallback só atribui conteudo ao main sem ID quando esse identificador não existe, sem duplicação nem erro quando não há main.
- AC2: Cada um dos 15 skip links conserva seu href e resolve para exatamente um main com tabindex="-1", antes e depois da inicialização. A navegação por fragmento permanece nativa, sem novo preventDefault ou gerenciamento artificial de foco, inclusive nos produtos sem JavaScript.
- AC3: Em navegador real, Tab revela o skip link com foco visível; Enter atualiza o fragmento e torna o main document.activeElement; o próximo Tab alcança o primeiro controle navegável dentro do main, sem retornar ao cabeçalho. Há evidência registrada para desktop, larguras móveis e movimento reduzido.
- AC4: Âncoras comuns, menus e atalhos do dashboard mantêm seus destinos e comportamento. Os caminhos afetados respeitam movimento reduzido, e limitações preexistentes sem relação com a correção são registradas separadamente.
- AC5: As regressões e os checks locais de estrutura, SEO/A11y, catálogo, segurança, budgets e build são executados e seus resultados registrados. O artefato contém index.html e produtos/index.html, preserva os destinos focáveis e exclui data, .github e serverless na raiz de dist. Falhas preexistentes são diferenciadas de regressões.
- AC6: A correção corresponde ao defeito documentado, com evidência antes/depois e testes que rejeitam destinos não focáveis. O diff permanece restrito às páginas afetadas, gerador, validações e documentação; mains sem skip link permanecem inalterados.
- AC7: A documentação fornece instruções reproduzíveis e resultados reais, informa verificações não executadas e registra SHA completo testado e estado do checkout. Nenhuma publicação, push, PR ou deploy ocorre.
- AC8: O gerador produz main#conteudo com tabindex="-1" no índice e nos nove detalhes de produtos. Seu --check aceita o markup corrigido e rejeita a perda da capacidade de foco, preservando a tolerância existente a refinamentos manuais. As regressões cobrem páginas versionadas e saída gerada.
