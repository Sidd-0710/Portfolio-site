import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="container-site grid min-h-svh place-content-center justify-items-center gap-5 text-center">
      <p className="eyebrow">404</p>
      <h1 className="section-title text-display">Page not found</h1>
      <p className="lead">Looks like this page went offline. The rest of the site is still up.</p>
      <Button href="/" className="mt-3">Back home</Button>
    </main>
  )
}
