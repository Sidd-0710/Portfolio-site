import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { render, screen } from '@testing-library/react'
import Contact from './Contact'

describe('Contact', () => {
  it('keeps the joined phone number out of the server-rendered HTML', () => {
    const html = renderToString(<Contact />)
    expect(html).not.toContain('93228 81512')
    expect(html).not.toContain('9322881512')
    expect(html).toContain('Phone number appears once the page has loaded.')
  })

  it('shows the phone number as a tel: link once hydrated', () => {
    render(<Contact />)
    const phone = screen.getByRole('link', { name: /phone/i })
    expect(phone).toHaveAttribute('href', 'tel:+919322881512')
    expect(phone).toHaveTextContent('+91 93228 81512')
  })

  it('opens web profiles in a new tab safely and says so', () => {
    render(<Contact />)
    for (const name of [/linkedin/i, /github/i]) {
      const link = screen.getByRole('link', { name })
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link).toHaveAccessibleName(expect.stringContaining('opens in a new tab'))
    }
  })

  it('keeps the email link in the same tab', () => {
    render(<Contact />)
    const email = screen.getByRole('link', { name: /email/i })
    expect(email).toHaveAttribute('href', 'mailto:siddheshwarchirkute2003@gmail.com')
    expect(email).not.toHaveAttribute('target')
  })
})
