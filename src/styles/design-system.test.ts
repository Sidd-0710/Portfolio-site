// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PALETTE, tokenName, type PaletteKey } from './palette'

const read = (file: string) => readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8')
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const tokensCss = stripComments(read('./tokens.css'))
const componentsCss = stripComments(read('./components.css'))
const globalsCss = stripComments(read('../app/globals.css'))

/** Every non-test .ts/.tsx file under src/, as [relative path, contents]. */
const SRC = fileURLToPath(new URL('..', import.meta.url))
function sourceFiles(dir = SRC): [string, string][] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    if (!/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) return []
    return [[path.slice(SRC.length), readFileSync(path, 'utf8')] as [string, string]]
  })
}
const code = sourceFiles()

/** Custom properties declared in the first block matching `selector`. */
function declarations(selector: RegExp): Map<string, string> {
  const block = tokensCss.match(selector)?.[1] ?? ''
  return new Map([...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]))
}
const light = declarations(/:root\s*\{([^}]*)\}/)
const dark  = declarations(/\.dark,\s*\.on-inverse\s*\{([^}]*)\}/)

/** Follows var() chains to a hex colour, using the dark overrides when asked. */
function resolve(name: string, theme: 'light' | 'dark'): string {
  const value = (theme === 'dark' && dark.get(name)) || light.get(name)
  if (!value) throw new Error(`token ${name} is not defined`)
  const ref = value.match(/^var\((--[\w-]+)\)$/)
  if (ref) return resolve(ref[1], theme)
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`token ${name} is not a hex colour: ${value}`)
  return value
}

function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('colour contrast (WCAG AA)', () => {
  const surfaces = ['--surface-canvas', '--surface-raised', '--surface-sunken', '--surface-overlay']
  const textRoles = ['--fg', '--fg-muted', '--fg-subtle', '--accent']

  for (const theme of ['light', 'dark'] as const) {
    it.each(textRoles.flatMap(fg => surfaces.map(bg => [fg, bg])))(
      `${theme}: %s on %s is at least 4.5:1`,
      (fg, bg) => expect(contrast(resolve(fg, theme), resolve(bg, theme))).toBeGreaterThanOrEqual(4.5),
    )

    it(`${theme}: text on a crimson fill is at least 4.5:1`, () => {
      expect(contrast(resolve('--on-accent', theme), resolve('--accent-fill', theme))).toBeGreaterThanOrEqual(4.5)
    })

    it(`${theme}: crimson display words (large text) are at least 3:1 on the canvas`, () => {
      expect(contrast(resolve('--accent-fill', theme), resolve('--surface-canvas', theme))).toBeGreaterThanOrEqual(3)
    })
  }
})

describe('component styles use only tokens', () => {
  /* Masks are alpha maps, not colours: #000 there means "opaque". */
  const lines = componentsCss.split('\n').filter(line => !/mask/.test(line))

  it('contain no raw colours (hex or rgb numbers)', () => {
    const raw = lines.filter(line => /#[0-9a-f]{3,8}\b|rgba?\(\s*\d/i.test(line)).map(l => l.trim())
    expect(raw).toEqual([])
  })

  it.each(['font-size', 'letter-spacing', 'font-stretch'])('set every %s from a token', prop => {
    const literal = lines
      .filter(line => new RegExp(`(^|[\\s;{])${prop}:`).test(line))
      .filter(line => !new RegExp(`${prop}:\\s*(var\\(|0;|inherit|normal)`).test(line))
      .map(l => l.trim())
    expect(literal).toEqual([])
  })

  it('reference only custom properties that exist', () => {
    const declared = new Set([...`${tokensCss}\n${componentsCss}`.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]))
    /* Set at runtime: next/font variables, JS-written pointer/indicator values, inline styles. */
    for (const name of ['--font-inter', '--font-archivo', '--font-jetbrains', '--px', '--py', '--mx', '--my',
                        '--ind-x', '--ind-w', '--reveal-delay', '--flow-steps']) declared.add(name)
    const used = [...componentsCss.matchAll(/var\((--[\w-]+)/g)].map(m => m[1])
    expect([...new Set(used.filter(name => !declared.has(name)))]).toEqual([])
  })
})

describe('token tiers', () => {
  /* Tier 1 (brand primitives) is everything before the first semantic-roles heading. */
  const rawTokens = read('./tokens.css')
  const roleTiers = stripComments(rawTokens.slice(rawTokens.indexOf('/* ── 2. Semantic roles')))

  it('keep raw colour values in tier 1: roles and scales only reference them', () => {
    const raw = roleTiers.split('\n')
      .filter(line => !/--grain:/.test(line))                                  // an SVG data URI, not a colour
      .filter(line => /#[0-9a-f]{3,8}\b|rgba?\(\s*\d|--[\w-]+-rgb:\s*\d/i.test(line))
      .map(l => l.trim())
    expect(raw).toEqual([])
  })

  it('give components roles, never brand primitives, for solid colours', () => {
    /* Channel triplets (--coral-rgb) stay allowed: they're how tints are written. */
    expect([...componentsCss.matchAll(/var\((--(?:ivory|blue|coral)-\d+)\)/g)].map(m => m[1])).toEqual([])
  })

  it('mirror tier 1 exactly in palette.ts, for code that cannot read CSS', () => {
    for (const key of Object.keys(PALETTE) as PaletteKey[]) {
      const name = tokenName(key)
      if (name === '--white') { expect(light.get(name)).toBe(PALETTE.white); continue }
      expect({ [name]: light.get(name) }).toEqual({ [name]: PALETTE[key] })
    }
  })

  it('leave hex colours to palette.ts: no other source file writes its own', () => {
    const offenders = code
      .filter(([path]) => !path.endsWith('styles/palette.ts'))
      .flatMap(([path, text]) => [...text.matchAll(/['"`]#[0-9a-f]{3,8}\b/gi)].map(m => `${path}: ${m[0]}`))
    expect(offenders).toEqual([])
  })

  it('define no dead tokens: each one is read by CSS, a Tailwind utility or code', () => {
    const everything = [tokensCss, componentsCss, globalsCss, ...code.map(([, text]) => text)].join('\n')
    /* Tokens that override Tailwind's theme are read through its utilities (tracking-wide, rounded-pill, font-mono). */
    const utility: Record<string, string> = { tracking: 'tracking', radius: 'rounded', font: 'font' }
    const dead = [...new Set([...tokensCss.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]))].filter(name => {
      const escaped = name.replace(/[-]/g, '\\-')
      if (new RegExp(`\\(\\s*${escaped}\\s*[,)]`).test(everything)) return false
      const ns = name.match(/^--(tracking|radius|font)-(.+)$/)
      return !(ns && new RegExp(`\\b${utility[ns[1]]}-${ns[2]}\\b`).test(everything))
    })
    expect(dead).toEqual([])
  })
})
