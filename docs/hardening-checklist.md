# Hardening Checklist de Release

## Performance

- [ ] `python3 scripts/collect_perf_baseline.py` atualizado
- [ ] JS total sem crescimento fora do budget
- [ ] CSS total sem crescimento fora do budget
- [ ] Lighthouse CI aprovado

## Acessibilidade

- [ ] Contraste minimo validado nos componentes novos
- [ ] Focus visivel em botoes, links e inputs
- [ ] Labels associados aos formularios
- [ ] `prefers-reduced-motion` respeitado

## SEO

- [ ] Titles e descriptions consistentes por pagina
- [ ] Headings sem quebra de hierarquia principal
- [ ] `robots.txt` e `sitemap.xml` atualizados
- [ ] URLs canonicas preservadas

## Operacao

- [ ] Deploy de Pages executado sem erro
- [ ] Validacao estrutural (`validate_site_structure.py`) em OK
- [ ] Rollback simples: reverter ultimo commit em `main` se necessario
