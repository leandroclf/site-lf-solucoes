addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === 'POST' && request.url.endsWith('/api/proposal-value')) {
    try {
      const payload = await request.json();
      // For now, return a dummy value.
      // In a real scenario, this would involve complex calculation based on payload.
      let baseValue = 1000;
      if (payload.clientSegment === 'enterprise') {
        baseValue = 5000;
      }
      const proposalValue = {
        value: payload.dealSize ? baseValue * payload.dealSize : baseValue, // Dynamic calculation
        currency: "BRL",
        proposalId: payload.proposalId || 'unknown',
        calculatedOn: new Date().toISOString()
      };

      return new Response(JSON.stringify(proposalValue), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }
  }

  return new Response('Not Found', { status: 404 });
}
