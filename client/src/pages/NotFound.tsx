import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="section-x flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-[64px] font-bold text-primary">404</h1>
      <h2 className="text-3xl text-ink">Page not found</h2>
      <p className="my-4 text-muted">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/">
        <button className="btn-primary">Back to Home</button>
      </Link>
    </section>
  )
}
