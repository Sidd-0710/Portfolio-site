import type { AnchorHTMLAttributes } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navbar, { NAV_LINKS } from './Navbar'

const setTheme = vi.fn<(theme: string) => void>()
let mockTheme: { theme: string; resolvedTheme: string } = { theme: 'system', resolvedTheme: 'dark' }
let mockPathname = '/'

vi.mock('next-themes', () => ({
  useTheme: () => ({ ...mockTheme, setTheme }),
}))

/* Mark anything rendered through next/link, so tests can see which links use it. */
vi.mock('next/link', () => ({
  default: ({ href, ...props }: { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a data-next-link="" href={href} {...props} />
  ),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

beforeEach(() => {
  setTheme.mockClear()
  mockTheme = { theme: 'system', resolvedTheme: 'dark' }
  mockPathname = '/'
})

describe('Navbar', () => {
  it('switches to light when the "system" theme resolves to dark', async () => {
    render(<Navbar />)
    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }))
    expect(setTheme).toHaveBeenCalledWith('light')
  })

  it('switches to dark when the theme resolves to light', async () => {
    mockTheme = { theme: 'system', resolvedTheme: 'light' }
    render(<Navbar />)
    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }))
    expect(setTheme).toHaveBeenCalledWith('dark')
  })

  it('uses root-relative section links so they work off the home page', () => {
    mockPathname = '/does-not-exist'
    render(<Navbar />)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    for (const { label, href } of NAV_LINKS) {
      expect(within(nav).getByRole('link', { name: label })).toHaveAttribute('href', href)
    }
  })

  it('renders section links as native anchors, so a repeat click still scrolls', () => {
    render(<Navbar />)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    for (const { label } of NAV_LINKS) {
      expect(within(nav).getByRole('link', { name: label })).not.toHaveAttribute('data-next-link')
    }
    expect(within(nav).getByRole('link', { name: 'Siddheshwar Chirkute, home' })).toHaveAttribute('data-next-link')
  })

  it('scrolls back to the top when the logo is clicked on the home page', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    render(<Navbar />)
    await userEvent.click(screen.getByRole('link', { name: 'Siddheshwar Chirkute, home' }))
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 })
    scrollTo.mockRestore()
  })

  it('marks the link for the section being read with aria-current', () => {
    // The setup's IntersectionObserver mock reports every section as visible,
    // so the first one in page order (projects → "Work") is current.
    for (const id of ['projects', 'experience', 'about', 'contact']) {
      const section = document.createElement('section')
      section.id = id
      document.body.append(section)
    }
    const { unmount } = render(<Navbar />)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getByRole('link', { name: 'Work' })).toHaveAttribute('aria-current', 'location')
    expect(within(nav).getByRole('link', { name: 'About' })).not.toHaveAttribute('aria-current')
    unmount()

    mockPathname = '/projects/seatly'                       // no highlight away from the home page
    render(<Navbar />)
    expect(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'Work' })).not.toHaveAttribute('aria-current')
    document.querySelectorAll('section').forEach(s => s.remove())
  })

  it('shows the rail highlight only for a current, hovered or focused link', async () => {
    mockPathname = '/projects/seatly'                       // no current section here
    render(<Navbar />)
    const about = within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'About' })
    const rail = about.closest('ul')
    expect(rail).not.toHaveAttribute('data-indicator')

    about.focus()
    await waitFor(() => expect(rail).toHaveAttribute('data-indicator'))
    about.blur()
    await waitFor(() => expect(rail).not.toHaveAttribute('data-indicator'))
  })

  it('dissolves into the hero at the top of the page, in ivory over the blue case-study covers', () => {
    const { unmount } = render(<Navbar />)                    // home: ivory cover, ink tokens
    expect(screen.getByRole('banner')).toHaveAttribute('data-variant', 'hero')
    expect(screen.getByRole('banner')).not.toHaveClass('on-inverse')
    unmount()

    mockPathname = '/projects/autovalue'                       // case study: deep-blue cover
    const study = render(<Navbar />)
    expect(screen.getByRole('banner')).toHaveAttribute('data-variant', 'hero')
    expect(screen.getByRole('banner')).toHaveClass('on-inverse')
    study.unmount()

    mockPathname = '/some-missing-page'
    render(<Navbar />)
    expect(screen.getByRole('banner')).toHaveAttribute('data-variant', 'solid')
    expect(screen.getByRole('banner')).not.toHaveClass('on-inverse')
  })

  it('opens the mobile menu as a modal; Escape closes it and refocuses the toggle', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    const toggle = screen.getByRole('button', { name: 'Open menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)
    const menu = document.getElementById(toggle.getAttribute('aria-controls') ?? '')
    expect(menu?.tagName).toBe('DIALOG')
    expect(menu).toHaveAttribute('open')
    expect(menu).toHaveAccessibleName('Menu')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('banner')).toHaveAttribute('data-variant', 'solid')

    await user.keyboard('{Escape}')
    expect(menu).not.toHaveAttribute('open')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
  })

  it('closes the menu when a link inside it is chosen', async () => {
    const user = userEvent.setup()
    render(<Navbar />)
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    const menu = screen.getByRole('dialog', { name: 'Menu' })
    await user.click(within(menu).getByRole('link', { name: 'About' }))
    expect(menu).not.toHaveAttribute('open')
  })
})
