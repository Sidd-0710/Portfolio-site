import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Projects from './Projects'
import { PROJECTS, STATUS_LABEL } from '@/content/projects'

describe('Projects', () => {
  it('keeps the data consistent: a live URL exactly when the status is live', () => {
    for (const p of PROJECTS) {
      expect(p.live !== null).toBe(p.status === 'live')
      if (p.sleep) expect(p.status).toBe('live')
    }
  })

  it('gives every link a unique accessible name', () => {
    render(<Projects />)
    const names = screen.getAllByRole('link').map(link =>
      link.getAttribute('aria-label') ?? link.textContent?.replace(/\s+/g, ' ').trim())
    expect(names.every(Boolean)).toBe(true)
    expect(new Set(names).size).toBe(names.length)
  })

  it('links only what is public, and labels each status', () => {
    render(<Projects />)
    for (const p of PROJECTS) {
      const card = screen.getByRole('article', { name: p.name })
      expect(within(card).getByText(STATUS_LABEL[p.status])).toBeInTheDocument()

      const repo = within(card).queryByRole('link', { name: `${p.name} source on GitHub (opens in a new tab)` })
      const live = within(card).queryByRole('link', { name: `${p.name} live demo (opens in a new tab)` })
      if (p.repo) {
        expect(repo).toHaveAttribute('href', p.repo)
        expect(repo).toHaveAttribute('rel', 'noopener noreferrer')
      } else {
        expect(repo).not.toBeInTheDocument()
      }
      if (p.live) {
        expect(live).toHaveAttribute('href', p.live)
      } else {
        expect(live).not.toBeInTheDocument()
      }
    }
  })

  it('links every project to its case study', () => {
    render(<Projects />)
    for (const p of PROJECTS) {
      const card = screen.getByRole('article', { name: p.name })
      expect(within(card).getByRole('link', { name: `${p.name} case study` })).toHaveAttribute('href', `/projects/${p.slug}`)
    }
  })

  it('makes the whole card open the case study, without hiding the other links', () => {
    render(<Projects />)
    for (const p of PROJECTS) {
      const card = screen.getByRole('article', { name: p.name })
      const caseStudy = within(card).getByRole('link', { name: `${p.name} case study` })
      expect(caseStudy).toHaveClass('card-link')            // ::after stretches it over the card
      expect(card).toHaveClass('project-card')               // lifts .btn links above the overlay
    }
  })

  it('shows team context for group projects', () => {
    render(<Projects />)
    for (const p of PROJECTS.filter(p => p.team)) {
      const card = screen.getByRole('article', { name: p.name })
      expect(within(card).getByText(p.team ?? '')).toBeInTheDocument()
    }
  })

  it('shows the free-tier wake-up note only for sleeping hosts', () => {
    render(<Projects />)
    expect(screen.getAllByText(/take about a minute to wake up/)).toHaveLength(PROJECTS.filter(p => p.sleep).length)
  })
})
