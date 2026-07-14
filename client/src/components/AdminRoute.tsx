import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Guards the admin area. Renders children only for a signed-in user whose
 * profile role is `admin`; everyone else is bounced to the (unlinked) admin
 * login. This is defence-in-depth on top of the server's `requireAdmin` — the
 * URL being hard to guess is not what keeps the dashboard secure.
 */
export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()

  // Wait until auth + the profile row (which carries the role) have resolved.
  if (loading || (user && !profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1720]">
        <i className="fa-solid fa-spinner fa-spin text-3xl text-primary"></i>
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return <Navigate to="/admin-login" replace />
  }

  return <>{children}</>
}
