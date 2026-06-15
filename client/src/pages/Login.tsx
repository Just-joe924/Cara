import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section-x flex min-h-[70vh] items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-[#e1e1e1] p-8 shadow-sm"
      >
        <h2 className="mb-2 text-3xl text-ink">Sign In</h2>
        <p className="mb-6 text-sm text-muted">Welcome back to Cara.</p>

        {error && (
          <p className="mb-4 rounded bg-[#fdecec] px-3 py-2 text-sm text-accent">{error}</p>
        )}

        <label className="mb-1 block text-sm font-semibold text-muted">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input mb-4"
          placeholder="you@example.com"
        />

        <label className="mb-1 block text-sm font-semibold text-muted">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input mb-6"
          placeholder="••••••••"
        />

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>

        <p className="mt-5 text-center text-sm text-muted">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary">
            Create one
          </Link>
        </p>
      </form>
    </section>
  )
}
