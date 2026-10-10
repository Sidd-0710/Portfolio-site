'use client'

import type { ComponentType } from 'react'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { ArrowUpRightIcon, GitHubIcon, LinkedInIcon, MailIcon, PhoneIcon, type IconProps } from '@/components/ui/icons'
import { useHydrated } from '@/lib/hooks'
import { CONTACT } from '@/content/profile'

interface ContactLink {
  href: string
  label: string
  value: string
  Icon: ComponentType<IconProps>
  /** Opens in a new tab (web profiles); `mailto:` and `tel:` links don't. */
  external: boolean
}

/* The number is joined only in the browser, after hydration, so it never
   appears as one string in the server-rendered HTML that simple scrapers read. */
const PHONE_PARTS = ['+91', '93228', '81512'] as const

const LINKS: readonly ContactLink[] = [
  { href: `mailto:${CONTACT.email}`, label: 'Email',    value: CONTACT.email,                              Icon: MailIcon,     external: false },
  { href: CONTACT.linkedin,          label: 'LinkedIn', value: CONTACT.linkedin.replace('https://', ''), Icon: LinkedInIcon, external: true  },
  { href: CONTACT.github,            label: 'GitHub',   value: CONTACT.github.replace('https://', ''),   Icon: GitHubIcon,   external: true  },
]

/** Icon well, small label and value: the inside of every contact row. */
function RowContent({ Icon, label, value, external }: Omit<ContactLink, 'href'>) {
  return (
    <>
      <span className="icon-tile shrink-0"><Icon size={18} /></span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-label uppercase tracking-[0.08em] text-fg-subtle">{label}</span>
        {/* break-all keeps the long email address inside the card on narrow phones */}
        <span className="block break-all text-sm text-fg">{value}</span>
      </span>
      {external && <span className="sr-only"> (opens in a new tab)</span>}
      <ArrowUpRightIcon size={16} className="shrink-0 text-fg-subtle" />
    </>
  )
}

const ROW = 'flex items-center gap-4'

export default function Contact() {
  const hydrated = useHydrated()

  return (
    <section id="contact" aria-labelledby="contact-heading" className="section">
      <div className="container-site">
        <Reveal>
          {/* Inverse panel: the page's one dark, glowing surface outside the hero */}
          <Card variant="inverse" padding="lg" className="grid gap-10 lg:grid-cols-2 lg:gap-14 lg:p-14">
            <div className="grid content-start gap-4">
              <p className="eyebrow"><span aria-hidden="true" className="eyebrow__index">05.</span>Contact</p>
              <h2 id="contact-heading" className="section-title">Let&apos;s talk</h2>
              <p className="lead">
                I&apos;m looking for a full-time role, remote from India or on-site in Pune, Bangalore, Hyderabad or Mumbai. If you have an opportunity or just want to say hi, reach out.
              </p>
            </div>

            <ul className="grid content-start gap-3">
              {LINKS.map(({ href, external, ...row }) => (
                <li key={href}>
                  <Card
                    as="a"
                    href={href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    variant="glass"
                    padding="sm"
                    interactive
                    className={ROW}
                  >
                    <RowContent {...row} external={external} />
                  </Card>
                </li>
              ))}

              <li>
                {hydrated ? (
                  <Card as="a" href={`tel:${PHONE_PARTS.join('')}`} variant="glass" padding="sm" interactive className={ROW}>
                    <RowContent Icon={PhoneIcon} label="Phone" value={PHONE_PARTS.join(' ')} external={false} />
                  </Card>
                ) : (
                  <Card variant="glass" padding="sm" className={ROW}>
                    <span className="icon-tile shrink-0"><PhoneIcon size={18} /></span>
                    <span className="text-sm text-fg-muted">Phone number appears once the page has loaded.</span>
                  </Card>
                )}
              </li>
            </ul>
          </Card>
        </Reveal>
      </div>
    </section>
  )
}
