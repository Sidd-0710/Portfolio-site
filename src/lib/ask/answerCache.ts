import type { AskSource } from './types'

export interface CachedAnswer {
  text: string
  sources: readonly AskSource[]
}

/**
 * In-memory LRU of finished answers, keyed by the normalised question. Most
 * visitors click the same suggested questions, so repeats are answered
 * instantly and cost no model call. Per instance, like the rate limiter; the
 * site's content is fixed per deploy, so a cached answer can't go stale
 * except by age.
 */
export interface AnswerCache {
  get(question: string, now?: number): CachedAnswer | undefined
  set(question: string, answer: CachedAnswer, now?: number): void
}

/** "  How accurate is AutoValue??" and "how accurate is autovalue" share one entry. */
export function normaliseQuestion(question: string): string {
  return question.toLowerCase().replace(/\s+/g, ' ').replace(/[\s?!.]+$/, '').trim()
}

export function createAnswerCache({ max, ttlMs }: { max: number; ttlMs: number }): AnswerCache {
  const entries = new Map<string, { answer: CachedAnswer; expires: number }>()

  return {
    get(question, now = Date.now()) {
      const key = normaliseQuestion(question)
      const entry = entries.get(key)
      if (!entry) return undefined
      if (entry.expires <= now) {
        entries.delete(key)
        return undefined
      }
      /* Re-insert so Map order tracks recency (oldest first). */
      entries.delete(key)
      entries.set(key, entry)
      return entry.answer
    },
    set(question, answer, now = Date.now()) {
      const key = normaliseQuestion(question)
      entries.delete(key)
      entries.set(key, { answer, expires: now + ttlMs })
      if (entries.size > max) {
        const oldest = entries.keys().next()
        if (!oldest.done) entries.delete(oldest.value)
      }
    },
  }
}

/**
 * Passes the answer stream through unchanged and, once it has finished,
 * hands the full text to `onComplete`. An aborted stream never flushes, so a
 * half-read answer is never cached.
 */
export function recordAnswer(onComplete: (text: string) => void): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder()
  let text = ''
  return new TransformStream({
    transform(chunk, controller) {
      text += decoder.decode(chunk, { stream: true })
      controller.enqueue(chunk)
    },
    flush() {
      text += decoder.decode()
      if (text.trim()) onComplete(text)
    },
  })
}
