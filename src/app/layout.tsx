import type { Metadata, Viewport } from 'next'
import { Inter, Source_Serif_4, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import Navbar from '@/components/Navbar'
import { AskLauncher } from '@/components/ask/AskLauncher'
import './globals.css'

/* ── Fonts: self-hosted by next/font, variable files (one per family) ── */
const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'swap',
})

/* Optical-size axis: headings use the display cut automatically */
const sourceSerif = Source_Serif_4({
  subsets:  ['latin'],
  variable: '--font-source-serif',
  axes:     ['opsz'],
  display:  'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets:  ['latin'],
  variable: '--font-jetbrains',
  display:  'swap',
})

export const metadata: Metadata = {
  title:       'Siddheshwar Chirkute — Full-Stack Developer',
  description: 'Full-stack developer building AI-powered products with React, Node.js, and Python. Based in India, open to remote and on-site roles.',
  keywords:    ['full-stack developer', 'AI', 'React', 'Node.js', 'Python', 'FastAPI', 'machine learning', 'portfolio'],
  authors:     [{ name: 'Siddheshwar Chirkute' }],
  openGraph: {
    title:       'Siddheshwar Chirkute — Full-Stack Developer',
    description: 'Full-stack developer building AI-powered products.',
    type:        'website',
  },
}

/* Mobile browser chrome matches the hero (dark in both themes) */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1d2433' },
    { media: '(prefers-color-scheme: dark)',  color: '#0f1522' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
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
