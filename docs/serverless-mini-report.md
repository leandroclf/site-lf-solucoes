# Mini-relatorio IA (Opcional) com Guardrails

Este repositorio permanece estatico em GitHub Pages.
Se a geracao de mini-relatorio por IA for habilitada, deve usar endpoint externo
com fallback local ja implementado no front.

## Requisitos obrigatorios

- Nao bloquear render da pagina.
- Nao enviar PII no payload.
- Rate limit basico por IP.
- Timeout curto no cliente (ate 8s).
- Fallback local quando endpoint falhar.

## Contrato esperado do endpoint

### Request (JSON)

```json
{
  "setor": "servicos",
  "objetivo": "acelerar-vendas",
  "canal": "whatsapp",
  "maturidade": "media",
  "dados": "media",
  "recommendations": ["..."]
}
```

### Response (JSON)

```json
{
  "report": "Texto executivo curto, sem promessas."
}
```

## Configuracao no cliente

Definir endpoint global em script inline opcional:

```html
<script>
  window.LFReportEndpoint = "https://SEU_ENDPOINT/report";
</script>
```

Sem essa variavel, o site usa somente o fallback local.

## Observabilidade minima

- Logar apenas status da chamada (ok/falha/timeout).
- Nao persistir payload completo com dados do usuario.
- Revisar custo mensal por volume de requests.
