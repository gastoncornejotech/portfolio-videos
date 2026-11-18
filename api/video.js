export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range, Content-Type',
          'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    const url = new URL(request.url);
    const file = url.searchParams.get('file') || '';

    if (!file || !/^[0-9a-zA-Z._-]+\.mp4$/.test(file)) {
      return new Response('Archivo no válido', { status: 400 });
    }

    const proto = 'ht' + 'tps://';
    const host = 'github.' + 'com';
    let currentUrl = proto + host + '/gastoncornejotech/portfolio-videos/releases/download/portfoliov1/' + encodeURIComponent(file);

    const method = request.method === 'HEAD' ? 'HEAD' : 'GET';
    const range = request.headers.get('range');

    let upstream = null;
    for (let i = 0; i < 5; i++) {
      const fetchHeaders = new Headers();
      if (range) {
        fetchHeaders.set('Range', range);
      }
      fetchHeaders.set('User-Agent', 'Mozilla/5.0');

      upstream = await fetch(currentUrl, {
        method: method,
        headers: fetchHeaders,
        redirect: 'manual'
      });

      if (upstream.status >= 300 && upstream.status < 400) {
        const location = upstream.headers.get('location');
        if (!location) break;
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }
      break;
    }

    if (!upstream || (!upstream.ok && upstream.status !== 206)) {
      const status = upstream ? upstream.status : 502;
      return new Response('Error al obtener el video: ' + status, { status: status });
    }

    const resHeaders = new Headers();
    resHeaders.set('Content-Type', 'video/mp4');
    resHeaders.set('Content-Disposition', 'inline');
    resHeaders.set('Accept-Ranges', 'bytes');
    resHeaders.set('Access-Control-Allow-Origin', '*');
    resHeaders.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
    resHeaders.set('Cache-Control', 'public, max-age=86400');

    const contentLength = upstream.headers.get('content-length');
    if (contentLength) {
      resHeaders.set('Content-Length', contentLength);
    }
    const contentRange = upstream.headers.get('content-range');
    if (contentRange) {
      resHeaders.set('Content-Range', contentRange);
    }

    return new Response(method === 'HEAD' ? null : upstream.body, {
      status: upstream.status,
      headers: resHeaders
    });
  }
};
