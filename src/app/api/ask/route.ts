import { CONTACT } from '@/content/profile'
import { buildKnowledge } from '@/lib/ask/knowledge'
import { buildMessages, MAX_QUESTION_LENGTH } from '@/lib/ask/prompt'
import { createRateLimiter } from '@/lib/ask/rateLimit'
import { buildIndex, MIN_RELEVANCE } from '@/lib/ask/retrieve'
import { sseToText } from '@/lib/ask/stream'
import { SOURCES_HEADER, type AskSource } from '@/lib/ask/types'

/**
 * POST /api/ask  { question: string }
 *
 * Retrieval-augmented answer about Sidd's work:
 *   1. validate the question and rate-limit the visitor
 *   2. retrieve the most relevant passages of the site's own content (BM25)
 *   3. decline off-topic questions without calling the model
 *   4. stream an answer from Groq that may only use those passages
 *
 * Success: 200, text/plain body (streamed), sources in the X-Ask-Sources
 * header as URI-encoded JSON (AskSource[]). Failure: JSON { error } with a
 * message written for the visitor.
 *
 * Config (server-only env, set in .env.local or the host's dashboard):
 *   GROQ_API_KEY  required for answers; without it the route returns 503
 *   GROQ_MODEL    optional, defaults to DEFAULT_MODEL
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

/* Built once per server instance, not per request. */
const index = buildIndex(buildKnowledge())
/** 8 questions per visitor per 10 minutes. */
const perVisitor = createRateLimiter({ limit: 8, windowMs: 10 * 60_000 })
/** Daily cap per instance, kept well under Groq's free daily request limit. */
const perInstance = createRateLimiter({ limit: 300, windowMs: 24 * 60 * 60_000 })

const errorResponse = (status: number, error: string, headers?: HeadersInit) =>
  Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store', ...headers } })

const textResponse = (body: BodyInit, sources: readonly AskSource[]) =>
  new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      [SOURCES_HEADER]: encodeURIComponent(JSON.stringify(sources)),
    },
  })

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
  const question = await readQuestion(request)
  if (!question) return errorResponse(400, 'Please type a question.')
  if (question.length > MAX_QUESTION_LENGTH) {
    return errorResponse(400, `Please keep your question under ${MAX_QUESTION_LENGTH} characters.`)
  }

  const visitor = perVisitor.check(visitorKey(request))
  if (!visitor.allowed) {
    const minutes = Math.ceil(visitor.retryAfterSeconds / 60)
    return errorResponse(429, `That’s a lot of questions in a short time. Please try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`, {
      'Retry-After': String(visitor.retryAfterSeconds),
    })
  }

  const hits = index.search(question, 4)
  if ((hits[0]?.score ?? 0) < MIN_RELEVANCE) {
    return textResponse(
      `I can only answer questions about Sidd: his projects, skills, experience and availability. Try one of the suggested questions, or email him at ${CONTACT.email}.`,
      [],
    )
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return errorResponse(503, 'The assistant isn’t switched on yet. Meanwhile, the projects and case studies on this site have the details.')
  }
  if (!perInstance.check('all').allowed) {
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
      signal: AbortSignal.timeout(20_000),
    })
  } catch {
    return errorResponse(502, 'Couldn’t reach the AI service. Please try again in a moment.')
  }

  if (upstream.status === 429) return errorResponse(429, 'The AI service is busy right now (free-tier limit). Please try again in a minute.')
  if (!upstream.ok || !upstream.body) {
    console.error(`[api/ask] Groq responded ${upstream.status}`)
    return errorResponse(502, 'The AI service had a problem answering. Please try again in a moment.')
  }

  return textResponse(upstream.body.pipeThrough(sseToText()), sources)
}
