'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { cx } from '@/lib/cx'
import { RESUME_URL } from '@/content/profile'
import { useActiveSection, useHydrated, useScrolledPast } from '@/lib/hooks'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ArrowRightIcon, DownloadIcon, MenuIcon, MoonIcon, SunIcon } from '@/components/ui/icons'

/* Section links are plain <a> elements, not next/link: Link ignores a click
   when the URL already ends in the same #hash, so a second click did nothing. */
interface NavItem {
  label: string
  /** Root-relative so the links also work from /projects/* and the 404 page. */
  href: `/#${string}`
}

export const NAV_LINKS: readonly NavItem[] = [
  { label: 'Work',       href: '/#projects'   },
  { label: 'Experience', href: '/#experience' },
  { label: 'About',      href: '/#about'      },
  { label: 'Contact',    href: '/#contact'    },
]

/** Section ids the nav links point at, in page order ("/#projects" → "projects"). */
const SECTION_IDS = NAV_LINKS.map(link => link.href.slice(2))
const MENU_ID = 'mobile-menu'
const indexOf = (i: number) => String(i + 1).padStart(2, '0')

/**
 * Slides the rail's highlight under the link for `section` by writing its
 * offset and width as CSS variables (no re-render); hides it when null.
 */
function useRailIndicator(rail: HTMLUListElement | null, section: string | null) {
  useEffect(() => {
    if (!rail) return
    const place = () => {
      const link = section ? rail.querySelector<HTMLElement>(`[data-section="${section}"]`) : null
      if (!link) {
        rail.removeAttribute('data-indicator')
        return
      }
      rail.style.setProperty('--ind-x', `${link.offsetLeft}px`)
      rail.style.setProperty('--ind-w', `${link.offsetWidth}px`)
      rail.setAttribute('data-indicator', '')
    }
    place()
    /* Re-measure when the rail resizes (web font swap, viewport changes). */
    const observer = new ResizeObserver(place)
    observer.observe(rail)
    return () => observer.disconnect()
  }, [rail, section])
}

export default function Navbar() {
  const pathname = usePathname()
  const hydrated = useHydrated()
  const scrolled = useScrolledPast(24)
  const { resolvedTheme, setTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  /* The section being read lights up its nav link (home page only). */
  const activeSection = useActiveSection(SECTION_IDS, { enabled: pathname === '/' })
  const currentFor = (href: string) => (href.slice(2) === activeSection ? 'location' : undefined)
  /* The highlight follows the pointer or keyboard focus, then returns to the current section. */
  const [rail, setRail] = useState<HTMLUListElement | null>(null)
  const [pointed, setPointed] = useState<string | null>(null)
  useRailIndicator(rail, pointed ?? activeSection)

  /* `resolvedTheme`, not `theme`: with the default "system" theme, `theme` is
     "system", so the toggle would set "dark" while already dark. */
  const isDark = hydrated && resolvedTheme === 'dark'
  /* At the top of a page with a hero the bar dissolves into it: the ivory home
     cover keeps ink tokens; the deep-blue case-study covers switch to inverse
     (ivory) tokens. Once scrolled it's a frosted paper bar above the page. */
  const blueCover = pathname.startsWith('/projects/')
  const hasHero = pathname === '/' || blueCover
  const overHero = hasHero && !scrolled && !menuOpen

  return (
    <header className={cx('nav', overHero && blueCover && 'on-inverse')} data-variant={overHero ? 'hero' : 'solid'}>
      <nav aria-label="Main" className="nav__bar">
        <Link
          href="/"
          className="nav__brand"
          aria-label="Siddheshwar Chirkute, home"
          onClick={e => {
            /* Already home: Link would do nothing (same URL), so scroll to the top
               ourselves (smooth unless reduced motion, via CSS) and drop any #hash. */
            if (pathname !== '/') return
            e.preventDefault()
            window.history.replaceState(null, '', '/')
            window.scrollTo({ top: 0 })
          }}
        >
          <span aria-hidden="true" className="nav__mark">SC</span>
          <span className="nav__lockup">
            <span className="nav__name">Siddheshwar Chirkute</span>
            <span aria-hidden="true" className="nav__role">Full-stack developer</span>
          </span>
        </Link>

        <ul ref={setRail} className="nav__rail hidden md:flex" onPointerLeave={() => setPointed(null)}>
          {NAV_LINKS.map((link, i) => {
            const section = link.href.slice(2)
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  data-section={section}
                  className="nav__link"
                  aria-current={currentFor(link.href)}
                  onPointerEnter={() => setPointed(section)}
                  onFocus={() => setPointed(section)}
                  onBlur={() => setPointed(null)}
                >
                  <span aria-hidden="true" className="nav__index">{indexOf(i)}</span>
                  {link.label}
                </a>
              </li>
            )
          })}
        </ul>

        <div className="nav__actions">
          <p className="nav__status">
            <span aria-hidden="true" className="dot dot--live dot--pulse" />
            Open to work
          </p>
          {/* Always rendered (no layout shift); the icon appears once the theme is known. */}
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={hydrated ? (isDark ? 'Switch to light theme' : 'Switch to dark theme') : 'Toggle colour theme'}
          >
            {hydrated ? (isDark ? <SunIcon /> : <MoonIcon />) : null}
          </Button>

          <Button href={RESUME_URL} download size="sm" className="hidden md:inline-flex" trailingIcon={<DownloadIcon size={15} />}>
            Resume
          </Button>

          <Button
            variant="ghost"
            size="sm"
            iconOnly
            className="md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls={MENU_ID}
            aria-haspopup="dialog"
          >
            <MenuIcon />
          </Button>
        </div>
      </nav>
      {/* Reading progress along the bar's lower edge (scroll-driven CSS, no JS) */}
      <span aria-hidden="true" className="nav__progress" />

      <Modal
        id={MENU_ID}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Menu"
        size="sm"
        placement="top"
        closeLabel="Close menu"
      >
        <ul>
          {NAV_LINKS.map((link, i) => (
            <li key={link.href}>
              <a href={link.href} className="nav__menu-link" aria-current={currentFor(link.href)} onClick={() => setMenuOpen(false)}>
                <span>
                  <span aria-hidden="true" className="nav__index">{indexOf(i)}</span>
                  {link.label}
                </span>
                <ArrowRightIcon />
              </a>
            </li>
          ))}
        </ul>
        <Button href={RESUME_URL} download block className="mt-6" trailingIcon={<DownloadIcon size={16} />}>
          Download resume
        </Button>
      </Modal>
    </header>
  )
}
