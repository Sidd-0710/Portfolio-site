import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Preview" description="A short description">
        <a href="#one">First link</a>
        <button type="button">Last button</button>
      </Modal>
    </>
  )
}

async function openModal() {
  const user = userEvent.setup()
  render(<Harness />)
  await user.click(screen.getByRole('button', { name: 'Open' }))
  return { user, dialog: screen.getByRole('dialog', { name: 'Preview' }) }
}

describe('Modal', () => {
  it('opens as a labelled, described dialog and locks page scroll', async () => {
    const { dialog } = await openModal()
    expect(dialog).toHaveAttribute('open')
    expect(dialog).toHaveAccessibleDescription('A short description')
    expect(document.documentElement).toHaveAttribute('data-scroll-locked')
  })

  it('keeps Tab inside the dialog in both directions', async () => {
    const { user } = await openModal()
    const close = screen.getByRole('button', { name: 'Close' })
    const last  = screen.getByRole('button', { name: 'Last button' })

    expect(close).toHaveFocus()        // first focusable, focused on open
    last.focus()
    await user.tab()
    expect(close).toHaveFocus()        // wrapped forward
    await user.tab({ shift: true })
    expect(last).toHaveFocus()         // wrapped backward
  })

  it('closes on Escape, unlocks scroll and restores focus to the opener', async () => {
    const { user, dialog } = await openModal()
    await user.keyboard('{Escape}')
    expect(dialog).not.toHaveAttribute('open')
    expect(document.documentElement).not.toHaveAttribute('data-scroll-locked')
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus()
  })

  it('closes from the close button and from a backdrop click, not from inside clicks', async () => {
    const { user, dialog } = await openModal()
    await user.click(screen.getByText('A short description'))
    expect(dialog).toHaveAttribute('open')

    await user.click(dialog)           // target is the <dialog> itself = backdrop
    expect(dialog).not.toHaveAttribute('open')

    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(dialog).not.toHaveAttribute('open')
  })
})
