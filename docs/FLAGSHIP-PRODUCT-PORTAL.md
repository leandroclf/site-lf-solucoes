# Portal principal LF Soluções — catálogo de produtos

**O repositório `site-lf-solucoes` é o produto principal de presença e descoberta comercial da empresa.** O portal é a referência pública de todas as ofertas e iniciativas de produto. As aplicações continuam independentes; o portal apresenta a proposta de valor, funcionalidades e acesso comercial sem incorporar código de execução, secrets ou banco de cada produto.

## Fonte do conteúdo

`data/product-catalog.json` contém as informações editoriais aprovadas de todos os produtos registrados no portfólio técnico `leandroclf/product-platform/packages/kit/contracts/portfolio-products.json`. A presença no catálogo **não afirma que um produto esteja publicado em produção**. Somente links externos HTTPS verificados podem ser registrados em `product_url`; por padrão são omitidos.

Campos obrigatórios: `id`, `slug`, `title`, `category`, `summary`, `highlights`, `runtime`, `wave`, `visibility`, `detail_url`. Cada slug corresponde a um repositório de produto e produz `produtos/<slug>.html`; a home de produtos é `produtos/index.html`.

## Novo produto: procedimento obrigatório

1. Criar e registrar o produto na plataforma no contrato `portfolio-products.json`; validar a política G0–G6.
2. Preparar descrição pública revisada, categoria, público e funcionalidades reais, **sem inventar disponibilidade comercial**, preços, avaliações ou links.
3. Criar PR no `site-lf-solucoes` atualizando `data/product-catalog.json`.
4. Executar `python3 scripts/build_product_catalog.py` para gerar páginas HTML acessíveis com a identidade visual existente.
5. Rodar `python3 scripts/validate_site_structure.py`, `python3 scripts/quality_smoke.py`, `python3 scripts/security_smoke.py` e `python3 scripts/budget_check.py`.
6. CI verde + revisão humana do conteúdo. Só então merge, que aciona o deploy GitHub Pages existente do **portal**. O deploy de cada produto continua independente.
7. Quando o produto possuir endereço público verificado, atualizar `product_url` em um PR editorial; nunca publicar endpoint de API privado, senha ou URL interna.

Não copiar toda a lógica ou interface da aplicação para dentro da empresa: o portal hospeda **páginas de apresentação, conteúdo, acesso e descoberta**, não exige microfrontends ou deploy compartilhado.

## Operação

```bash
python3 scripts/build_product_catalog.py
python3 scripts/build_product_catalog.py --check
python3 scripts/validate_site_structure.py
python3 scripts/quality_smoke.py
```

O gerador usa apenas Python padrão, lê o JSON local, escapa HTML para evitar XSS e escreve HTML estático com canonical/descrições SEO. O CI existente verifica se todos os produtos do catálogo têm páginas, links locais e conteúdo atualizado. A sincronização entre repositórios ainda é um **gate de processo com revisão**, não um webhook cross-repo implantado; é necessário adicionar automação confiável de abertura de PRs via GitHub App antes de chamar a publicação de totalmente automática.

## Verificação cruzada do registro da plataforma

O arquivo `data/platform-portfolio.snapshot.json` é uma **fotografia revisada** do contrato canônico `leandroclf/product-platform/packages/kit/contracts/portfolio-products.json`. A validação `scripts/validate_portal_registry_sync.py` compara IDs, runtimes, waves, rotas e conteúdo obrigatório 1:1 com `data/product-catalog.json`; está vinculada ao gate estrutural do CI do portal.

Em qualquer inclusão/remoção ou mudança de identidade de produto:

1. Consulte o contrato da plataforma na `main` e atualize o snapshot no mesmo PR editorial do catálogo.
2. Atualize o catálogo, rode `python3 scripts/build_product_catalog.py` e `python3 scripts/validate_site_structure.py`.
3. Exija revisão do conteúdo e CI verde antes do merge do portal.
4. Registre o link do PR de catálogo no handoff G0–G6.

**Limitação explícita:** a fotografia local não autentica a versão mais recente do repositório remoto; uma mudança ocorrida apenas na plataforma não é detectada até a atualização do snapshot. Não interpretar o status `PORTAL_SNAPSHOT_CONSISTENT` como sincronização automática. O mecanismo GitHub App que abre PRs cross-repo ao detectar mudanças permanece pendente na issue https://github.com/leandroclf/product-platform/issues/60.

## Evolução planejada

- Catálogo completo com nove produtos de domínio inicialmente registrados e o site corporativo classificado na plataforma como produto principal.
- Próximo incremento: validação cruzada do registro de produtos da plataforma com o catálogo público, por artefato imutável ou PR disparado por evento do Product Harness.
- Conteúdo estruturado adicional por produto: público, benefícios verificáveis, imagens autorizadas, docs, tutoriais, casos de uso, demos e status operacional comprovado.
- Busca e filtros quando necessários; analytics consentido e SEO do portal.
- O Design System corporativo deve ser extraído dos assets já versionados neste repositório (ex.: `assets/lf-logo-horizontal.svg`, `styles.css`, `brand-system.css`) e distribuído sem alterar identidades funcionais.
