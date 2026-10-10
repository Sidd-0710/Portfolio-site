import { CASE_STUDIES } from '@/content/case-studies'
import { PROJECTS, STATUS_LABEL } from '@/content/projects'
import { ABOUT_PARAGRAPHS, CONTACT, JOBS, LEARNING_NOTE, PROFILE, SKILL_GROUPS } from '@/content/profile'

/** One retrievable passage: what the assistant may quote, and where it lives on the site. */
export interface Chunk {
  id: string
  title: string
  /** Site link shown as the answer's source. */
  href: string
  text: string
}

/**
 * Builds the assistant's knowledge from the same content modules the pages
 * render, so the site and the assistant can't disagree. Deliberately
 * excluded: the phone number and anything about the graduation year.
 */
export function buildKnowledge(): Chunk[] {
  const chunks: Chunk[] = [
    {
      id: 'profile',
      title: 'About Sidd',
      href: '/#about',
      text: `${PROFILE.name} (goes by ${PROFILE.nickname}). ${PROFILE.headline} ${PROFILE.summary} Based in ${PROFILE.location}.`,
    },
    {
      id: 'story',
      title: 'Sidd’s story and interests',
      href: '/#about',
      text: ABOUT_PARAGRAPHS.join(' '),
    },
    {
      id: 'availability',
      title: 'Availability and contact',
      href: '/#contact',
      text: `${PROFILE.availabilityDetail} Contact: email ${CONTACT.email}, LinkedIn ${CONTACT.linkedin}, GitHub ${CONTACT.github}.`,
    },
    {
      id: 'education',
      title: 'Education',
      href: '/#about',
      text: `Education: ${PROFILE.education}`,
    },
    ...JOBS.map((job, i): Chunk => ({
      id: `job-${i}`,
      title: `Experience: ${job.role}, ${job.company}`,
      href: '/#experience',
      text: `Sidd has worked at ${job.company} as ${job.role} (${job.period}): a job / internship, part of his work experience. ${job.bullets.join(' ')}`,
    })),
    ...SKILL_GROUPS.map((group): Chunk => ({
      id: `skills-${group.label.toLowerCase().replace(/[^a-z]+/g, '-')}`,
      title: `Skills: ${group.label}`,
      href: '/#skills',
      text: `${group.label} skills: ${group.skills.join(', ')}. ${LEARNING_NOTE}`,
    })),
    ...PROJECTS.map((p): Chunk => ({
      id: `project-${p.slug}`,
      title: `Project: ${p.name}`,
      href: `/#project-${p.slug}`,
      text: [
        `${p.name}: ${p.sub}. Status: ${STATUS_LABEL[p.status]}.`,
        p.team ? `${p.team}.` : 'Solo project.',
        `Built with ${p.stack.join(', ')}.`,
        p.bullets.join(' '),
        p.live ? `Live demo: ${p.live}.` : '',
        p.repo ? `Source code: ${p.repo}.` : '',
      ].filter(Boolean).join(' '),
    })),
  ]

  for (const study of CASE_STUDIES) {
    const name = PROJECTS.find(p => p.slug === study.slug)?.name ?? study.slug
    const base = `/projects/${study.slug}`
    const add = (section: string, label: string, text: string) =>
      chunks.push({ id: `${study.slug}-${section}`, title: `${name} case study: ${label}`, href: `${base}#${section}`, text: `${name}. ${text}` })

    add('problem', 'the problem', `${study.tagline} ${study.role}. ${study.problem.join(' ')}`)
    add('built', 'what was built', study.built.join(' '))
    add('how', 'how it works', [
      study.flow.map(s => `${s.title}: ${s.detail}.`).join(' '),
      study.deepDive ? `${study.deepDive.title}: ${study.deepDive.paragraphs.join(' ')}` : '',
    ].join(' '))
    add('decisions', 'key decisions', study.decisions.map(d => `${d.title}: ${d.why}`).join(' '))
    add('results', 'results', [...study.results, ...study.metrics.map(m => `${m.value} ${m.label}.`)].join(' '))
    add('production', 'how it runs in production', study.production.join(' '))
    add('next', 'what’s next', study.next.join(' '))
  }

  return chunks
}
