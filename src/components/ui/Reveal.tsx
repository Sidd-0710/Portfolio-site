'use client'

import { createElement, useState, type ComponentPropsWithoutRef } from 'react'
import { cx } from '@/lib/cx'
import { useInView } from '@/lib/hooks'

type RevealElement = 'div' | 'li' | 'section' | 'header'

type RevealProps<E extends RevealElement> = {
  as?: E
  /** Stagger offset in ms, added to the token-driven reveal transition. */
  delay?: number
} & Omit<ComponentPropsWithoutRef<E>, 'as'>

/**
 * Fades and lifts its content in the first time it scrolls into view.
 * Pure CSS transition (.reveal); this component only flips a data attribute.
 * Reduced motion shortens it to an instant change via the motion tokens.
 */
export function Reveal<E extends RevealElement = 'div'>({ as, delay = 0, className, style, ...rest }: RevealProps<E>) {
  const [node, setNode] = useState<HTMLElement | null>(null)
  const revealed = useInView(node, { once: true, rootMargin: '0px 0px -8% 0px' })
  return createElement(as ?? 'div', {
    ...rest,
    ref: setNode,
    className: cx('reveal', className),
    'data-revealed': revealed || undefined,
    style: delay ? { ...style, '--reveal-delay': `${delay}ms` } : style,
  })
}
