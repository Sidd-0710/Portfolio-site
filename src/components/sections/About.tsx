import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ABOUT_PARAGRAPHS, HOBBIES, PROFILE, STATS } from '@/content/profile'

export default function About() {
  return (
    <section id="about" aria-labelledby="about-heading" className="section section--sunken">
      <div className="container-site grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <SectionHeader eyebrow="About" index={4} title="A bit about me" titleId="about-heading" className="mb-8! md:mb-8!" />

          <Reveal className="grid max-w-[62ch] gap-4 prose-muted">
            {ABOUT_PARAGRAPHS.map(p => <p key={p}>{p}</p>)}
          </Reveal>

          <Reveal delay={120}>
            <p className="pill mt-8 normal-case tracking-normal">
              <span aria-hidden="true" className="dot dot--live" />
              {PROFILE.availability}
            </p>
          </Reveal>
        </div>

        <div className="grid gap-5 lg:col-span-5 lg:pt-4">
          {/* <dl> pairs each figure with its label for screen readers. Each Card
              is the dl's direct child (one div wrapper per dt/dd group, as HTML allows). */}
          <Reveal>
            <dl className="grid grid-cols-2 gap-4">
              {STATS.map(stat => (
                <Card key={stat.label} tilt padding="md" className="flex flex-col-reverse justify-end gap-1.5 text-center">
                  <dt className="font-mono text-xs leading-snug text-fg-subtle">{stat.label}</dt>
                  <dd className="font-serif text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] font-bold leading-none text-accent">
                    {stat.value}
                  </dd>
                </Card>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={160}>
            <Card padding="md">
              <h3 id="hobbies-heading" className="eyebrow text-fg-subtle">Outside work</h3>
              <ul aria-labelledby="hobbies-heading" className="mt-4 grid grid-cols-4 gap-2 text-center">
                {HOBBIES.map(h => (
                  <li key={h.label} className="grid justify-items-center gap-1.5">
                    <span aria-hidden="true" className="text-2xl">{h.emoji}</span>
                    <span className="font-mono text-xs text-fg-muted">{h.label}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
