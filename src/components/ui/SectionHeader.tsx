import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Reveal } from './Reveal'

interface SectionHeaderProps {
  /** Short uppercase label above the title, e.g. "Projects". */
  eyebrow: string
  /** Position on the page, shown as "01" before the label (decorative, hidden from screen readers). */
  index?: number
  title: string
  /** The last occurrence of this text in the title is set in italic coral. */
  highlight?: string
  /** Id for the h2; pass the same value to the section's aria-labelledby. */
  titleId: string
  lead?: ReactNode
  className?: string
}

/** Splits `title` around the last `highlight`, so that word can be coloured. */
function splitHighlight(title: string, highlight?: string): [string, string, string] {
  const at = highlight ? title.lastIndexOf(highlight) : -1
  if (!highlight || at === -1) return [title, '', '']
  return [title.slice(0, at), highlight, title.slice(at + highlight.length)]
}

/** The one heading pattern every section uses: "—— 01 LABEL" eyebrow, serif title with one italic coral word, optional lead. */
export function SectionHeader({ eyebrow, index, title, highlight, titleId, lead, className }: SectionHeaderProps) {
  const [before, word, after] = splitHighlight(title, highlight)
  return (
    <Reveal as="header" className={cx('mb-10 md:mb-14 grid gap-4', className)}>
      <p className="eyebrow">
        {index !== undefined && <span aria-hidden="true" className="eyebrow__index">{String(index).padStart(2, '0')}</span>}
        {eyebrow}
      </p>
      <h2 id={titleId} className="section-title">
        {before}{word && <span className="title-accent">{word}</span>}{after}
      </h2>
      {lead && <p className="lead">{lead}</p>}
    </Reveal>
  )
}
