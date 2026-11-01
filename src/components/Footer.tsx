import { ArrowUpIcon } from '@/components/ui/icons'
import { CONTACT, RESUME_URL } from '@/content/profile'

const LINKS = [
  { label: 'GitHub',   href: CONTACT.github,            external: true,  download: false },
  { label: 'LinkedIn', href: CONTACT.linkedin,          external: true,  download: false },
  { label: 'Email',    href: `mailto:${CONTACT.email}`, external: false, download: false },
  { label: 'Resume',   href: RESUME_URL,                external: false, download: true  },
] as const

/**
 * Site footer: name and role, quick links, back to top. `'use cache'` is
 * required for `new Date()` under Cache Components: without it `next build`
 * fails with "encountered the unstable value `new Date()` while prerendering".
 * The year is fixed at build or revalidation time, which is fine here.
 */
export default async function Footer() {
  'use cache'
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="container-site site-footer__inner">
        <p className="site-footer__brand">
          <span aria-hidden="true" className="nav__mark">SC</span>
          <span>
            <span className="site-footer__name">Siddheshwar Chirkute</span>
            <span className="site-footer__meta">© {year} · Full-stack developer · India</span>
          </span>
        </p>

        <nav aria-label="Footer">
          <ul className="site-footer__links">
            {LINKS.map(link => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  download={link.download || undefined}
                >
                  {link.label}
                  {link.external && <span className="sr-only"> (opens in a new tab)</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a href="#main" className="site-footer__top">
          Back to top <ArrowUpIcon size={14} />
        </a>
      </div>
    </footer>
  )
}
