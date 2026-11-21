# Proposta de página da LF Academy

O arquivo `lf-academy.html` é um rascunho editorial, não um lançamento. Para visualizá-lo sem publicar, sirva a raiz do checkout com `python3 -m http.server 8080 --bind 127.0.0.1` e abra `http://127.0.0.1:8080/docs/prototipos/lf-academy.html`.

A página usa os ativos e estilos existentes da LF Soluções. A implementação não copia aulas, imagens ou código do currículo externo, nem adiciona formulários, rastreamento ou execução de scripts. O guia original em português do Brasil é uma tradução assistida por IA; o projeto mantém o inglês como versão de referência.

O build de Cloudflare Pages não publica `docs/`. Antes de mover a página para uma área pública, validar o destino editorial e, caso entre no catálogo como produto, alinhar o registro canônico do Product Platform (`packages/kit/contracts/portfolio-products.json`) e o catálogo do site, validar a rota e rever a indexação. Não retirar `noindex` nem adicionar sitemap/menu nesta etapa.
