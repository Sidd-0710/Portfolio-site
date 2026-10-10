import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from './Input'

describe('Input', () => {
  it('is labelled by its label, even when the label is visually hidden', () => {
    render(<Input label="Your question" hideLabel />)
    const input = screen.getByRole('textbox', { name: 'Your question' })
    expect(screen.getByText('Your question')).toHaveClass('sr-only')
    expect(input).not.toHaveAttribute('aria-invalid')
  })

  it('links the hint for screen readers', () => {
    render(<Input label="Email" hint="We reply within a day" />)
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription('We reply within a day')
  })

  it('marks errors invalid and announces them with the field', () => {
    render(<Input label="Email" hint="Work email" error="Enter a valid email" aria-describedby="extra" />)
    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    const ids = input.getAttribute('aria-describedby')?.split(' ')
    expect(ids?.[0]).toBe('extra')
    expect(ids).toHaveLength(3)
    expect(input).toHaveAccessibleDescription(expect.stringContaining('Enter a valid email'))
  })
})
