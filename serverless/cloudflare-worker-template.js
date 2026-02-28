/**
 * Template opcional para endpoint de mini-relatorio.
 * Nao e usado pelo GitHub Pages; apenas referencia de implementacao segura.
 */

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Rate limit simples por IP (exemplo com KV/R2 pode ser acoplado aqui).
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    if (!ip) {
      return new Response("Forbidden", { status: 403 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return Response.json({ error: "invalid_json" }, { status: 400 });
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

    return Response.json({ report }, { status: 200 });
  },
};
