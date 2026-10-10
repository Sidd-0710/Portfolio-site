import Image from 'next/image'
import type { Shot as ShotData } from '@/content/case-studies'
import { cx } from '@/lib/cx'

/** Responsive widths next/image should generate for each frame type. */
const SIZES: Record<ShotData['frame'], string> = {
  desktop: '(min-width: 1024px) 860px, 100vw',
  phone:   '280px',
  figure:  '(min-width: 1024px) 860px, 100vw',
}

interface ShotProps {
  shot: ShotData
  /** Load immediately with high priority (the first screenshot on the page). */
  eager?: boolean
}

/** A screenshot or chart in the system's imagery frame, with a caption. */
export function Shot({ shot, eager = false }: ShotProps) {
  return (
    <figure className={cx('shot', `shot--${shot.frame}`)}>
      <div className="shot__frame">
        <Image
          src={shot.src}
          alt={shot.alt}
          width={shot.width}
          height={shot.height}
          sizes={SIZES[shot.frame]}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : undefined}
        />
      </div>
      <figcaption className="shot__caption">{shot.caption}</figcaption>
    </figure>
  )
}
