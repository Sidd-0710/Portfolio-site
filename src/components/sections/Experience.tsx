import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { JOBS } from '@/content/profile'

export default function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-heading" className="section section--sunken">
      <div className="container-site grid gap-x-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeader eyebrow="Experience" index={2} title="Where I've worked" highlight="worked" titleId="experience-heading" className="lg:sticky lg:top-28" />
        </div>

        <ol className="timeline lg:col-span-8">
          {JOBS.map((job, i) => (
            <Reveal as="li" key={job.company} delay={i * 120} className="relative">
              <span aria-hidden="true" className="timeline__node" />
              <Card as="article" interactive padding="lg">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="card-title">{job.role}</h3>
                  <p className="font-mono text-xs text-fg-subtle">{job.period}</p>
                </div>
                <p className="mt-1 font-mono text-sm text-accent">{job.company}</p>
                <ul className="bullets mt-5">
                  {job.bullets.map(b => <li key={b}>{b}</li>)}
                </ul>
              </Card>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
