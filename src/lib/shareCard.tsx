import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { PALETTE, withAlpha } from '@/styles/palette'

/* Share cards (Open Graph / X) for links on LinkedIn, WhatsApp, X and Slack,
   in the site's own style. ImageResponse supports inline styles only, so the
   colours come from the TypeScript mirror of the brand tokens. */
export const SHARE_CARD_SIZE = { width: 1200, height: 630 }

const { ivory50: IVORY, blue900: BLUE, blue600: BLUE_MUTED, coral500: CORAL, coral700: CORAL_TEXT } = PALETTE

interface ShareCard {
  eyebrow: string
  /** Headline lines; the last one is set in italic coral. */
  title: readonly string[]
  subtitle: string
  footer: string
}

const font = (file: string) => readFile(join(process.cwd(), 'assets/fonts', file))

export async function shareCard({ eyebrow, title, subtitle, footer }: ShareCard): Promise<ImageResponse> {
  const [portrait, serif, serifItalic] = await Promise.all([
    readFile(join(process.cwd(), 'public/images/sidd-portrait.png')),
    /* Newsreader, the site's headline face (SIL Open Font Licence) */
    font('Newsreader-Display-Medium.ttf'),
    font('Newsreader-Display-MediumItalic.ttf'),
  ])
  const portraitSrc = `data:image/png;base64,${portrait.toString('base64')}`
  /* Serif capitals and lowercase run about 0.5em wide; fit the longest line in the 560px text column. */
  const longest = Math.max(...title.map(line => line.length))
  const titleSize = Math.min(104, Math.floor(560 / (0.5 * longest)))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: IVORY,
          color: BLUE,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 0 0 80px', width: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 19, letterSpacing: 5, color: BLUE_MUTED }}>
            <div style={{ width: 40, height: 2, background: CORAL }} />
            {eyebrow.toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 26, fontFamily: 'Newsreader', fontSize: titleSize, lineHeight: 1, letterSpacing: -2 }}>
            {title.map((line, i) => (
              <span key={line} style={i === title.length - 1 ? { color: CORAL, fontStyle: 'italic' } : undefined}>{line}</span>
            ))}
          </div>
          <div style={{ marginTop: 28, fontFamily: 'Newsreader', fontSize: 30, lineHeight: 1.3, color: BLUE_MUTED }}>{subtitle}</div>
          <div style={{ marginTop: 40, fontSize: 19, letterSpacing: 4, color: CORAL_TEXT }}>{footer.toUpperCase()}</div>
        </div>

        {/* As on the site: a thin coral orbit, the deep-blue disc, and the portrait
            in front, its hair breaking out of the disc and its shoulders cropped
            by the card's bottom edge */}
        <div style={{ position: 'absolute', right: 70, top: 160, width: 480, height: 480, borderRadius: 9999, border: `2px solid ${withAlpha(CORAL, 0.45)}` }} />
        <div style={{ position: 'absolute', right: 110, top: 200, width: 400, height: 400, borderRadius: 9999, background: BLUE }} />
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse draws plain <img> only */}
        <img src={portraitSrc} alt="" width={640} height={640} style={{ position: 'absolute', right: -10, bottom: -120 }} />
      </div>
    ),
    {
      ...SHARE_CARD_SIZE,
      fonts: [
        { name: 'Newsreader', data: serif, weight: 500, style: 'normal' },
        { name: 'Newsreader', data: serifItalic, weight: 500, style: 'italic' },
      ],
      /* Content only changes on deploy: let browsers and the CDN keep it. */
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400' },
    },
  )
}
