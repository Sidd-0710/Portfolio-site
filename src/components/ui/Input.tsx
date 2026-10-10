import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react'
import { cx } from '@/lib/cx'
import { AlertIcon } from './icons'

export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Always required: the field's accessible name. Use `hideLabel` to hide it visually. */
  label: string
  hideLabel?: boolean
  /** Helper text under the field (linked with aria-describedby). */
  hint?: string
  /** Error message; marks the field aria-invalid and is announced with it. */
  error?: string
  /** sm 36px · md 44px · lg 52px tall */
  size?: InputSize
  leadingIcon?: ReactNode
  ref?: Ref<HTMLInputElement>
}

/**
 * Labelled text input. A sunken well (inset shadow) where cards are raised,
 * so "you type here" reads at a glance. Not used on the site yet: it's
 * ready for the v2 "Ask about my work" chat.
 */
export function Input({
  label,
  hideLabel = false,
  hint,
  error,
  size = 'md',
  leadingIcon,
  id,
  className,
  'aria-describedby': describedByProp,
  ...rest
}: InputProps) {
  const autoId  = useId()
  const inputId = id ?? autoId
  const hintId  = hint  ? `${inputId}-hint`  : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy = [describedByProp, hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cx('field', className)}>
      <label htmlFor={inputId} className={cx('field__label', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div className="field__control">
        {leadingIcon && <span className="field__icon">{leadingIcon}</span>}
        <input
          id={inputId}
          className={cx('input', `input--${size}`, Boolean(leadingIcon) && 'input--with-icon')}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
      </div>
      {hint && <p id={hintId} className="field__hint">{hint}</p>}
      {error && (
        <p id={errorId} className="field__error">
          <AlertIcon size={14} />
          {error}
        </p>
      )}
    </div>
  )
}
