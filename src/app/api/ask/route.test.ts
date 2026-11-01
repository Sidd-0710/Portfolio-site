// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CACHE_HEADER, SOURCES_HEADER, type AskSource } from '@/lib/ask/types'
import { POST } from './route'

let ipCounter = 0
/** Each test gets its own visitor IP, because the rate limiter lives at module level. */
function ask(question: unknown, ip = `10.0.0.${++ipCounter}`, init: { headers?: Record<string, string>; signal?: AbortSignal } = {}) {
  return POST(new Request('http://localhost/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip, ...init.headers },
    body: JSON.stringify({ question }),
    signal: init.signal,
  }))
}

/** A fake Groq streaming response. */
function groqStream(...parts: string[]) {
  const body = parts.map(p => `data: ${JSON.stringify({ choices: [{ delta: { content: p } }] })}\n\n`).join('') + 'data: [DONE]\n\n'
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
}

beforeEach(() => {
  vi.stubEnv('GROQ_API_KEY', 'test-key')
  vi.spyOn(console, 'info').mockImplementation(() => {})   // the route logs one JSON line per request
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('POST /api/ask', () => {
  it('rejects empty, missing and overlong questions', async () => {
    expect((await ask('   ')).status).toBe(400)
    expect((await ask(42)).status).toBe(400)
    const long = await ask('x'.repeat(301))
    expect(long.status).toBe(400)
    expect(await long.json()).toEqual({ error: expect.stringContaining('300 characters') })
  })

  it('declines off-topic questions without calling the model', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const res = await ask('What is the weather in Paris?')
    expect(res.status).toBe(200)
    expect(await res.text()).toMatch(/only answer questions about Sidd/)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('explains that the assistant is off when no API key is set', async () => {
    vi.stubEnv('GROQ_API_KEY', '')
    const res = await ask('What has Sidd built with LLMs?')
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: expect.stringMatching(/isn’t switched on yet/) })
  })

  it('streams the model’s answer and returns numbered sources', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(groqStream('Sidd built ', 'Signal [1].'))
    vi.stubGlobal('fetch', fetchSpy)

    const res = await ask('What has Sidd built with LLMs?')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Sidd built Signal [1].')

    const sources = JSON.parse(decodeURIComponent(res.headers.get(SOURCES_HEADER) ?? '[]')) as AskSource[]
    expect(sources[0]).toMatchObject({ n: 1, title: 'Project: Signal', href: '/#project-signal' })

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer test-key' })
    const body = JSON.parse(String(init.body)) as { stream: boolean; messages: { role: string; content: string }[] }
    expect(body.stream).toBe(true)
    expect(body.messages[1].content).toContain('[1] Project: Signal')
  })

  it('turns upstream failures into friendly errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })))
    const res = await ask('How accurate is the AutoValue model?')
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ error: expect.stringMatching(/try again/) })

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    expect((await ask('How accurate is the AutoValue model?')).status).toBe(502)
  })

  it('rate-limits a visitor after 8 questions in the window', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(groqStream('ok'))))
    const ip = '203.0.113.7'
    for (let i = 0; i < 8; i++) expect((await ask('How accurate is AutoValue?', ip)).status).toBe(200)
    const blocked = await ask('How accurate is AutoValue?', ip)
    expect(blocked.status).toBe(429)
    expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0)
  })

  it('answers a repeated question from the cache without calling the model again', async () => {
    const fetchSpy = vi.fn().mockImplementation(() => Promise.resolve(groqStream('Seatly uses ', 'a queue model [1].')))
    vi.stubGlobal('fetch', fetchSpy)

    const first = await ask('How does Seatly estimate wait times?')
    expect(first.headers.get(CACHE_HEADER)).toBe('miss')
    expect(await first.text()).toBe('Seatly uses a queue model [1].')   // reading it to the end completes the cache entry

    const repeat = await ask('  how does Seatly estimate wait times??')
    expect(repeat.headers.get(CACHE_HEADER)).toBe('hit')
    expect(await repeat.text()).toBe('Seatly uses a queue model [1].')
    expect(JSON.parse(decodeURIComponent(repeat.headers.get(SOURCES_HEADER) ?? '[]'))).not.toEqual([])
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('does not cache a failed answer', async () => {
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce(new Response('nope', { status: 500 }))
      .mockResolvedValueOnce(groqStream('Python, FastAPI and Node.js [1].'))
    vi.stubGlobal('fetch', fetchSpy)
    expect((await ask('What backend skills does he have?')).status).toBe(502)
    const retry = await ask('What backend skills does he have?')
    expect(retry.headers.get(CACHE_HEADER)).toBe('miss')
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('refuses questions posted from another website', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(groqStream('ok'))
    vi.stubGlobal('fetch', fetchSpy)
    const res = await ask('What has Sidd built?', undefined, { headers: { origin: 'https://evil.example' } })
    expect(res.status).toBe(403)
    expect((await ask('Has he deployed anything?', undefined, { headers: { origin: 'http://localhost' } })).status).not.toBe(403)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('rejects oversized request bodies before reading them', async () => {
    const res = await POST(new Request('http://localhost/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'content-length': '50000' },
      body: JSON.stringify({ question: 'x'.repeat(10) }),
    }))
    expect(res.status).toBe(413)
  })

  it('stops the model call when the visitor goes away', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(groqStream('ok'))
    vi.stubGlobal('fetch', fetchSpy)
    const visitor = new AbortController()
    await ask('Where has he worked?', undefined, { signal: visitor.signal })
    const { signal } = fetchSpy.mock.calls[0][1] as RequestInit
    expect(signal?.aborted).toBe(false)
    visitor.abort()
    expect(signal?.aborted).toBe(true)
  })
})
