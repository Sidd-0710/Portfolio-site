// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createAnswerCache, normaliseQuestion, recordAnswer } from './answerCache'

const answer = (text: string) => ({ text, sources: [] })

describe('answer cache', () => {
  it('treats case, spacing and trailing punctuation as the same question', () => {
    expect(normaliseQuestion('  How accurate is   AutoValue?? ')).toBe(normaliseQuestion('how accurate is autovalue'))
  })

  it('expires entries after the TTL', () => {
    const cache = createAnswerCache({ max: 10, ttlMs: 1_000 })
    cache.set('q', answer('a'), 0)
    expect(cache.get('q', 999)?.text).toBe('a')
    expect(cache.get('q', 1_000)).toBeUndefined()
  })

  it('evicts the least recently used entry when full', () => {
    const cache = createAnswerCache({ max: 2, ttlMs: 60_000 })
    cache.set('a', answer('A'), 0)
    cache.set('b', answer('B'), 0)
    cache.get('a', 1)                 // "a" is now the most recent
    cache.set('c', answer('C'), 2)    // evicts "b"
    expect(cache.get('a', 3)?.text).toBe('A')
    expect(cache.get('b', 3)).toBeUndefined()
    expect(cache.get('c', 3)?.text).toBe('C')
  })
})

describe('recordAnswer', () => {
  const encode = (s: string) => new TextEncoder().encode(s)

  it('passes the stream through and reports the full text once it ends', async () => {
    let recorded = ''
    const input = new ReadableStream<Uint8Array>({
      start(c) { c.enqueue(encode('Sidd built ')); c.enqueue(encode('Seatly.')); c.close() },
    })
    const out = await new Response(input.pipeThrough(recordAnswer(t => { recorded = t }))).text()
    expect(out).toBe('Sidd built Seatly.')
    expect(recorded).toBe('Sidd built Seatly.')
  })

  it('records nothing when the stream is cancelled part-way', async () => {
    let recorded: string | null = null
    const input = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(encode('half')) } })   // never closes
    const reader = input.pipeThrough(recordAnswer(t => { recorded = t })).getReader()
    await reader.read()
    await reader.cancel()
    expect(recorded).toBeNull()
  })
})
