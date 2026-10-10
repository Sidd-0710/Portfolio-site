'use client'

import { useActiveSection } from '@/lib/hooks'

export interface TocItem {
  id: string
  label: string
}

/** "On this page" list for a case study; the section being read is marked with aria-current. */
export function Toc({ items }: { items: readonly TocItem[] }) {
  const current = useActiveSection(items.map(i => i.id), { rootMargin: '-20% 0px -70% 0px' }) ?? items[0]?.id

  return (
    <nav aria-label="On this page" className="cs-toc">
      <p className="eyebrow mb-4">On this page</p>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            <a href={`#${item.id}`} aria-current={current === item.id ? 'location' : undefined}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
