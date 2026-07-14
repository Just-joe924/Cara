import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

/**
 * Standalone admin sign-in, reachable only by typing /admin-login (never linked
 * from the storefront). After authenticating it verifies the account's role and
 * refuses non-admins — obscurity gets you to the door, the role check opens it.
 */
export default function AdminLogin() {
  const { signIn, signOut } = useAuth()
  const navigate = useNavigate()

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
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id ?? '')
        .maybeSingle()

      if (prof?.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        await signOut()
        setError('This account does not have admin access.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1720] px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft">
            <i className="fa-solid fa-shield-halved text-xl text-primary"></i>
          </div>
          <h1 className="text-xl font-semibold text-ink">Cara Admin</h1>
          <p className="text-sm text-muted">Restricted access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-[#e1e1e1] px-[15px] py-3 text-sm outline-none focus:border-primary"
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-[#e1e1e1] px-[15px] py-3 text-sm outline-none focus:border-primary"
            autoComplete="current-password"
          />
          {error && <p className="rounded bg-[#fdecec] px-3 py-2 text-sm text-accent">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Verifying…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
