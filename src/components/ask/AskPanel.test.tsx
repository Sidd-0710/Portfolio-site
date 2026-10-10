import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SOURCES_HEADER } from '@/lib/ask/types'
import { AskPanel, SUGGESTIONS } from './AskPanel'

/** A streamed text response like /api/ask's, delivered in two chunks. */
function streamed(parts: string[], sources: unknown) {
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const p of parts) controller.enqueue(encoder.encode(p))
      controller.close()
    },
  })
  return new Response(body, { headers: { [SOURCES_HEADER]: encodeURIComponent(JSON.stringify(sources)) } })
}

afterEach(() => vi.unstubAllGlobals())

describe('AskPanel', () => {
  it('offers suggested questions before the first question', () => {
    render(<AskPanel />)
    const list = screen.getByRole('list', { name: 'Suggested questions' })
    expect(within(list).getAllByRole('button').map(b => b.textContent)).toEqual([...SUGGESTIONS])
  })

  it('asks a suggestion, streams the answer and links its sources', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      streamed(['Sidd built ', 'Signal [1].'], [{ n: 1, title: 'Project: Signal', href: '/#project-signal' }]),
    )
    vi.stubGlobal('fetch', fetchSpy)
    const onNavigate = vi.fn()
    render(<AskPanel onNavigate={onNavigate} />)

    await userEvent.click(screen.getByRole('button', { name: SUGGESTIONS[0] }))

    const log = await screen.findByRole('list', { name: 'Conversation' })
    expect(await within(log).findByText('Sidd built Signal [1].')).toBeInTheDocument()
    // Screen readers get the finished answer once, via the live region
    await waitFor(() => expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Sidd built Signal [1].'))
    const sources = await screen.findByRole('list', { name: 'Sources' })
    const link = within(sources).getByRole('link', { name: /Project: Signal/ })
    expect(link).toHaveAttribute('href', '/#project-signal')
    expect(JSON.parse(String((fetchSpy.mock.calls[0] as [string, RequestInit])[1].body))).toEqual({ question: SUGGESTIONS[0] })

    await userEvent.click(link)
    expect(onNavigate).toHaveBeenCalled()
  })

  it('sends a typed question and shows the server’s error message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      Response.json({ error: 'The assistant isn’t switched on yet.' }, { status: 503 }),
    ))
    render(<AskPanel />)

    const input = screen.getByRole('textbox', { name: 'Your question' })
    const submit = screen.getByRole('button', { name: 'Ask' })
    expect(submit).toBeDisabled()                       // nothing typed yet
    await userEvent.type(input, 'Is he open to remote work?')
    await userEvent.click(submit)

    const log = await screen.findByRole('list', { name: 'Conversation' })
    expect(await within(log).findByText('The assistant isn’t switched on yet.')).toBeInTheDocument()
    await waitFor(() => expect(input).toHaveValue(''))
  })
})
