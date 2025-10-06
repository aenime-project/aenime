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
