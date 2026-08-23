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

## Protecoes obrigatorias no endpoint

Quando o endpoint for privado, ele deve exigir `Authorization: Bearer
<REPORT_API_TOKEN>`. Para o fluxo publico do site, o token pode permanecer
ausente, mas o endpoint deve rejeitar origens diferentes de `ALLOWED_ORIGIN`
quando essa configuracao estiver definida.
O template aplica limite basico de 30 requisicoes por IP a cada minuto. Em
producao, substituir o contador em memoria por Durable Objects ou KV para
garantir o limite entre instancias.

## Observabilidade minima

- Logar apenas status da chamada (ok/falha/timeout).
- Nao persistir payload completo com dados do usuario.
- Revisar custo mensal por volume de requests.
