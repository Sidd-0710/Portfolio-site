import type { AnchorHTMLAttributes } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

/* Mark anything rendered through next/link, so tests can see which links use it. */
vi.mock('next/link', () => ({
  default: ({ href, ...props }: { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a data-next-link="" href={href} {...props} />
  ),
}))

describe('Button', () => {
  it('renders a type="button" by default with variant and size classes', () => {
    render(<Button variant="secondary" size="lg">Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveClass('btn', 'btn--secondary', 'btn--lg')
  })

  it('renders a link when given an href, keeping the same styling', () => {
    render(<Button href="https://example.com" target="_blank" rel="noopener noreferrer">Visit</Button>)
    const link = screen.getByRole('link', { name: 'Visit' })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveClass('btn', 'btn--primary', 'btn--md')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('uses next/link only for page routes; #hash, download and external links stay native', () => {
    // next/link ignores a click when the URL already ends in the same #hash,
    // so "See my work" did nothing on a second click. Native anchors always scroll.
    render(
      <>
        <Button href="/projects/autovalue">Page</Button>
        <Button href="#projects">Hash</Button>
        <Button href="/#projects">Root hash</Button>
        <Button href="/resume.pdf" download>File</Button>
        <Button href="https://example.com">External</Button>
      </>,
    )
    expect(screen.getByRole('link', { name: 'Page' })).toHaveAttribute('data-next-link')
    for (const name of ['Hash', 'Root hash', 'File', 'External']) {
      expect(screen.getByRole('link', { name })).not.toHaveAttribute('data-next-link')
    }
  })

  it('keeps download links as plain anchors', () => {
    render(<Button href="/resume.pdf" download>Resume</Button>)
    expect(screen.getByRole('link', { name: 'Resume' })).toHaveAttribute('download')
  })

  it('disables itself and reports busy while loading', async () => {
    const onClick = vi.fn()
    render(<Button loading onClick={onClick}>Send</Button>)
    const button = screen.getByRole('button', { name: 'Send' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('names icon-only buttons with their aria-label', () => {
    render(<Button iconOnly aria-label="Close"><svg aria-hidden="true" /></Button>)
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('btn--icon')
  })
})
