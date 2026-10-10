'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { cx } from '@/lib/cx'
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

export const RESUME_URL = '/Siddheshwar-Chirkute-Resume.pdf'
/** Section ids the nav links point at, in page order ("/#projects" → "projects"). */
const SECTION_IDS = NAV_LINKS.map(link => link.href.slice(2))
const MENU_ID = 'mobile-menu'

export default function Navbar() {
  const pathname = usePathname()
  const hydrated = useHydrated()
  const scrolled = useScrolledPast(24)
  const { resolvedTheme, setTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  /* The section being read lights up its nav link (home page only). */
  const activeSection = useActiveSection(SECTION_IDS, { enabled: pathname === '/' })
  const currentFor = (href: string) => (href.slice(2) === activeSection ? 'location' : undefined)

  /* `resolvedTheme`, not `theme`: with the default "system" theme, `theme` is
     "system", so the toggle would set "dark" while already dark. */
  const isDark = hydrated && resolvedTheme === 'dark'
  /* Over the always-dark home hero the bar dissolves into it (inverse tokens);
     otherwise it's a frosted capsule above the page. */
  const overHero = pathname === '/' && !scrolled && !menuOpen

  return (
    <header className={cx('nav', overHero && 'on-inverse')} data-variant={overHero ? 'hero' : 'solid'}>
      <nav aria-label="Main" className="nav__bar">
        <Link
          href="/"
          className="nav__brand"
          aria-label="Sidd, home"
          onClick={e => {
            /* Already home: Link would do nothing (same URL), so scroll to the top
               ourselves (smooth unless reduced motion, via CSS) and drop any #hash. */
            if (pathname !== '/') return
            e.preventDefault()
            window.history.replaceState(null, '', '/')
            window.scrollTo({ top: 0 })
          }}
        >
          Sidd<span aria-hidden="true" className="nav__brand-dot">.</span>
        </Link>

        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <a href={link.href} className="nav__link" aria-current={currentFor(link.href)}>{link.label}</a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5">
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
          {NAV_LINKS.map(link => (
            <li key={link.href}>
              <a href={link.href} className="nav__menu-link" aria-current={currentFor(link.href)} onClick={() => setMenuOpen(false)}>
                {link.label}
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
