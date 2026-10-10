'use client'

import { useEffect, useId, useRef, type KeyboardEvent, type MouseEvent, type ReactNode, type SyntheticEvent } from 'react'
import { cx } from '@/lib/cx'
import { Button } from './Button'
import { CloseIcon } from './icons'

export type ModalSize = 'sm' | 'md' | 'lg'

export interface ModalProps {
  open: boolean
  /** Called on Escape, backdrop click and the close button. The parent owns `open`. */
  onClose: () => void
  /** Labels the dialog (aria-labelledby). Required even when hidden. */
  title: string
  hideTitle?: boolean
  description?: string
  /** sm 384px · md 512px · lg 704px wide (capped at viewport − 32px) */
  size?: ModalSize
  /** center: classic dialog · top: sheet under the navbar (mobile menu) */
  placement?: 'center' | 'top'
  closeLabel?: string
  id?: string
  className?: string
  children: ReactNode
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Accessible modal on the native <dialog> element: the page behind is inert
 * while open (showModal), Tab is kept inside, Escape and backdrop clicks
 * close it, the page doesn't scroll behind it, and focus returns to whatever
 * opened it. Entry/exit animate in CSS (see .modal in components.css).
 */
export function Modal({
  open,
  onClose,
  title,
  hideTitle = false,
  description,
  size = 'md',
  placement = 'center',
  closeLabel = 'Close',
  id,
  className,
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog || !open) return

    const returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!dialog.open) dialog.showModal()
    const root = document.documentElement
    root.dataset.scrollLocked = ''

    return () => {
      if (dialog.open) dialog.close()
      delete root.dataset.scrollLocked
      returnFocusTo?.focus()
    }
  }, [open])

  /* Escape is handled here (not via the native default) so closing always
     goes through the parent's state. Tab wraps between first and last
     focusable elements; showModal already makes the rest of the page inert. */
  function onKeyDown(e: KeyboardEvent<HTMLDialogElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    const focusables = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE))
    const first = focusables.at(0)
    const last  = focusables.at(-1)
    if (!first || !last) {
      e.preventDefault()
      return
    }
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  /* Other "cancel" paths (e.g. Android back gesture) */
  function onCancel(e: SyntheticEvent<HTMLDialogElement>) {
    e.preventDefault()
    onClose()
  }

  /* The panel fills the dialog, so a click whose target is the dialog
     itself landed on the backdrop. */
  function onClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <dialog
      ref={ref}
      id={id}
      className={cx('modal', `modal--${size}`, placement === 'top' && 'modal--top', className)}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onKeyDown={onKeyDown}
      onCancel={onCancel}
      onClick={onClick}
    >
      <div className="modal__panel">
        <div className="modal__header">
          <div>
            <h2 id={titleId} className={cx('modal__title', hideTitle && 'sr-only')}>{title}</h2>
            {description && <p id={descriptionId} className="modal__description">{description}</p>}
          </div>
          <Button variant="ghost" size="sm" iconOnly aria-label={closeLabel} onClick={onClose}>
            <CloseIcon />
          </Button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </dialog>
  )
}
