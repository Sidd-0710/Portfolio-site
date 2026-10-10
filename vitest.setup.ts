import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

/* jsdom has no IntersectionObserver (framer-motion's useInView needs it).
   Report every observed element as visible straight away. */
class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly scrollMargin = ''
  readonly thresholds: readonly number[] = []
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(target: Element): void {
    const entry = { isIntersecting: true, target, intersectionRatio: 1 } as IntersectionObserverEntry
    this.callback([entry], this)
  }
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] { return [] }
}
/* The rest only applies to browser-like (jsdom) test files; server tests
   opt into the node environment with a // @vitest-environment comment. */
const isBrowserLike = typeof window !== 'undefined'

if (isBrowserLike) vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

/* jsdom has <dialog> but not showModal()/close(). Mimic the browser: open
   the dialog and focus its first focusable element; close fires "close". */
if (isBrowserLike && typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
    this.querySelector<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])')?.focus()
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}

/* jsdom has no matchMedia. Default: no query matches. Tests that need a
   specific result override this. */
if (isBrowserLike && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}
