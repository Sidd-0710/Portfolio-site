'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useInView, useMediaQuery } from '@/lib/hooks'

/* Three.js isn't SSR-safe, so the network loads in the browser only. The
   panel is complete without it (an empty deep-blue frame), and it renders
   nothing if WebGL fails. */
const NeuralNet = dynamic(() => import('@/components/3d/NeuralNet'), {
  ssr: false,
  loading: () => null,
})

/**
 * The interactive skills-and-projects network, framed in a deep-blue panel
 * beside the Skills heading. Desktop only: gating on the media query (not CSS
 * `hidden`) means phones never download three.js or start a WebGL context.
 */
export function SkillsNetwork() {
  const [panel, setPanel] = useState<HTMLDivElement | null>(null)
  const inView = useInView(panel)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return (
    <div ref={setPanel} aria-hidden="true" className="skills-net on-inverse">
      {isDesktop && (
        <ErrorBoundary fallback={null}>
          <NeuralNet active={inView} />
        </ErrorBoundary>
      )}
    </div>
  )
}
