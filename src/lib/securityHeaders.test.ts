// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { securityHeaders } from './securityHeaders'

const asMap = (production: boolean) => new Map(securityHeaders({ production }).map(h => [h.key, h.value]))

describe('security headers', () => {
  it('always send the basic hardening headers', () => {
    for (const production of [true, false]) {
      const headers = asMap(production)
      expect(headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(headers.get('X-Frame-Options')).toBe('DENY')
      expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
      expect(headers.get('Permissions-Policy')).toContain('camera=()')
    }
  })

  it('lock production down to this origin, with no eval and no framing', () => {
    const csp = asMap(true).get('Content-Security-Policy') ?? ''
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("connect-src 'self'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).not.toContain('unsafe-eval')
  })

  it('leave the CSP off in development, where Fast Refresh needs eval', () => {
    expect(asMap(false).has('Content-Security-Policy')).toBe(false)
  })
})
