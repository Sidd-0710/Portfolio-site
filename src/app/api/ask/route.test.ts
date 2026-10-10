// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SOURCES_HEADER, type AskSource } from '@/lib/ask/types'
import { POST } from './route'

let ipCounter = 0
/** Each test gets its own visitor IP, because the rate limiter lives at module level. */
function ask(question: unknown, ip = `10.0.0.${++ipCounter}`) {
  return POST(new Request('http://localhost/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ question }),
  }))
}

/** A fake Groq streaming response. */
function groqStream(...parts: string[]) {
  const body = parts.map(p => `data: ${JSON.stringify({ choices: [{ delta: { content: p } }] })}\n\n`).join('') + 'data: [DONE]\n\n'
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
}

beforeEach(() => {
  vi.stubEnv('GROQ_API_KEY', 'test-key')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
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
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await ask('How accurate is AutoValue?')
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ error: expect.stringMatching(/try again/) })

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    expect((await ask('How accurate is AutoValue?')).status).toBe(502)
  })

  it('rate-limits a visitor after 8 questions in the window', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(groqStream('ok'))))
    const ip = '203.0.113.7'
    for (let i = 0; i < 8; i++) expect((await ask('How accurate is AutoValue?', ip)).status).toBe(200)
    const blocked = await ask('How accurate is AutoValue?', ip)
    expect(blocked.status).toBe(429)
    expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0)
  })
})
