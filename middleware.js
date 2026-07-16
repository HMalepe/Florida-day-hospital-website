/**
 * Site-wide offline gate. Every host — production domain, www, and any
 * *.vercel.app preview — is redirected to the neutral "not available"
 * page (coming-soon.html) unless PUBLIC_SITE=true is set on Vercel.
 *
 * To bring the site back: set the PUBLIC_SITE environment variable to
 * "true" in the Vercel project settings (Settings -> Environment
 * Variables), then redeploy (or trigger a redeploy from the dashboard).
 */
export default function middleware(request) {
  if (process.env.PUBLIC_SITE === 'true') {
    return;
  }

  const url = new URL(request.url);
  const path = url.pathname;

  if (
    path === '/coming-soon.html' ||
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
