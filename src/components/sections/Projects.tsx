import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ArrowRightIcon, ArrowUpRightIcon, GitHubIcon } from '@/components/ui/icons'
import { cx } from '@/lib/cx'
import { coverFor, phoneShotsFor } from '@/content/case-studies'
import { PROJECTS, STATUS_DOT, STATUS_LABEL } from '@/content/projects'

/**
 * Project cards. The whole card opens the project's case study: the title
 * link's ::after stretches over the card (.card-link), while the Live demo
 * and Source buttons sit above it and stay separately clickable.
 */
export default function Projects() {
  /* Two columns from lg; an odd last card spans the row, image beside text,
     so the grid never ends on a half-empty row. */
  const lastIsWide = PROJECTS.length % 2 === 1

  return (
    <section id="projects" aria-labelledby="projects-heading" className="section">
      <div className="container-site">
        <SectionHeader eyebrow="Projects" index={1} title="Things I've built" highlight="built" titleId="projects-heading" />

        <ul className="grid gap-6 lg:grid-cols-2">
          {PROJECTS.map((p, i) => {
            const wide = lastIsWide && i === PROJECTS.length - 1
            const cover = coverFor(p.slug)
            /* The wide card's image column is as tall as its text, so it has room for the phone screens too. */
            const phones = wide ? phoneShotsFor(p.slug) : []
            const titleId = `project-${p.slug}-title`

            return (
              <Reveal as="li" key={p.name} delay={(i % 2) * 120} className={cx('flex', wide && 'lg:col-span-2')}>
                <Card
                  as="article"
                  tilt={wide ? 'subtle' : true}   /* full-width: half the angle, same edge travel */
                  padding="lg"
                  id={`project-${p.slug}`}
                  aria-labelledby={titleId}
                  className={cx('project-card flex w-full flex-col', wide && 'lg:grid lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:items-stretch lg:gap-x-10')}
                >
                  {cover && (
                    <div className={cx('project-card__cover', phones.length > 0 && 'project-card__cover--stage')}>
                      <Image
                        src={cover.src}
                        alt=""   /* decorative here: the case study shows them with full descriptions */
                        width={cover.width}
                        height={cover.height}
                        sizes="(min-width: 1024px) 540px, 100vw"
                      />
                      {phones.map((shot, n) => (
                        <Image
                          key={shot.src}
                          src={shot.src}
                          alt=""
                          width={shot.width}
                          height={shot.height}
                          sizes="180px"
                          className={cx('project-card__phone', `project-card__phone--${n + 1}`)}
                        />
                      ))}
                    </div>
                  )}

                  <div className={cx('flex flex-1 flex-col', !wide && 'mt-6', wide && 'mt-6 lg:mt-0')}>
                    <div className="flex items-center justify-between gap-4">
                      <span aria-hidden="true" className="font-mono text-label text-fg-subtle">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {/* Same pill for every status, so titles line up across the row */}
                      <span className="pill">
                        <span aria-hidden="true" className={STATUS_DOT[p.status]} />
                        {STATUS_LABEL[p.status]}
                      </span>
                    </div>

                    <h3 className="card-title project-card__title mt-4">
                      <Link href={`/projects/${p.slug}`} className="card-link">
                        {/* The space is its own text node: name algorithms that trim
                            each child would otherwise read "AutoValuecase study". */}
                        <span id={titleId}>{p.name}</span>{' '}
                        <span className="sr-only">case study</span>
                        <ArrowRightIcon size={22} className="card-link__arrow" />
                      </Link>
                    </h3>
                    <p className="mt-1 text-fg-muted">{p.sub}</p>
                    {p.team && <p className="mt-2 font-mono text-xs text-fg-subtle">{p.team}</p>}

                    <ul aria-label="Tech stack" className="mt-5 flex flex-wrap gap-1.5">
                      {p.stack.map(t => <li key={t} className="chip">{t}</li>)}
                    </ul>

                    <ul className="bullets mt-6 flex-1">
                      {p.bullets.map(b => <li key={b}>{b}</li>)}
                    </ul>

                    {p.sleep && (
                      <p className="mt-5 text-xs text-fg-subtle">
                        Hosted on Render&apos;s free tier, so the first visit after a quiet spell can take about a minute to wake up.
                      </p>
                    )}

                    {/* Accessible names include the project, so screen-reader link
                        lists don't show identical "Source" entries. */}
                    {(p.live || p.repo) && (
                      <div className="mt-6 flex flex-wrap gap-2 border-t border-border-subtle pt-6">
                        {p.live && (
                          <Button
                            href={p.live}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="sm"
                            aria-label={`${p.name} live demo (opens in a new tab)`}
                            trailingIcon={<ArrowUpRightIcon size={15} />}
                          >
                            Live demo
                          </Button>
                        )}
                        {p.repo && (
                          <Button
                            href={p.repo}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="sm"
                            variant="secondary"
                            aria-label={`${p.name} source on GitHub (opens in a new tab)`}
                            leadingIcon={<GitHubIcon size={15} />}
                          >
                            Source
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
