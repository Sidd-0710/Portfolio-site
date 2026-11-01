import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Newsreader } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import Navbar from '@/components/Navbar'
import { AskLauncher } from '@/components/ask/AskLauncher'
import { SITE_URL } from '@/lib/site'
import { PALETTE } from '@/styles/palette'
import './globals.css'

/* ── Fonts: self-hosted by next/font, variable files (one per family) ── */
const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'swap',
})

/* Editorial serif for headlines. Optical-size axis: big titles get the
   display cut automatically; the italic carries each headline's accent word. */
const newsreader = Newsreader({
  subsets:  ['latin'],
  variable: '--font-newsreader',
  style:    ['normal', 'italic'],
  axes:     ['opsz'],
  display:  'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets:  ['latin'],
  variable: '--font-jetbrains',
  display:  'swap',
})

export const metadata: Metadata = {
  /* Makes share-image and canonical URLs absolute (src/lib/site.ts) */
  metadataBase: new URL(SITE_URL),
  title:       'Siddheshwar Chirkute — Full-Stack Developer',
  description: 'Full-stack developer building AI-powered products with React, Node.js, and Python. Based in India, open to remote and on-site roles.',
  keywords:    ['full-stack developer', 'AI', 'React', 'Node.js', 'Python', 'FastAPI', 'machine learning', 'portfolio'],
  authors:     [{ name: 'Siddheshwar Chirkute' }],
  openGraph: {
    title:       'Siddheshwar Chirkute — Full-Stack Developer',
    description: 'Full-stack developer building AI-powered products.',
    type:        'website',
  },
  twitter: { card: 'summary_large_image' },
}

/* Mobile browser chrome matches the page: ivory by day, night blue in the dark */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: PALETTE.ivory50 },
    { media: '(prefers-color-scheme: dark)',  color: PALETTE.blue950 },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        {/* Scroll reveals need JS; without it, show everything */}
        <noscript>
          <style>{'.reveal{opacity:1!important;transform:none!important}'}</style>
        </noscript>
        <a href="#main" className="skip-link">Skip to content</a>
        <ThemeProvider>
          <Navbar />
          {children}
          <AskLauncher />
        </ThemeProvider>
      </body>
    </html>
  )
}
