import type { ComponentType } from 'react'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CodeIcon, ServerIcon, SparklesIcon, WrenchIcon, type IconProps } from '@/components/ui/icons'
import { LEARNING_NOTE, SKILL_GROUPS, type SkillGroup } from '@/content/profile'

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
        <SectionHeader eyebrow="Skills" index={3} title="What I work with" titleId="skills-heading" />

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

        <Reveal delay={320}>
          <p className="mt-10 border-l-2 border-accent pl-4 font-mono text-sm text-fg-muted">
            {LEARNING_NOTE}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
