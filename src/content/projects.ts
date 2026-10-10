/**
 * Project data shared by the home page cards, the hero network and the
 * case-study pages (/projects/<slug>). Edit projects here, nowhere else.
 */

/** live: public demo · local: public code, runs locally · prototype: in progress, not public yet */
export type ProjectStatus = 'live' | 'local' | 'prototype'

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  live:      'Live',
  local:     'Local only',
  prototype: 'Prototype',
}

export const STATUS_DOT: Record<ProjectStatus, string> = {
  live:      'dot dot--live',
  local:     'dot dot--idle',
  prototype: 'dot',
}

export interface Project {
  /** URL-safe id: the card's #project-<slug> anchor and its /projects/<slug> case study. */
  slug: string
  name: string
  /** Short descriptor shown under the name. */
  sub: string
  status: ProjectStatus
  /** Team context for group work, e.g. "Team of 4 · lead developer". Omit for solo projects. */
  team?: string
  stack: readonly string[]
  /** Live demo URL; set exactly when `status` is 'live'. */
  live: string | null
  /** Public repository, or `null` while the code isn't public. */
  repo: string | null
  /** Hosted on a free tier that sleeps when idle (shows a wake-up note). */
  sleep: boolean
  bullets: readonly string[]
}

export const PROJECTS: readonly Project[] = [
  {
    slug:   'autovalue',
    name:   'AutoValue',
    sub:    'Used-car price prediction',
    status: 'live',
    stack:  ['Python', 'pandas', 'scikit-learn', 'FastAPI', 'pytest', 'Render'],
    live:   'https://autovalue-ok9g.onrender.com',
    repo:   'https://github.com/Sidd-0710/car-price-prediction',
    sleep:  true,
    bullets: [
      'End-to-end ML app that estimates a used car’s resale price in India with a confidence range, built on 40,440 listings from CarDekho, Cars24 and Spinny.',
      'Tuned Hist Gradient Boosting, chosen from 9 algorithms by 5-fold cross-validation: 9.8% typical error, R² 0.86 on unseen cars.',
      'Deployed live on Render: a FastAPI API with Pydantic validation serving a hand-built web app with light and dark themes; tested with pytest.',
    ],
  },
  {
    slug:   'signal',
    name:   'Signal',
    sub:    'AI-powered news aggregator',
    status: 'local',
    stack:  ['React', 'Node.js', 'Express', 'Ollama (local LLM)'],
    live:   null,
    repo:   'https://github.com/Sidd-0710/Ai-News-Aggregator',
    sleep:  false,
    bullets: [
      'Full-stack aggregator pulling live articles from 29 RSS feeds across 8 categories with source-credibility scoring (0–100).',
      'Locally-run LLM for 6-line summaries and Hindi translation: zero paid APIs, no data leaving the machine.',
      'Cross-outlet “compare sources” matching, English/Hindi text-to-speech, and an image pipeline with Open Graph fallback.',
    ],
  },
  {
    slug:   'seatly',
    name:   'Seatly',
    sub:    'Restaurant queue and ordering platform',
    status: 'live',
    team:   'Team of 4 · lead developer',
    stack:  ['React', 'TypeScript', 'React Router', 'Tailwind CSS', 'Vitest', 'Puppeteer', 'Vercel'],
    live:   'https://seatly-mu.vercel.app/',
    repo:   null,
    sleep:  false,
    bullets: [
      'Shows walk-in diners a live wait estimate and the full menu before they decide to enter; at the table they order by QR, track the order and pay by UPI QR.',
      'Owner dashboard for the live floor, queue, orders, customer visit history, menu and inventory: 26 screens, designed in Figma first.',
      'Front-end prototype on mock data, deployed on Vercel: one reducer drives all state, synced live across browser tabs. Wait times come from a rule-based queue model, and every visit is logged as training data for a planned ML phase.',
      'Covered by 38 unit tests and 33 end-to-end checks in real Chrome.',
    ],
  },
]

/** Looks a project up by slug; `undefined` for unknown slugs. */
export function findProject(slug: string): Project | undefined {
  return PROJECTS.find(p => p.slug === slug)
}
