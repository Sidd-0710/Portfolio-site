import { CONTACT } from '@/content/profile'
import { createAnswerCache, recordAnswer } from '@/lib/ask/answerCache'
import { buildKnowledge } from '@/lib/ask/knowledge'
import { buildMessages, MAX_QUESTION_LENGTH } from '@/lib/ask/prompt'
import { createRateLimiter } from '@/lib/ask/rateLimit'
import { buildIndex, MIN_RELEVANCE } from '@/lib/ask/retrieve'
import { sseToText } from '@/lib/ask/stream'
import { CACHE_HEADER, SOURCES_HEADER, type AskSource } from '@/lib/ask/types'

/**
 * POST /api/ask  { question: string }
 *
 * Retrieval-augmented answer about Sidd's work. Each step either answers or
 * passes the request on (docs/architecture.md has the diagram):
 *   1. guard: same-origin, small JSON body, sensible question length
 *   2. rate-limit the visitor
 *   3. retrieve the most relevant passages of the site's own content (BM25);
 *      decline off-topic questions without calling the model
 *   4. answer repeats from the in-memory answer cache
 *   5. stream a new answer from Groq that may only use those passages,
 *      caching it once it completes
 *
 * Success: 200, text/plain body (streamed), sources in X-Ask-Sources as
 * URI-encoded JSON (AskSource[]), X-Ask-Cache: hit | miss. Failure: JSON
 * { error } with a message written for the visitor.
 *
 * Config (server-only env, set in .env.local or the host's dashboard):
 *   GROQ_API_KEY  required for answers; without it the route returns 503
 *   GROQ_MODEL    optional, defaults to DEFAULT_MODEL
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'
/** A question is at most 300 characters; anything far bigger isn't a real request. */
const MAX_BODY_BYTES = 2_048
const UPSTREAM_TIMEOUT_MS = 20_000

/* Built once per server instance, not per request. */
const index = buildIndex(buildKnowledge())
/** 8 questions per visitor per 10 minutes. */
const perVisitor = createRateLimiter({ limit: 8, windowMs: 10 * 60_000 })
/** Daily model calls per instance, kept well under Groq's free daily request limit. */
const perInstance = createRateLimiter({ limit: 300, windowMs: 24 * 60 * 60_000 })
/** Finished answers, so popular questions cost one model call per instance per 12 hours. */
const answers = createAnswerCache({ max: 200, ttlMs: 12 * 60 * 60_000 })

type Outcome =
  | 'invalid' | 'forbidden' | 'rate_limited' | 'off_topic' | 'cache_hit'
  | 'disabled' | 'budget_exhausted' | 'upstream_busy' | 'upstream_error' | 'streamed'

/** One JSON line per request for the host's log viewer. Never logs the question itself. */
function log(outcome: Outcome, started: number, extra: Record<string, unknown> = {}) {
  console.info(JSON.stringify({ event: 'ask', outcome, ms: Math.round(performance.now() - started), ...extra }))
}

const errorResponse = (status: number, error: string, headers?: HeadersInit) =>
  Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store', ...headers } })

const textResponse = (body: BodyInit, sources: readonly AskSource[], cache: 'hit' | 'miss') =>
  new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      [SOURCES_HEADER]: encodeURIComponent(JSON.stringify(sources)),
      [CACHE_HEADER]: cache,
    },
  })

/**
 * Browsers send Origin on every cross-site POST, so a mismatch means another
 * website is trying to spend this site's model quota. Requests without an
 * Origin (curl, server-to-server) fall through to the rate limiter.
 */
function isCrossSite(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).host !== new URL(request.url).host
  } catch {
    return true
  }
}

/** First address in X-Forwarded-For (set by Vercel and most proxies), else a shared bucket. */
function visitorKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'anonymous'
}

async function readQuestion(request: Request): Promise<string | null> {
  try {
    const body: unknown = await request.json()
    if (typeof body === 'object' && body !== null && 'question' in body && typeof body.question === 'string') {
      return body.question.trim()
    }
  } catch {
    /* not JSON */
  }
  return null
}

export async function POST(request: Request): Promise<Response> {
  const started = performance.now()

  /* 1. Guard */
  if (isCrossSite(request)) {
    log('forbidden', started)
    return errorResponse(403, 'This assistant only answers questions asked on Sidd’s site.')
  }
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    log('invalid', started, { reason: 'body_too_large' })
    return errorResponse(413, `Please keep your question under ${MAX_QUESTION_LENGTH} characters.`)
  }
  const question = await readQuestion(request)
  if (!question) {
    log('invalid', started, { reason: 'empty' })
    return errorResponse(400, 'Please type a question.')
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    log('invalid', started, { reason: 'too_long' })
    return errorResponse(400, `Please keep your question under ${MAX_QUESTION_LENGTH} characters.`)
  }

  /* 2. Rate limit */
  const visitor = perVisitor.check(visitorKey(request))
  if (!visitor.allowed) {
    log('rate_limited', started)
    const minutes = Math.ceil(visitor.retryAfterSeconds / 60)
    return errorResponse(429, `That’s a lot of questions in a short time. Please try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`, {
      'Retry-After': String(visitor.retryAfterSeconds),
    })
  }

  /* 3. Retrieve */
  const hits = index.search(question, 4)
  const topScore = hits[0]?.score ?? 0
  if (topScore < MIN_RELEVANCE) {
    log('off_topic', started, { topScore })
    return textResponse(
      `I can only answer questions about Sidd: his projects, skills, experience and availability. Try one of the suggested questions, or email him at ${CONTACT.email}.`,
      [],
      'miss',
    )
  }

  /* 4. Cache */
  const cached = answers.get(question)
  if (cached) {
    log('cache_hit', started, { topScore })
    return textResponse(cached.text, cached.sources, 'hit')
  }

  /* 5. Model */
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    log('disabled', started)
    return errorResponse(503, 'The assistant isn’t switched on yet. Meanwhile, the projects and case studies on this site have the details.')
  }
  if (!perInstance.check('all').allowed) {
    log('budget_exhausted', started)
    return errorResponse(429, `The assistant has reached today’s limit. Please try again tomorrow, or email Sidd at ${CONTACT.email}.`)
  }

  const chunks = hits.map(h => h.chunk)
  const sources: AskSource[] = chunks.map((c, i) => ({ n: i + 1, title: c.title, href: c.href }))

  let upstream: Response
  try {
    upstream = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        messages: buildMessages(question, chunks),
        temperature: 0.2,
        max_tokens: 350,
        stream: true,
      }),
      /* Stop generating (and spending quota) if the visitor closes the chat, or after the timeout. */
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)]),
    })
  } catch {
    log('upstream_error', started, { reason: 'unreachable' })
    return errorResponse(502, 'Couldn’t reach the AI service. Please try again in a moment.')
  }

  if (upstream.status === 429) {
    log('upstream_busy', started)
    return errorResponse(429, 'The AI service is busy right now (free-tier limit). Please try again in a minute.')
  }
  if (!upstream.ok || !upstream.body) {
    log('upstream_error', started, { status: upstream.status })
    return errorResponse(502, 'The AI service had a problem answering. Please try again in a moment.')
  }

  log('streamed', started, { topScore })
  const answer = upstream.body
    .pipeThrough(sseToText())
    .pipeThrough(recordAnswer(text => answers.set(question, { text, sources })))
  return textResponse(answer, sources, 'miss')
}
