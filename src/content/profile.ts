/**
 * Who Sidd is: the single source for the About, Experience, Skills and
 * Contact sections and for the "Ask about my work" assistant's knowledge.
 *
 * Privacy (docs/portfolio-brief.md): never add the graduation year or "final
 * year" anywhere here. The phone number deliberately isn't in this file, so
 * the assistant can never hand it to a scraper; Contact assembles it in the
 * browser instead.
 */

export const PROFILE = {
  name: 'Siddheshwar Chirkute',
  nickname: 'Sidd',
  headline: 'Full-stack developer building AI-powered products.',
  summary: 'Computer Engineering student and full-stack developer building AI-powered products with React, Node.js, Express and Python (FastAPI, scikit-learn). Strong in REST API design, with hands-on experience in local LLM integration and end-to-end machine learning.',
  location: 'Pen, Raigad, India',
  education: 'B.E. Computer Engineering at Vishwaniketan Institute of Management, Entrepreneurship and Engineering Technology (iMEET), Nov 2022 – present.',
  availability: 'Open to full-time roles: remote, or Pune / Bangalore / Hyderabad / Mumbai',
  availabilityDetail: 'Looking for a full-time role as soon as possible, alongside finishing college: remote from India (including for US companies, so no visa is needed), or on-site in Pune, Bangalore, Hyderabad or Mumbai.',
} as const

export const CONTACT = {
  email: 'siddheshwarchirkute2003@gmail.com',
  linkedin: 'https://linkedin.com/in/siddheshwarchirkute',
  github: 'https://github.com/Sidd-0710',
} as const

export interface Job {
  role: string
  company: string
  period: string
  bullets: readonly string[]
}

export const JOBS: readonly Job[] = [
  {
    role:    'Full-Stack Developer Intern',
    company: 'TTn Garage',
    period:  'Jun 2026 – Present',
    bullets: [
      'Building full-stack features in React.js, Node.js, and Express.js: REST API integrations and responsive UI components.',
      'Working with the engineering team across debugging, testing, and deployment workflows.',
    ],
  },
  {
    role:    'Web Development Intern',
    company: 'Pionoor Tech',
    period:  'Sep 2024 – Nov 2024',
    bullets: [
      'Shipped responsive, client-facing web pages in HTML, CSS, and JavaScript, improving usability across devices.',
      'Maintained live web applications through testing, debugging, and deployment.',
    ],
  },
]

export interface SkillGroup {
  label: 'Frontend' | 'Backend' | 'AI / ML' | 'Tools'
  skills: readonly string[]
}

export const SKILL_GROUPS: readonly SkillGroup[] = [
  { label: 'Frontend', skills: ['JavaScript', 'TypeScript', 'React.js', 'React Native', 'Tailwind CSS', 'HTML5 / CSS3'] },
  { label: 'Backend',  skills: ['Node.js', 'Express.js', 'Python', 'FastAPI', 'REST APIs', 'MongoDB'] },
  { label: 'AI / ML',  skills: ['scikit-learn', 'pandas', 'LLM Integration (Ollama)', 'Hist Gradient Boosting', 'Pydantic'] },
  { label: 'Tools',    skills: ['Git & GitHub', 'pytest', 'Render', 'Vercel', 'GitHub Actions'] },
]

export const LEARNING_NOTE = 'Currently going deep on RAG, cloud deployment, and DevOps.'

export const ABOUT_PARAGRAPHS: readonly string[] = [
  'I’ve loved coding since school, enough that I took Computer Science as an extra subject in 12th grade. Coding is my dopamine: it’s how I unwind, and it’s where my best ideas come from.',
  'I’m a Computer Engineering student and a full-stack intern at TTn Garage, going deep on AI engineering. I recently deployed my first ML product to production: a used-car price predictor trained on 40,000+ real listings. RAG is next on the list.',
  'Away from the screen, you’ll find me cycling, swimming, or halfway through an anime or a romance series.',
]

export interface Hobby {
  emoji: string
  label: string
}

export const HOBBIES: readonly Hobby[] = [
  { emoji: '🚴', label: 'Cycling'  },
  { emoji: '🏊', label: 'Swimming' },
  { emoji: '⛩️', label: 'Anime'    },
  { emoji: '🎬', label: 'Movies'   },
]

export interface Stat {
  value: string
  label: string
}

/* Each figure comes from the resume. */
export const STATS: readonly Stat[] = [
  { value: '2',            label: 'Internships'               },
  { value: '40k+',         label: 'Listings behind AutoValue' },
  { value: 'R² 0.86', label: 'AutoValue on unseen cars'  },
  { value: '29',           label: 'RSS feeds in Signal'       },
]
