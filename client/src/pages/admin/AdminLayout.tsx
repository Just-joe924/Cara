import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/admin', end: true, icon: 'fa-chart-line', label: 'Overview' },
  { to: '/admin/users', end: false, icon: 'fa-users', label: 'Users' },
  { to: '/admin/products', end: false, icon: 'fa-box', label: 'Products' },
  { to: '/admin/orders', end: false, icon: 'fa-receipt', label: 'Orders' },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/admin-login', { replace: true })
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
      isActive ? 'bg-primary text-white' : 'text-[#aeb7c2] hover:bg-white/5 hover:text-white'
    }`

  return (
    <div className="min-h-screen bg-[#f5f7fa] md:flex">
      {/* Sidebar */}
      <aside className="flex flex-col bg-[#0f1720] md:min-h-screen md:w-64">
        <div className="flex items-center gap-2 px-5 py-5 text-white">
          <i className="fa-solid fa-shield-halved text-primary"></i>
          <span className="text-lg font-semibold">Cara Admin</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              <i className={`fa-solid ${item.icon} w-4 text-center`}></i>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 px-3 py-4 md:block">
          <p className="mb-2 px-3 text-xs text-[#6b7684]">
            {profile?.full_name || 'Administrator'}
          </p>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#aeb7c2] transition hover:bg-white/5 hover:text-white"
          >
            <i className="fa-solid fa-right-from-bracket w-4 text-center"></i>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1">
        <header className="flex items-center justify-between border-b border-[#e6eaf0] bg-white px-6 py-4">
          <h1 className="text-lg font-semibold text-ink">Dashboard</h1>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm font-medium text-primary hover:underline">
              View store ↗
            </a>
            <button
              onClick={handleSignOut}
              className="text-sm font-medium text-muted hover:text-accent md:hidden"
            >
              Sign out
            </button>
          </div>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
