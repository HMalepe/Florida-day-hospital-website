/**
 * Allow the full site on the production domain and *.vercel.app.
 * Any other host is redirected to the coming-soon gate.
 * Set PUBLIC_SITE=true on Vercel to disable the gate entirely.
 */
export default function middleware(request) {
  if (process.env.PUBLIC_SITE === 'true') {
    return;
  }

  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0];

  const isAllowedHost =
    host.endsWith('.vercel.app') ||
    host === 'floridadayhospital.co.za' ||
    host === 'www.floridadayhospital.co.za';

  if (isAllowedHost) {
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
  // Keep SEO files + icons out of middleware so Googlebot fetch stays clean
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|favicon-.*\\.png|apple-touch-icon\\.png|robots\\.txt|sitemap\\.xml|site\\.webmanifest).*)',
  ],
};
