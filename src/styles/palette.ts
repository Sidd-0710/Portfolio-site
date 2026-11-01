/**
 * The brand primitives, for code that can't read CSS variables: the share
 * cards (Satori), the WebGL network (three.js) and the browser's theme-colour
 * meta tag. Each key is a tier-1 token in tokens.css (`ivory50` ↔ `--ivory-50`);
 * design-system.test.ts fails if a value here and its token disagree, and if
 * any other TypeScript file writes a hex colour of its own.
 */
export const PALETTE = {
  white:    '#ffffff',
  ivory50:  '#f6f1e7',   // Warm Ivory: the page
  ivory200: '#f4eee3',   // ivory text on blue
  blue600:  '#525c74',   // subtle text on ivory
  blue900:  '#11244a',   // Deep Editorial Blue
  blue950:  '#0b1730',   // night: the dark page
  coral300: '#ffa287',   // coral highlight on blue
  coral400: '#ff8160',   // coral on blue
  coral500: '#e8572f',   // Coral Orange
  coral700: '#ae3f1d',   // small coral text on ivory
} as const

export type PaletteKey = keyof typeof PALETTE

/** `ivory50` → `--ivory-50`: the CSS token a palette key mirrors. */
export function tokenName(key: PaletteKey): string {
  return `--${key.replace(/(\d+)$/, '-$1')}`
}

/** `#e8572f`, 0.45 → `rgba(232, 87, 47, 0.45)`. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
