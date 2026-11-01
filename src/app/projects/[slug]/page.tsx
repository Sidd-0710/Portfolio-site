import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Footer from '@/components/Footer'
import { Flow } from '@/components/case-study/Flow'
import { Shot } from '@/components/case-study/Shot'
import { Toc, type TocItem } from '@/components/case-study/Toc'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, GitHubIcon } from '@/components/ui/icons'
import { CASE_STUDIES, findCaseStudy, type CaseStudy } from '@/content/case-studies'
import { findProject, STATUS_DOT, STATUS_LABEL, type Project } from '@/content/projects'

/** Every case study is prerendered at build time. */
export function generateStaticParams() {
  return CASE_STUDIES.map(c => ({ slug: c.slug }))
}

/** Resolves both halves of a project (card data + case study), or 404s. */
function load(slug: string): { project: Project; study: CaseStudy } {
  const project = findProject(slug)
  const study = findCaseStudy(slug)
  if (!project || !study) notFound()
  return { project, study }
}

export async function generateMetadata({ params }: PageProps<'/projects/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const project = findProject(slug)
  const study = findCaseStudy(slug)
  if (!project || !study) return {}
  const title = `${project.name}: case study · Siddheshwar Chirkute`
  return {
    title,
    description: study.tagline,
    openGraph: { title, description: study.tagline, type: 'article' },
  }
}

const SECTIONS: readonly TocItem[] = [
  { id: 'problem',    label: 'The problem' },
  { id: 'built',      label: 'What I built' },
  { id: 'how',        label: 'How it works' },
  { id: 'decisions',  label: 'Key decisions' },
  { id: 'results',    label: 'Results' },
  { id: 'production', label: 'In production' },
  { id: 'next',       label: 'What I’d do next' },
]

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="cs-section">
      <Reveal>
        <h2 id={`${id}-title`} className="cs-h2 mb-6">{title}</h2>
        {children}
      </Reveal>
    </section>
  )
}

function Bullets({ items }: { items: readonly string[] }) {
  return (
    <ul className="bullets max-w-prose [&>li]:text-base">
      {items.map(item => <li key={item}>{item}</li>)}
    </ul>
  )
}

/**
 * The page reads `params` inside <Suspense>, as Cache Components expects, so a
 * client navigation can show the shell instantly. Every slug is prerendered
 * by generateStaticParams, so a normal page load arrives complete.
 */
export default function CaseStudyPage({ params }: PageProps<'/projects/[slug]'>) {
  return (
    <>
      <Suspense fallback={<CaseStudySkeleton />}>
        <CaseStudyContent params={params} />
      </Suspense>
      <Footer />
    </>
  )
}

/** Same footprint as the real header, so nothing jumps when content arrives. */
function CaseStudySkeleton() {
  return (
    <main id="main" tabIndex={-1} aria-busy="true">
      <div className="cs-hero on-inverse">
        <div className="container-site pt-28 pb-20">
          <div className="grid max-w-3xl gap-5">
            <div className="h-4 w-28 rounded-pill skeleton" />
            <div className="h-16 w-2/3 rounded-lg skeleton" />
            <div className="h-6 w-full rounded-lg skeleton" />
          </div>
        </div>
      </div>
      <p className="sr-only">Loading case study…</p>
    </main>
  )
}

