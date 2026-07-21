/**
 * Site decommissioned. This is a static HTML site (no Node/Express
 * server), but it deploys through Vercel Edge Middleware, which runs on
 * every request before any static file is served and can return an
 * arbitrary HTTP status — so it stands in for a server-side catch-all
 * route here.
 *
 * Unless PUBLIC_SITE=true is set on Vercel, every path except
 * /robots.txt returns HTTP 410 Gone with a minimal plain-text body.
 * No redirect, no HTML page, nothing cacheable for a crawler or
 * visitor to land on.
 *
 * To restore the site: set PUBLIC_SITE=true in the Vercel project's
 * environment variables and redeploy.
 */
export default function middleware(request) {
  if (process.env.PUBLIC_SITE === 'true') {
    return;
  }

  const url = new URL(request.url);

  if (url.pathname === '/robots.txt') {
    return;
  }

  return new Response('This site is no longer available.', {
    status: 410,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
