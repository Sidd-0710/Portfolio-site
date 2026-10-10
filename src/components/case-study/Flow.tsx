import type { FlowStep } from '@/content/case-studies'

/**
 * Architecture as an ordered list of steps: one row on wide screens, a
 * vertical chain on phones. A real <ol>, so the order is announced too.
 */
export function Flow({ steps, label }: { steps: readonly FlowStep[]; label: string }) {
  /* Up to 5 steps fit one row; more wrap into two even rows (6 → 3 + 3). */
  const columns = steps.length <= 5 ? steps.length : Math.ceil(steps.length / 2)
  return (
    <ol className="flow" aria-label={label} data-cols={columns} style={{ '--flow-steps': columns }}>
      {steps.map(step => (
        <li key={step.title} className="flow__step">
          <p className="flow__title">{step.title}</p>
          <p className="flow__detail">{step.detail}</p>
        </li>
      ))}
    </ol>
  )
}
