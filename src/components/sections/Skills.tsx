import type { ComponentType } from 'react'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CodeIcon, ServerIcon, SparklesIcon, WrenchIcon, type IconProps } from '@/components/ui/icons'
import { LEARNING_NOTE, SKILL_GROUPS, type SkillGroup } from '@/content/profile'
import { SkillsNetwork } from './SkillsNetwork'

const GROUP_ICON: Record<SkillGroup['label'], ComponentType<IconProps>> = {
  'Frontend': CodeIcon,
  'Backend':  ServerIcon,
  'AI / ML':  SparklesIcon,
  'Tools':    WrenchIcon,
}

export default function Skills() {
  return (
    <section id="skills" aria-labelledby="skills-heading" className="section">
      <div className="container-site">
        {/* Heading and note on the left; the interactive network fills the right on desktop */}
        <div className="mb-10 grid items-center gap-x-10 gap-y-6 md:mb-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeader eyebrow="Skills" index={3} title="What I work with" highlight="work" titleId="skills-heading" className="mb-6! md:mb-6!" />
            <Reveal delay={120}>
              <p className="border-l-2 border-accent-fill pl-4 font-mono text-sm text-fg-muted">
                {LEARNING_NOTE}
              </p>
            </Reveal>
          </div>
          <Reveal delay={160} className="hidden lg:col-span-7 lg:block">
            <SkillsNetwork />
          </Reveal>
        </div>

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SKILL_GROUPS.map(({ label, skills }, gi) => {
            const Icon = GROUP_ICON[label]
            return (
              <Reveal as="li" key={label} delay={gi * 80} className="flex">
                <Card as="article" interactive aria-labelledby={`skills-${gi}`} className="w-full">
                  <span className="icon-tile"><Icon size={20} /></span>
                  <h3 id={`skills-${gi}`} className="card-title mt-5">{label}</h3>
                  <ul aria-labelledby={`skills-${gi}`} className="mt-4 flex flex-wrap gap-1.5">
                    {skills.map(skill => <li key={skill} className="chip">{skill}</li>)}
                  </ul>
                </Card>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
