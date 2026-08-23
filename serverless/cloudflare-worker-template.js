/**
 * Template opcional para endpoint de mini-relatorio.
 * Nao e usado pelo GitHub Pages; apenas referencia de implementacao segura.
 */

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    if (env.REPORT_API_TOKEN && request.headers.get("Authorization") !== `Bearer ${env.REPORT_API_TOKEN}`) {
      return json({ error: "unauthorized" }, 401);
    }
    const origin = request.headers.get("Origin");
    if (env.ALLOWED_ORIGIN && origin !== env.ALLOWED_ORIGIN) {
      return json({ error: "forbidden_origin" }, 403);
    }

    // Rate limit simples por IP (substituir por Durable Objects/KV em produção).
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    if (!ip) {
      return new Response("Forbidden", { status: 403 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return json({ error: "invalid_payload" }, 400);
    }

    // Sanitizacao minima para evitar prompt injection trivial.
    const safe = {
      setor: String(payload.setor || "").slice(0, 40),
      objetivo: String(payload.objetivo || "").slice(0, 60),
      canal: String(payload.canal || "").slice(0, 40),
      maturidade: String(payload.maturidade || "").slice(0, 20),
      dados: String(payload.dados || "").slice(0, 20),
      recommendations: Array.isArray(payload.recommendations)
        ? payload.recommendations.slice(0, 5).map((item) => String(item).slice(0, 180))
        : [],
    };

    // Substituir esta parte pelo provider de IA desejado.
    const report =
      `Resumo executivo: foco em ${safe.objetivo || "eficiencia operacional"}, ` +
      `canal principal ${safe.canal || "nao informado"}, ` +
      `com prioridade para padronizacao e monitoramento de indicadores de conversao e custo.`;

    return json({ report }, 200);
  },
};

function json(payload, status) {
  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
    status,
  });
}
