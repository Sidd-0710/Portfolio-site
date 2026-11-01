/**
 * HTTP security headers for every response (applied in next.config.ts).
 *
 * The Content-Security-Policy only allows this site's own origin: scripts,
 * styles, fonts (self-hosted by next/font), images and fetches (/api/ask is
 * same-origin; the Groq call happens on the server). It allows inline
 * scripts and styles because Next's bootstrap scripts and next-themes'
 * no-flash script are inline; a nonce-based policy would remove that, but
 * nonces force every page to render per request and give up static
 * prerendering. It's sent in production only: development needs eval for
 * React Fast Refresh.
 */
export function securityHeaders({ production }: { production: boolean }): { key: string; value: string }[] {
  const headers = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  ]
  if (!production) return headers

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')
  return [...headers, { key: 'Content-Security-Policy', value: csp }]
}