async function CaseStudyContent({ params }: { params: PageProps<'/projects/[slug]'>['params'] }) {
  const { slug } = await params
  const { project, study } = load(slug)
  const index = CASE_STUDIES.findIndex(c => c.slug === slug)
  const nextStudy = CASE_STUDIES[(index + 1) % CASE_STUDIES.length]
  const nextProject = findProject(nextStudy.slug)
  const wideShots  = study.shots.filter(shot => shot.frame !== 'phone')
  const phoneShots = study.shots.filter(shot => shot.frame === 'phone')

  return (
      <main id="main" tabIndex={-1}>
        {/* ── Header: a deep-blue cover ────────────────────────────────── */}
        <header className="cs-hero on-inverse">
          <div aria-hidden="true" className="hero__glow" />
          <div className="container-site relative pt-28 pb-14 md:pb-20">
            {/* A different page, so next/link handles the #hash scroll correctly here */}
            <Link href="/#projects" className="cs-back">
              <ArrowLeftIcon size={16} /> All projects
            </Link>

            <div className="mt-8 grid gap-5 max-w-3xl">
              <p className="eyebrow">Case study · {String(index + 1).padStart(2, '0')}</p>
              <h1 className="cs-title">{project.name}</h1>
              <p className="standfirst max-w-[44ch]">{study.tagline}</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="pill">
                  <span aria-hidden="true" className={STATUS_DOT[project.status]} />
                  {STATUS_LABEL[project.status]}
                </span>
                <span className="font-mono text-xs text-fg-subtle">{study.role}</span>
              </div>
              {(project.live || project.repo) && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {project.live && (
                    <Button href={project.live} target="_blank" rel="noopener noreferrer" size="lg" trailingIcon={<ArrowUpRightIcon />}>
                      Open live demo<span className="sr-only"> (opens in a new tab)</span>
                    </Button>
                  )}
                  {project.repo && (
                    <Button href={project.repo} target="_blank" rel="noopener noreferrer" size="lg" variant="glass" leadingIcon={<GitHubIcon />}>
                      Source code<span className="sr-only"> (opens in a new tab)</span>
                    </Button>
                  )}
                </div>
              )}
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {study.metrics.map(m => (
                <Card key={m.label} variant="glass" padding="md" className="flex flex-col-reverse gap-1.5">
                  <dt className="font-mono text-xs leading-snug text-fg-subtle">{m.label}</dt>
                  <dd className="stat-figure self-start">{m.value}</dd>
                </Card>
              ))}
            </dl>
          </div>
        </header>

        {/* ── Body: sticky contents on the left, story on the right ──── */}
        <div className="container-site section grid gap-12 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-16">
          <aside className="hidden lg:block">
            <div className="sticky top-28"><Toc items={SECTIONS} /></div>
          </aside>

          <article aria-label={`${project.name} case study`} className="min-w-0">
            <Section id="problem" title="The problem">
              <div className="grid max-w-prose gap-4 prose-muted text-lg">
                {study.problem.map(p => <p key={p}>{p}</p>)}
              </div>
            </Section>

            <Section id="built" title="What I built">
              <Bullets items={study.built} />
              {/* Desktop shots full width; phone shots side by side */}
              <div className="mt-10 grid gap-12">
                {wideShots.map((shot, i) => <Shot key={shot.src} shot={shot} eager={i === 0} />)}
                {phoneShots.length > 0 && (
                  <div className="grid items-start justify-center gap-10 sm:grid-cols-[repeat(auto-fit,minmax(0,280px))]">
                    {phoneShots.map(shot => <Shot key={shot.src} shot={shot} />)}
                  </div>
                )}
              </div>
            </Section>

            <Section id="how" title="How it works">
              <Flow steps={study.flow} label={`${project.name} architecture, step by step`} />
              {study.deepDive && (
                <Card variant="sunken" padding="lg" className="mt-8">
                  <h3 className="card-title">{study.deepDive.title}</h3>
                  <div className="mt-3 grid gap-3 prose-muted">
                    {study.deepDive.paragraphs.map(p => <p key={p}>{p}</p>)}
                  </div>
                </Card>
              )}
            </Section>

            <Section id="decisions" title="Key decisions and trade-offs">
              <ul className="grid gap-4 md:grid-cols-2">
                {study.decisions.map(d => (
                  <Card as="li" key={d.title} interactive padding="md">
                    <h3 className="card-title text-base">{d.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-fg-muted">{d.why}</p>
                  </Card>
                ))}
              </ul>
            </Section>

            <Section id="results" title="Results">
              <Bullets items={study.results} />
              {study.resultsFigure && <div className="mt-10"><Shot shot={study.resultsFigure} /></div>}
            </Section>

            <Section id="production" title="How it runs in production">
              <Bullets items={study.production} />
            </Section>

            <Section id="next" title="What I’d do next">
              <Bullets items={study.next} />
            </Section>
          </article>
        </div>

        {/* ── Next case study ─────────────────────────────────────────── */}
        {nextProject && nextStudy.slug !== slug && (
          <div className="container-site pb-[var(--section-space)]">
            <Card as="a" href={`/projects/${nextStudy.slug}`} interactive padding="lg" className="flex flex-wrap items-center justify-between gap-4">
              <span>
                <span className="eyebrow">Next case study</span>
                <span className="card-title mt-2 block text-h2">{nextProject.name}</span>
                <span className="mt-1 block text-fg-muted">{nextStudy.tagline}</span>
              </span>
              <ArrowRightIcon size={28} className="text-accent" />
            </Card>
          </div>
        )}
      </main>
  )
}
