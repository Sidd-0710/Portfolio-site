import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { useHydrated, useInView, useMediaQuery, useScrolledPast } from './hooks'
import { stubMatchMedia } from '@/test/matchMedia'

afterEach(() => vi.restoreAllMocks())

describe('useMediaQuery', () => {
  it('returns the current match and updates when it changes', () => {
    const mq = stubMatchMedia(() => false)
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    expect(result.current).toBe(false)
    act(() => mq.set('(min-width: 1024px)', true))
    expect(result.current).toBe(true)
  })
})

describe('useInView', () => {
  it('reports visibility from IntersectionObserver', () => {
    const el = document.createElement('div')
    const { result } = renderHook(() => useInView(el, { once: true }))
    expect(result.current).toBe(true)   // the setup mock reports every element visible
  })
})

describe('useHydrated', () => {
  it('is false on the server and true on the client', () => {
    function Probe() { return <>{String(useHydrated())}</> }
    expect(renderToString(<Probe />)).toBe('false')
    expect(renderHook(() => useHydrated()).result.current).toBe(true)
  })
})

describe('useScrolledPast', () => {
  it('flips once the page scrolls past the offset', () => {
    const { result } = renderHook(() => useScrolledPast(24))
    expect(result.current).toBe(false)
    act(() => {
      window.scrollY = 100
      window.dispatchEvent(new Event('scroll'))
    })
    expect(result.current).toBe(true)
  })
})
