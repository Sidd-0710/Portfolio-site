import type { MetadataRoute } from 'next'
import { CASE_STUDIES } from '@/content/case-studies'
import { SITE_URL } from '@/lib/site'

/** /sitemap.xml: the home page and every case study. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'monthly', priority: 1 },
    ...CASE_STUDIES.map(study => ({
      url: `${SITE_URL}/projects/${study.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
