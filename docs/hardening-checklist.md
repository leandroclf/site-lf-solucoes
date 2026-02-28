# Hardening Checklist de Release

## Performance

- [ ] `python3 scripts/collect_perf_baseline.py` atualizado
- [ ] JS total sem crescimento fora do budget
- [ ] CSS total sem crescimento fora do budget
- [ ] Lighthouse CI aprovado
- [ ] Dashboard com meta final aplicada (Performance >= 90 e A11y >= 95)

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

## Comandos de validacao final

```bash
python3 scripts/validate_site_structure.py
python3 scripts/quality_smoke.py
python3 scripts/budget_check.py
python3 scripts/collect_perf_baseline.py
node --check script.js dashboards/script.js scripts/*.js
```
