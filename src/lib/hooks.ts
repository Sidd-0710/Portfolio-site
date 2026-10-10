import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

/**
 * `true` once the component has hydrated on the client; `false` during SSR and
 * the hydration render. Use it to gate output that depends on browser-only
 * state (e.g. the resolved theme) without a setState-in-effect "mounted" flag.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false)
}

/**
 * Live result of a CSS media query. Returns `serverValue` during SSR and
 * hydration, then the real match, and re-renders whenever it changes.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  )
}

function subscribeToScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}

/** `true` while the page is scrolled more than `offset` pixels from the top. */
export function useScrolledPast(offset: number): boolean {
  return useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > offset,
    () => false,
  )
}

interface InViewOptions {
  /** Stop observing after the first time the element enters the viewport. */
  once?: boolean
  /** IntersectionObserver rootMargin, e.g. '0px 0px -10% 0px'. */
  rootMargin?: string
}

/**
 * Whether `el` is in the viewport; `false` until observed. Pass the element
 * from a callback ref held in state (`ref={setEl}`), so the observer
 * re-attaches if the element changes.
 */
export function useInView(el: Element | null, { once = false, rootMargin = '0px' }: InViewOptions = {}): boolean {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return
      setInView(entry.isIntersecting)
      if (entry.isIntersecting && once) observer.disconnect()
    }, { rootMargin })
    observer.observe(el)
    return () => observer.disconnect()
  }, [el, once, rootMargin])

  return inView
}

export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

interface PointerDepthOptions {
  /** Rotate toward the pointer (writes --px / --py in [-1, 1]). */
  tilt: boolean
  /** Pointer-following sheen (writes --mx / --my as percentages). */
  spotlight: boolean
}

/**
 * Drives the 3D card treatment from pointer position. Only active for a
 * mouse or trackpad (never touch); tilt is also skipped for reduced motion.
 * Writes CSS variables once per animation frame. All magnitudes live in
 * CSS (`--tilt-max`), so this hook never decides how far anything moves.
 */
export function usePointerDepth(el: HTMLElement | null, { tilt, spotlight }: PointerDepthOptions): void {
  const finePointer  = useMediaQuery(FINE_POINTER_QUERY)
  const reduceMotion = useMediaQuery(REDUCED_MOTION_QUERY)

  useEffect(() => {
    const tiltOn = tilt && !reduceMotion
    if (!el || !finePointer || (!tiltOn && !spotlight)) return

    let frame = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
        el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
        if (tiltOn) {
          el.style.setProperty('--px', (x * 2 - 1).toFixed(3))
          el.style.setProperty('--py', (y * 2 - 1).toFixed(3))
          el.dataset.tiltActive = ''
        }
      })
    }
    const reset = () => {
      cancelAnimationFrame(frame)
      el.style.setProperty('--px', '0')
      el.style.setProperty('--py', '0')
      delete el.dataset.tiltActive
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', reset)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', reset)
      reset()
    }
  }, [el, tilt, spotlight, finePointer, reduceMotion])
}

interface ActiveSectionOptions {
  /** Turn the observer off (returns null), e.g. on pages without these sections. */
  enabled?: boolean
  /**
   * Band of the viewport a section must cross to count as current. The
   * default is a thin line just above the middle, so exactly one section
   * usually qualifies.
   */
  rootMargin?: string
}

/**
 * Id of the section being read: the first of `ids` (in the order given) that
 * crosses the band, or null when none does (e.g. while the hero fills the
 * screen). Powers the navbar highlight and the case-study contents list.
 */
export function useActiveSection(ids: readonly string[], { enabled = true, rootMargin = '-45% 0px -50% 0px' }: ActiveSectionOptions = {}): string | null {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join(' ')

  useEffect(() => {
    if (!enabled) return
    const order = key.split(' ')
    const visible = new Set<string>()
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target.id)
        else visible.delete(entry.target.id)
      }
      setActive(order.find(id => visible.has(id)) ?? null)
    }, { rootMargin })
    for (const id of order) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [key, enabled, rootMargin])

  return enabled ? active : null
}
