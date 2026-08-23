const buckets = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};

async function handleRequest(request, env = {}) {
  if (request.method === 'POST' && request.url.endsWith('/api/proposal-value')) {
    const configuredToken = env.PROPOSAL_API_TOKEN;
    if (!configuredToken || request.headers.get('Authorization') !== `Bearer ${configuredToken}`) {
      return json({ error: 'Unauthorized' }, 401);
    }
    const allowedOrigin = env.ALLOWED_ORIGIN;
    const origin = request.headers.get('Origin');
    if (allowedOrigin && origin !== allowedOrigin) {
      return json({ error: 'Forbidden origin' }, 403);
    }
    const client = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    const bucket = buckets.get(client);
    if (!bucket || now - bucket.startedAt >= WINDOW_MS) buckets.set(client, { startedAt: now, count: 1 });
    else if (bucket.count >= MAX_REQUESTS) return json({ error: 'Rate limit exceeded' }, 429);
    else bucket.count += 1;
    try {
      const payload = await request.json();
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return json({ error: 'Invalid payload' }, 400);
      }
      const clientSegment = payload.clientSegment === 'enterprise' ? 'enterprise' : 'standard';
      const dealSize = payload.dealSize === undefined ? 1 : Number(payload.dealSize);
      if (!Number.isFinite(dealSize) || dealSize < 0 || dealSize > 100000) {
        return json({ error: 'Invalid deal size' }, 422);
      }
      const proposalId = payload.proposalId === undefined ? 'unknown' : String(payload.proposalId).slice(0, 128);
      let baseValue = 1000;
      if (clientSegment === 'enterprise') {
        baseValue = 5000;
      }
      const proposalValue = {
        value: baseValue * dealSize,
        currency: "BRL",
        proposalId,
        calculatedOn: new Date().toISOString()
      };

      return json(proposalValue, 200);
    } catch {
      return json({ error: 'Invalid JSON payload' }, 400);
    }
  }

  return new Response('Not Found', { status: 404 });
}

function json(payload, status) {
  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
    status,
  });
}
