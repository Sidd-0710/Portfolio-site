/** Joins class names, skipping falsy entries: cx('btn', isOn && 'btn--on'). */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
