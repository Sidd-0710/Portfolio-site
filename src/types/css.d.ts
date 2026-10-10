import 'react'

declare module 'react' {
  /** Allow CSS custom properties in `style`, e.g. style={{ '--reveal-delay': '120ms' }}. */
  interface CSSProperties {
    [property: `--${string}`]: string | number | undefined
  }
}
