// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { CASE_STUDIES } from '@/content/case-studies'
import { SITE_URL } from '@/lib/site'
import robots from './robots'
import sitemap from './sitemap'

describe('sitemap and robots', () => {
  it('list the home page and every case study with absolute URLs', () => {
    const urls = sitemap().map(entry => entry.url)
    expect(urls).toEqual([SITE_URL, ...CASE_STUDIES.map(s => `${SITE_URL}/projects/${s.slug}`)])
    for (const url of urls) expect(() => new URL(url)).not.toThrow()
  })

  it('keep crawlers out of the API and point them to the sitemap', () => {
    const { rules, sitemap: map } = robots()
    expect(rules).toMatchObject({ userAgent: '*', disallow: '/api/' })
    expect(map).toBe(`${SITE_URL}/sitemap.xml`)
  })
})
