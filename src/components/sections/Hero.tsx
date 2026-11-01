import Image from 'next/image'
import { RESUME_URL } from '@/content/profile'
import { Button } from '@/components/ui/Button'
import { ArrowRightIcon, DownloadIcon, GitHubIcon, LinkedInIcon } from '@/components/ui/icons'

const SOCIAL_LINKS = [
  { href: 'https://github.com/Sidd-0710',               label: 'GitHub profile (opens in a new tab)',   Icon: GitHubIcon   },
  { href: 'https://linkedin.com/in/siddheshwarchirkute', label: 'LinkedIn profile (opens in a new tab)', Icon: LinkedInIcon },
] as const

const TAGS = ['Code', 'Data', 'Models', 'Products'] as const
const STRIP = ['Build', 'Ship', 'Learn'] as const

/** Stagger for the entrance; position-only, so text is readable before JS runs. */
const rise = (step: number) => ({ '--reveal-delay': `${step * 90}ms` })

export default function Hero() {
  return (
    <section id="hero" aria-labelledby="hero-heading" className="hero">
      <div aria-hidden="true" className="hero__glow" />

      {/* Portrait in front of a deep-blue disc; a coral satellite orbits it and passes behind the head. */}
      <div className="hero__visual">
        <div aria-hidden="true" className="hero__ring" />
        <div aria-hidden="true" className="hero__orbit"><span className="hero__satellite" /></div>
        <Image
          src="/images/sidd-portrait.png"
          alt="Portrait of Siddheshwar Chirkute"
          width={1254}
          height={1254}
          sizes="(min-width: 1024px) 50vw, 90vw"
          preload
          className="hero__portrait"
        />
      </div>

      <div className="container-site relative z-(--z-raised) flex min-h-svh items-end pt-28 pb-24 lg:items-center">
        <div className="max-w-2xl">
          {/* Decorative; hidden on phones, where it would sit over the portrait */}
          <ul aria-hidden="true" className="hero__tags rise max-lg:hidden" style={rise(0)}>
            {TAGS.map(tag => <li key={tag}>{tag}</li>)}
          </ul>

          <h1 id="hero-heading" className="hero__title rise mt-8" style={rise(1)}>
            Siddheshwar
            <br />
            <span className="title-accent">Chirkute</span>
          </h1>

          <p className="standfirst mt-7 rise" style={rise(2)}>
            Full-stack developer building AI-powered products.
          </p>

          <div className="mt-10 flex flex-wrap gap-3 rise max-sm:*:w-full" style={rise(3)}>
            {/* The page's one coral button: the action we most want taken */}
            <Button href="#projects" size="lg" variant="solid" trailingIcon={<ArrowRightIcon size={16} />}>
              See my work
            </Button>
            <Button href={RESUME_URL} download size="lg" variant="glass" trailingIcon={<DownloadIcon size={16} />}>
              Resume
            </Button>
          </div>

          <ul className="mt-8 flex gap-1 rise" style={rise(4)}>
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

      <div className="container-site absolute inset-x-0 bottom-7 hidden md:block">
        <ul aria-hidden="true" className="hero__strip">
          {STRIP.map(word => <li key={word}>{word}</li>)}
        </ul>
      </div>
    </section>
  )
}
