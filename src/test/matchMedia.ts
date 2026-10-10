import { vi } from 'vitest'

/** A real EventTarget, so `change` listeners fire exactly as in a browser. */
export class FakeMediaQueryList extends EventTarget implements MediaQueryList {
  onchange = null
  constructor(readonly media: string, public matches: boolean) { super() }
  addListener(): void {}
  removeListener(): void {}
}

/**
 * Stubs window.matchMedia. `resolve` gives each query's initial result; the
 * same list is returned for repeat calls, and `set` flips one and fires `change`.
 */
export function stubMatchMedia(resolve: (query: string) => boolean) {
  const lists = new Map<string, FakeMediaQueryList>()
  vi.spyOn(window, 'matchMedia').mockImplementation(query => {
    let list = lists.get(query)
    if (!list) {
      list = new FakeMediaQueryList(query, resolve(query))
      lists.set(query, list)
    }
    return list
  })
  return {
    set(query: string, matches: boolean) {
      const list = lists.get(query)
      if (!list) throw new Error(`matchMedia was never asked about ${query}`)
      list.matches = matches
      list.dispatchEvent(new Event('change'))
    },
  }
}
