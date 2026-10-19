# Publicação no Cloudflare Pages (GitHub privado)

## Modelo escolhido
- Repositório de origem: `leandroclf/site-lf-solucoes`, **privado**.
- Plataforma: Cloudflare Pages conectado ao GitHub por integração nativa.
- Branch de produção: `main`.
- Comando de build: `python3 scripts/validate_site_structure.py && python3 scripts/verify_public_catalog.py --local && python3 scripts/build_cloudflare_pages.py`
- Diretório de saída: `dist`.
- Diretório raiz do repositório no painel: padrão (raiz).
- Framework preset: `None` / site estático.
- Não armazenar token Cloudflare no repositório: a integração Git gerencia a publicação.

## Ativação (ação manual obrigatória)
1. Entre no [Cloudflare Dashboard](https://dash.cloudflare.com/) > Workers & Pages > Create > Pages > Connect to Git.
2. Autorize a instalação GitHub da Cloudflare apenas para o repositório privado `site-lf-solucoes` (Selected repositories).
3. Configure os valores acima e faça o primeiro deploy. Verifique a URL `*.pages.dev` fornecida pela Cloudflare.
4. Confira `/`, `/produtos/` e pelo menos `/produtos/vehicle-tracking.html`, além das outras oito páginas.
5. Só depois associe `lfsolucoes.etc.br` em Pages > Custom domains. Faça a alteração DNS indicada pela Cloudflare. Não copie um alvo CNAME fictício, use o nome real do projeto Pages.
6. Aguarde validação do certificado TLS e acesse `https://lfsolucoes.etc.br/produtos/`.
7. Verifique deploy automático em um próximo merge aprovado.

## Segurança e limitações
- A Cloudflare publica somente `dist/`, cujo conteúdo é gerado com allowlist. Não usar o diretório raiz como output!
- `data/`, `serverless/`, `docs/`, `.github/`, `scripts/` e arquivos internos não devem aparecer em produção.
- Os links do catálogo apresentam os produtos, mas os campos `product_url` continuam nulos: **não afirmam que os aplicativos estão implantados ou disponíveis comercialmente**.
- Fluxos dinâmicos/serverless não são migrados automaticamente; são necessários serviços independentes.
- O antigo workflow GitHub Pages e o arquivo `CNAME` foram retirados desta branch para evitar publicação concorrente. Isso não altera nenhum registro DNS.
- Não atribuir ao ChatGPT Sites nem ao GitHub Pages a disponibilidade do novo endereço. Confirmar Cloudflare primeiro.
