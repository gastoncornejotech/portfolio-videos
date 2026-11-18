export const config = {
  runtime: 'edge'
};

export default async function handler(request) {
  const url = new URL(request.url);
  const file = url.searchParams.get('file') || '';

  if (!file || !/^[0-9a-zA-Z._-]+\.mp4$/.test(file)) {
    return new Response('Archivo no válido', { status: 400 });
  }

  const proto = 'ht' + 'tps://';
  const host = 'github.' + 'com';
  const targetUrl = proto + host + '/gastoncornejotech/portfolio-videos/releases/download/portfoliov1/' + encodeURIComponent(file);

  const fetchHeaders = new Headers();
  const range = request.headers.get('range');
  if (range) {
    fetchHeaders.set('Range', range);
  }
  fetchHeaders.set('User-Agent', 'Mozilla/5.0');

  const upstream = await fetch(targetUrl, {
    method: request.method === 'HEAD' ? 'HEAD' : 'GET',
    headers: fetchHeaders,
    redirect: 'follow'
  });

  if (!upstream.ok && upstream.status !== 206) {
    return new Response('Error al obtener el video: ' + upstream.status, { status: upstream.status });
  }

  const resHeaders = new Headers();
  resHeaders.set('Content-Type', 'video/mp4');
  resHeaders.set('Content-Disposition', 'inline');
  resHeaders.set('Accept-Ranges', 'bytes');
  resHeaders.set('Cache-Control', 'public, max-age=86400');

  const contentLength = upstream.headers.get('content-length');
  if (contentLength) {
    resHeaders.set('Content-Length', contentLength);
  }
  const contentRange = upstream.headers.get('content-range');
  if (contentRange) {
    resHeaders.set('Content-Range', contentRange);
  }

  return new Response(request.method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    headers: resHeaders
  });
}
