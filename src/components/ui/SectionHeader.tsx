import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Reveal } from './Reveal'

interface SectionHeaderProps {
  /** Short mono label above the title, e.g. "Projects". */
  eyebrow: string
  /** Position on the page, shown as "// 01." before the label (decorative, hidden from screen readers). */
  index?: number
  title: string
  /** Id for the h2; pass the same value to the section's aria-labelledby. */
  titleId: string
  lead?: ReactNode
  className?: string
}

/** The one heading pattern every section uses: "// 01. Label" eyebrow, serif title, optional lead. */
export function SectionHeader({ eyebrow, index, title, titleId, lead, className }: SectionHeaderProps) {
  return (
    <Reveal as="header" className={cx('mb-10 md:mb-14 grid gap-4', className)}>
      <p className="eyebrow">
        {index !== undefined && <span aria-hidden="true" className="eyebrow__index">{String(index).padStart(2, '0')}.</span>}
        {eyebrow}
      </p>
      <h2 id={titleId} className="section-title">{title}</h2>
      {lead && <p className="lead">{lead}</p>}
    </Reveal>
  )
}
