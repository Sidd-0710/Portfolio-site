/**
 * Site footer. `'use cache'` is required for `new Date()` under Cache
 * Components: without it `next build` fails with "encountered the unstable
 * value `new Date()` while prerendering". The year is fixed at build or
 * revalidation time, which is fine for a copyright line.
 */
export default async function Footer() {
  'use cache'
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border-subtle">
      <p className="container-site py-8 text-center font-mono text-xs text-fg-subtle">
        Built by Sidd · {year}
      </p>
    </footer>
  )
}
