import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchOrders } from '../api/orders'
import type { Order } from '../types'

const statusColor: Record<string, string> = {
  pending: 'bg-[#fff2e5] text-[#b26a00]',
  paid: 'bg-primary-soft text-primary',
  shipped: 'bg-[#d1e8f2] text-[#1d6f8b]',
  delivered: 'bg-[#cdebbc] text-[#3d7a1f]',
  cancelled: 'bg-[#fdecec] text-accent',
}

export default function Account() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let active = true
    fetchOrders(user.id)
      .then((data) => active && setOrders(data))
      .catch((err) => console.error('Failed to load orders:', err))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <>
      <section className="page-banner bg-about-header [background-position:top_25%_right_0]">
        <h2>My Account</h2>
        <p className="text-white">Manage your profile and track your orders</p>
      </section>

      <section className="section-x grid grid-cols-1 gap-8 lg:grid-cols-3">
        <aside className="rounded-lg border border-[#e1e1e1] p-6">
          <h3 className="mb-4 text-lg font-semibold">Profile</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-2">Name</dt>
              <dd className="font-semibold text-ink">{profile?.full_name || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-2">Email</dt>
              <dd className="font-semibold text-ink">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-muted-2">Member since</dt>
              <dd className="font-semibold text-ink">
                {profile ? new Date(profile.created_at).toLocaleDateString() : '—'}
              </dd>
            </div>
          </dl>
          <button
            onClick={handleSignOut}
            className="btn-normal mt-6 w-full border border-primary-border hover:bg-primary hover:text-white"
          >
            Sign Out
          </button>
        </aside>

        <div className="lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold">Order History</h3>
          {loading ? (
            <p className="text-muted">Loading orders…</p>
          ) : orders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#e1e1e1] p-10 text-center">
              <i className="fa-solid fa-box-open mb-3 text-4xl text-primary-border"></i>
              <p className="text-muted">You haven't placed any orders yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="rounded-lg border border-[#e1e1e1] p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-bold text-ink">#{order.id.slice(0, 8)}</span>
                      <span className="ml-3 text-xs text-muted-2">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        statusColor[order.status] ?? 'bg-header text-ink'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <ul className="mb-3 divide-y divide-[#f0f0f0]">
                    {(order.order_items ?? []).map((item) => (
                      <li key={item.id} className="flex items-center gap-3 py-2">
                        {item.products?.image_url && (
                          <img
                            src={item.products.image_url}
                            alt={item.products.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        )}
                        <span className="flex-1 text-sm">{item.products?.name ?? 'Product'}</span>
                        <span className="text-xs text-muted-2">×{item.quantity}</span>
                        <span className="text-sm font-semibold text-primary">
                          ${item.price_at_purchase.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="text-right text-sm font-bold text-ink">
                    Total: ${order.total_amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
