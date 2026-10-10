// Helper function to create a response with CORS headers
const createCorsResponse = (body, options = {}) => {
    const responseOptions = {
        ...options,
        headers: {
            ...options.headers,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
        },
    };
    return new Response(body, responseOptions);
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- CORS Preflight for any route ---
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    // --- Service Binding: Forward /api/* directly to lightanime-api ---
    if (url.pathname.startsWith('/api/') || url.pathname === '/api') {
      const apiPath = url.pathname.replace(/^\/api/, '') || '/';
      const targetUrl = new URL(apiPath + url.search, 'https://internal-api');

      const headers = new Headers(request.headers);
      headers.set('x-service-binding', 'aenime-internal');

      const apiRequest = new Request(targetUrl, {
        method: request.method,
        headers,
        body: request.body,
        redirect: 'manual',
      });

      try {
        const response = env.API
          ? await env.API.fetch(apiRequest)
          : await fetch(new URL(apiPath + url.search, 'https://lightanime-api.webbase.workers.dev'), apiRequest);

        const newHeaders = new Headers(response.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        newHeaders.set('Access-Control-Allow-Headers', '*');

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: `API Gateway error: ${err.message}` }), {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // Try to serve the requested asset
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) {
      return new Response(assetResponse.body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers: {
          ...Object.fromEntries(assetResponse.headers.entries()),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    // For SPA routing, serve index.html for any non-asset requests
    const indexResponse = await env.ASSETS.fetch(new URL('/index.html', request.url));
    return new Response(indexResponse.body, {
      status: indexResponse.status,
      statusText: indexResponse.statusText,
      headers: {
        ...Object.fromEntries(indexResponse.headers.entries()),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  },
};
