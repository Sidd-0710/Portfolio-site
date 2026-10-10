'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowRightIcon } from '@/components/ui/icons'
import { MAX_QUESTION_LENGTH } from '@/lib/ask/prompt'
import { SOURCES_HEADER, type AskSource } from '@/lib/ask/types'

export const SUGGESTIONS: readonly string[] = [
  'What has Sidd built with LLMs?',
  'How accurate is AutoValue?',
  'How does Seatly estimate wait times?',
  'Is he open to remote work?',
]

interface Turn {
  id: number
  question: string
  answer: string
  sources: AskSource[]
  status: 'streaming' | 'done' | 'error'
}

/** Reads the sources header; tolerates a missing or malformed value. */
function parseSources(header: string | null): AskSource[] {
  if (!header) return []
  try {
    const value: unknown = JSON.parse(decodeURIComponent(header))
    return Array.isArray(value)
      ? value.filter((s): s is AskSource =>
          typeof s === 'object' && s !== null &&
          typeof s.n === 'number' && typeof s.title === 'string' && typeof s.href === 'string')
      : []
  } catch {
    return []
  }
}

/** Pulls `{ error }` out of a failed response, with a fallback message. */
async function errorMessage(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json()
    if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') return body.error
  } catch {
    /* not JSON */
  }
  return 'Something went wrong. Please try again.'
}

interface AskPanelProps {
  /** Called when a source link is followed, so the dialog can close first. */
  onNavigate?: () => void
}

/**
 * The "Ask about my work" conversation. Each question is answered on its own
 * (no chat memory), streamed into the transcript as it arrives, with the
 * passages it came from listed underneath. Screen readers hear each answer
 * once, complete, via a separate live region (not token by token).
 */
export function AskPanel({ onNavigate }: AskPanelProps) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const nextId = useRef(0)
  const busy = turns.some(t => t.status === 'streaming')

  /* Cancel an in-flight answer if the dialog closes. */
  useEffect(() => () => abortRef.current?.abort(), [])

  /* Keep the newest text in view while it streams. */
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [turns])

  const update = (id: number, patch: (t: Turn) => Partial<Turn>) =>
    setTurns(all => all.map(t => (t.id === id ? { ...t, ...patch(t) } : t)))

  async function ask(raw: string) {
    const question = raw.trim()
    if (!question || busy) return
    const id = nextId.current++
    setDraft('')
    setAnnouncement('')
    setTurns(all => [...all, { id, question, answer: '', sources: [], status: 'streaming' }])

    const controller = new AbortController()
    abortRef.current = controller
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) {
        const message = await errorMessage(res)
        update(id, () => ({ answer: message, status: 'error' }))
        setAnnouncement(message)
        return
      }

      update(id, () => ({ sources: parseSources(res.headers.get(SOURCES_HEADER)) }))
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        full += text
        update(id, t => ({ answer: t.answer + text }))
      }
      update(id, () => ({ status: 'done' }))
      setAnnouncement(full)
    } catch (err) {
      if (controller.signal.aborted) return
      const message = 'Couldn’t reach the assistant. Check your connection and try again.'
      update(id, () => ({ answer: message, status: 'error' }))
      setAnnouncement(message)
      if (process.env.NODE_ENV !== 'production') console.error(err)
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    void ask(draft)
  }

  return (
    <div className="ask">
      {turns.length === 0 ? (
        <div className="grid gap-4">
          <p className="text-sm text-fg-muted">
            Ask about Sidd’s projects, skills, experience or availability. Answers come only from this site’s content, with links to the sources.
          </p>
          <ul aria-label="Suggested questions" className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <li key={s}>
                <button type="button" className="ask__suggestion" onClick={() => void ask(s)}>{s}</button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ol className="ask__log" aria-label="Conversation">
          {turns.map(turn => (
            <li key={turn.id} className="ask__turn">
              <p className="ask__question"><span className="sr-only">You asked: </span>{turn.question}</p>
              <div className="ask__answer" data-status={turn.status} aria-busy={turn.status === 'streaming'}>
                <span className="sr-only">Answer: </span>
                {turn.answer
                  ? <p className="whitespace-pre-wrap">{turn.answer}</p>
                  : <span className="ask__typing" aria-label="Thinking"><i /><i /><i /></span>}
                {turn.status === 'done' && turn.sources.length > 0 && (
                  <ol className="ask__sources" aria-label="Sources">
                    {turn.sources.map(s => (
                      <li key={s.n}>
                        <a href={s.href} onClick={onNavigate}>
                          <span className="ask__source-n">{s.n}</span>{s.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      <div ref={endRef} />

      <p aria-live="polite" className="sr-only">{announcement}</p>

      <form onSubmit={onSubmit} className="ask__form">
        <Input
          label="Your question"
          hideLabel
          placeholder="Ask about Sidd’s work…"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          maxLength={MAX_QUESTION_LENGTH}
          autoComplete="off"
          className="flex-1"
        />
        <Button type="submit" loading={busy} disabled={!draft.trim()} trailingIcon={<ArrowRightIcon size={16} />}>
          Ask
        </Button>
      </form>
      <p className="mt-2 text-xs text-fg-subtle">
        Answered by an AI model (via Groq) from this site’s content; it can make mistakes. Nothing you ask is stored here.
      </p>
    </div>
  )
}
