/**
 * Turns an OpenAI-compatible server-sent-event stream (what Groq returns
 * with `stream: true`) into a plain stream of the answer's text, so the
 * browser only has to append chunks. Lines can arrive split across network
 * chunks, so partial lines are buffered until their newline arrives.
 */
export function sseToText(): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''

  const emit = (line: string, controller: TransformStreamDefaultController<Uint8Array>) => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) return            // comments, keep-alives, blank lines
    const data = trimmed.slice('data:'.length).trim()
    if (data === '[DONE]') return
    const text = deltaText(data)
    if (text) controller.enqueue(encoder.encode(text))
  }

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) emit(line, controller)
    },
    flush(controller) {
      buffer += decoder.decode()
      if (buffer) emit(buffer, controller)
    },
  })
}

/** Pulls `choices[0].delta.content` out of one event's JSON, or '' if absent or malformed. */
function deltaText(json: string): string {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return ''
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.choices)) return ''
  const first: unknown = parsed.choices[0]
  if (!isRecord(first) || !isRecord(first.delta)) return ''
  return typeof first.delta.content === 'string' ? first.delta.content : ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
