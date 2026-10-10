'use client'

import { createElement, useState, type ComponentPropsWithoutRef } from 'react'
import { cx } from '@/lib/cx'
import { usePointerDepth } from '@/lib/hooks'

export type CardVariant = 'elevated' | 'glass' | 'outline' | 'sunken' | 'inverse'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'
type CardElement = 'div' | 'article' | 'li' | 'section' | 'a'

interface CardOwnProps<E extends CardElement> {
  /** Element to render. Use 'a' (with href) for a fully clickable card. */
  as?: E
  /**
   * elevated: raised surface (default) · glass: frosted over busy backdrops ·
   * outline: flat, border only · sunken: inset well · inverse: dark panel with
   * signal glow (wrap content in `.on-inverse` tokens automatically)
   */
  variant?: CardVariant
  /** none 0 · sm 16px · md 20–24px · lg 24–36px (fluid) */
  padding?: CardPadding
  /** Lift + pointer-following sheen on hover; highlight when something inside has focus. */
  interactive?: boolean
  /**
   * Rotate toward the pointer (implies `interactive`). Mouse/trackpad only;
   * off for reduced motion. 'subtle' halves the angle for full-width cards,
   * whose edges would otherwise swing twice as far.
   */
  tilt?: boolean | 'subtle'
  className?: string
}

export type CardProps<E extends CardElement = 'div'> =
  CardOwnProps<E> & Omit<ComponentPropsWithoutRef<E>, keyof CardOwnProps<E>>

/** Surface container with the system's elevation, radius and optional 3D response. */
export function Card<E extends CardElement = 'div'>({
  as,
  variant = 'elevated',
  padding = 'md',
  interactive = false,
  tilt = false,
  className,
  ...rest
}: CardProps<E>) {
  const [node, setNode] = useState<HTMLElement | null>(null)
  const tiltOn = tilt !== false
  const isInteractive = interactive || tiltOn
  usePointerDepth(node, { tilt: tiltOn, spotlight: isInteractive })

  return createElement(as ?? 'div', {
    ...rest,
    ref: setNode,
    className: cx(
      'card',
      `card--${variant}`,
      `card--pad-${padding}`,
      isInteractive && 'card--interactive',
      tilt === 'subtle' && 'card--tilt-subtle',
      variant === 'inverse' && 'on-inverse',
      className,
    ),
  })
}
