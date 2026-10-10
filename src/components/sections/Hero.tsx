'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/ErrorBoundary'
import { RESUME_URL } from '@/components/Navbar'
import { Button } from '@/components/ui/Button'
import { ArrowRightIcon, ChevronDownIcon, DownloadIcon, GitHubIcon, LinkedInIcon } from '@/components/ui/icons'
import { useInView, useMediaQuery } from '@/lib/hooks'

/* Three.js isn't SSR-safe. The hero is complete without the canvas (the CSS
   grid floor carries the depth), so nothing shows while it loads, and it
   renders nothing if it fails. */
const NeuralNet = dynamic(() => import('@/components/3d/NeuralNet'), {
  ssr: false,
  loading: () => null,
})

const SOCIAL_LINKS = [
  { href: 'https://github.com/Sidd-0710',               label: 'GitHub profile (opens in a new tab)',   Icon: GitHubIcon   },
  { href: 'https://linkedin.com/in/siddheshwarchirkute', label: 'LinkedIn profile (opens in a new tab)', Icon: LinkedInIcon },
] as const

/** Stagger for the entrance; position-only, so text is readable before JS runs. */
const rise = (step: number) => ({ '--reveal-delay': `${step * 90}ms` })

export default function Hero() {
  const [section, setSection] = useState<HTMLElement | null>(null)
  const inView     = useInView(section)
  /* Desktop only. Gating on the media query (not CSS `hidden`) means phones
     never download three.js or start a WebGL context. */
  const isDesktop  = useMediaQuery('(min-width: 1024px)')

  return (
    <section id="hero" ref={setSection} aria-labelledby="hero-heading" className="hero on-inverse">
      <div aria-hidden="true" className="hero__glow" />
      <div aria-hidden="true" className="hero__floor" />

      {isDesktop && (
        <div aria-hidden="true" className="hero__canvas">
          <ErrorBoundary fallback={null}>
            <NeuralNet active={inView} />
          </ErrorBoundary>
        </div>
      )}

      <div className="container-site relative z-(--z-raised) flex min-h-svh items-center pt-28 pb-24">
        <div className="max-w-2xl">
          <p className="pill rise" style={rise(0)}>
            <span aria-hidden="true" className="dot dot--pulse" />
            FULL-STACK DEVELOPER
          </p>

          <h1 id="hero-heading" className="hero__title rise mt-7" style={rise(1)}>
            Siddheshwar
            <br />
            Chirkute
          </h1>

          <p className="lead mt-6 rise" style={rise(2)}>
            Full-stack developer building
            <br />
            AI-powered products.
          </p>

          <div className="mt-10 flex flex-wrap gap-3 rise" style={rise(3)}>
            <Button href="#projects" size="lg" trailingIcon={<ArrowRightIcon />}>
              See my work
            </Button>
            <Button href={RESUME_URL} download size="lg" variant="glass" trailingIcon={<DownloadIcon />}>
              Resume
            </Button>
          </div>

          <ul className="mt-10 flex gap-1 rise" style={rise(4)}>
            {SOCIAL_LINKS.map(({ href, label, Icon }) => (
              <li key={href}>
                <Button href={href} target="_blank" rel="noopener noreferrer" variant="ghost" iconOnly aria-label={label}>
                  <Icon size={20} />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div aria-hidden="true" className="hero__cue">
        SCROLL
        <ChevronDownIcon size={16} />
      </div>
    </section>
  )
}
