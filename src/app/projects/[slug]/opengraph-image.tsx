import { notFound } from 'next/navigation'
import { findCaseStudy } from '@/content/case-studies'
import { PROJECTS } from '@/content/projects'
import { SHARE_CARD_SIZE, shareCard } from '@/lib/shareCard'

export const alt = 'Case study by Siddheshwar Chirkute'
export const size = SHARE_CARD_SIZE
export const contentType = 'image/png'

export function generateStaticParams() {
  return PROJECTS.map(p => ({ slug: p.slug }))
}

/** One card per case study: "Case study · 03", the project name in italic coral, its tagline. */
export default async function CaseStudyImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const index = PROJECTS.findIndex(p => p.slug === slug)
  const study = findCaseStudy(slug)
  if (index === -1 || !study) notFound()

  return shareCard({
    eyebrow: `Case study · ${String(index + 1).padStart(2, '0')}`,
    title: [PROJECTS[index].name],
    subtitle: study.tagline,
    footer: 'Siddheshwar Chirkute',
  })
}
