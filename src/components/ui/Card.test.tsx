import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Card } from './Card'
import { FINE_POINTER_QUERY, REDUCED_MOTION_QUERY } from '@/lib/hooks'
import { stubMatchMedia } from '@/test/matchMedia'

/** Answers the two queries the tilt hook asks about. */
function mockPointer({ fine, reduceMotion }: { fine: boolean; reduceMotion: boolean }) {
  stubMatchMedia(query =>
    query === FINE_POINTER_QUERY ? fine : query === REDUCED_MOTION_QUERY ? reduceMotion : false,
  )
}

function renderTiltCard() {
  render(<Card tilt data-testid="card">Content</Card>)
  const card = screen.getByTestId('card')
  vi.spyOn(card, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect({ x: 0, y: 0, width: 200, height: 100 }))
  return card
}

async function movePointer(card: HTMLElement, clientX: number, clientY: number) {
  fireEvent.pointerMove(card, { clientX, clientY })
  await act(() => new Promise(requestAnimationFrame))   // updates are rAF-batched
}

afterEach(() => vi.restoreAllMocks())

describe('Card', () => {
  it('maps variant, padding and element props to the system classes', () => {
    render(<Card as="article" variant="glass" padding="lg" aria-label="Project">x</Card>)
    const card = screen.getByRole('article', { name: 'Project' })
    expect(card).toHaveClass('card', 'card--glass', 'card--pad-lg')
    expect(card).not.toHaveClass('card--interactive')
  })

  it('applies inverse tokens to inverse cards', () => {
    render(<Card variant="inverse" data-testid="card">x</Card>)
    expect(screen.getByTestId('card')).toHaveClass('card--inverse', 'on-inverse')
  })

  it('tilts toward a mouse pointer and resets when it leaves', async () => {
    mockPointer({ fine: true, reduceMotion: false })
    const card = renderTiltCard()
    expect(card).toHaveClass('card--interactive')

    await movePointer(card, 200, 0)    // top-right corner
    expect(card.style.getPropertyValue('--px')).toBe('1.000')
    expect(card.style.getPropertyValue('--py')).toBe('-1.000')
    expect(card.style.getPropertyValue('--mx')).toBe('100.0%')
    expect(card).toHaveAttribute('data-tilt-active')

    fireEvent.pointerLeave(card)
    expect(card.style.getPropertyValue('--px')).toBe('0')
    expect(card).not.toHaveAttribute('data-tilt-active')
  })

  it('tilts full-width cards at the subtle angle', async () => {
    mockPointer({ fine: true, reduceMotion: false })
    render(<Card tilt="subtle" data-testid="wide">Wide</Card>)
    const card = screen.getByTestId('wide')
    expect(card).toHaveClass('card--interactive', 'card--tilt-subtle')
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect({ x: 0, y: 0, width: 400, height: 100 }))
    await movePointer(card, 400, 50)
    expect(card.style.getPropertyValue('--px')).toBe('1.000')   // same pointer math; CSS scales the angle
  })

  it('keeps the sheen but never tilts with reduced motion', async () => {
    mockPointer({ fine: true, reduceMotion: true })
    const card = renderTiltCard()
    await movePointer(card, 50, 50)
    expect(card.style.getPropertyValue('--mx')).toBe('25.0%')
    expect(card.style.getPropertyValue('--px')).toBe('')
  })

  it('does nothing for touch (no fine pointer)', async () => {
    mockPointer({ fine: false, reduceMotion: false })
    const card = renderTiltCard()
    await movePointer(card, 50, 50)
    expect(card.style.getPropertyValue('--mx')).toBe('')
  })
})
