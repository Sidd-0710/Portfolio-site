import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from '@/lib/cx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'glass'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonOwnProps {
  /** primary: tactile accent fill · secondary: raised surface · ghost: text only · glass: frosted, for busy or dark backdrops */
  variant?: ButtonVariant
  /** sm 36px · md 44px · lg 52px tall */
  size?: ButtonSize
  leadingIcon?: ReactNode
  /** Nudges right on hover; use for arrows. */
  trailingIcon?: ReactNode
  /** Shows a spinner, disables the control and sets aria-busy. */
  loading?: boolean
  /** Stretch to the container width. */
  block?: boolean
  className?: string
  children?: ReactNode
}

/** An icon-only button has no visible text, so it must have an aria-label. */
type IconOnlyProps =
  | { iconOnly: true; 'aria-label': string }
  | { iconOnly?: false }

type NativeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps>
type NativeAnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonOwnProps>

export type ButtonAsButton = ButtonOwnProps & IconOnlyProps & NativeButtonProps & {
  href?: undefined
  ref?: Ref<HTMLButtonElement>
}

export type ButtonAsLink = ButtonOwnProps & IconOnlyProps & NativeAnchorProps & {
  /**
   * Renders an <a>. Root-relative page routes use next/link; links with a
   * #hash, downloads and external URLs stay native anchors.
   */
  href: string
  ref?: Ref<HTMLAnchorElement>
}

export type ButtonProps = ButtonAsButton | ButtonAsLink

function isLink(props: ButtonProps): props is ButtonAsLink {
  return typeof props.href === 'string'
}

/** Splits the design-system props from the native ones. */
function splitProps<P extends ButtonOwnProps & { iconOnly?: boolean }>(props: P) {
  const {
    variant = 'primary',
    size = 'md',
    leadingIcon,
    trailingIcon,
    loading = false,
    block = false,
    iconOnly = false,
    className,
    children,
    ...rest
  } = props

  return {
    rest,
    loading,
    className: cx(
      'btn',
      `btn--${variant}`,
      `btn--${size}`,
      iconOnly && 'btn--icon',
      block && 'btn--block',
      className,
    ),
    content: (
      <>
        {loading ? <span className="btn__spinner" aria-hidden="true" /> : leadingIcon}
        {children !== undefined && <span className="btn__label">{children}</span>}
        {!loading && trailingIcon && <span className="btn__trail inline-flex">{trailingIcon}</span>}
      </>
    ),
  }
}

/**
 * The one button for the site. Renders a <button>, or a link when `href` is
 * set, with identical styling, so a "button" that navigates is still a link
 * to assistive tech.
 */
export function Button(props: ButtonProps) {
  if (isLink(props)) {
    const { rest, loading, className, content } = splitProps(props)
    const { href, ...anchorProps } = rest
    /* next/link skips navigation when the URL is unchanged, so a section link
       clicked a second time (URL already ends in #projects) did nothing. Native
       anchors always scroll to the fragment, honouring scroll-padding. */
    const internal = href.startsWith('/') && !href.includes('#') && anchorProps.download === undefined
    const common = {
      ...anchorProps,
      className,
      'aria-disabled': loading || undefined,
      'aria-busy': loading || undefined,
    }
    return internal
      ? <Link href={href} {...common}>{content}</Link>
      : <a href={href} {...common}>{content}</a>
  }

  const { rest, loading, className, content } = splitProps(props)
  const { type = 'button', disabled, ...buttonProps } = rest
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={className}
      {...buttonProps}
    >
      {content}
    </button>
  )
}
