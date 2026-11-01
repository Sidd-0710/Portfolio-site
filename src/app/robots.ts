import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/** /robots.txt: crawl everything except the API, and point to the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
