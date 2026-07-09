/**
 * Gate the production custom domain while allowing full-site preview on *.vercel.app.
 * Controlled by the PUBLIC_SITE environment variable on Vercel.
 */
export default function middleware(request) {
  if (process.env.PUBLIC_SITE === 'true') {
    return;
  }

  const host = (request.headers.get('host') || '').toLowerCase();

  if (host.endsWith('.vercel.app')) {
    return;
  }

  const isProductionDomain =
    host === 'floridadayhospital.co.za' || host === 'www.floridadayhospital.co.za';

  if (!isProductionDomain) {
    return;
  }

  const url = new URL(request.url);
  const path = url.pathname;

  if (
    path === '/coming-soon.html' ||
    path.startsWith('/css/') ||
    path === '/favicon.svg' ||
    path === '/robots.txt'
  ) {
    return;
  }

  const gateUrl = new URL(request.url);
  gateUrl.pathname = '/coming-soon.html';
  if (!gateUrl.search.includes('fdh_nc=1')) {
    gateUrl.search = gateUrl.search
      ? gateUrl.search + '&fdh_nc=1&_=' + Date.now()
      : '?fdh_nc=1&_=' + Date.now();
  }

  return Response.redirect(gateUrl.toString(), 307);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
