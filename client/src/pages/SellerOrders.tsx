import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listSellerOrders, updateItemStatus, type SellerOrder } from '../api/sellerOrders'

const STATUSES = ['processing', 'shipped', 'delivered', 'cancelled']

const statusColor: Record<string, string> = {
  processing: 'bg-[#fff2e5] text-[#b26a00]',
  shipped: 'bg-[#d1e8f2] text-[#0b6ba8]',
  delivered: 'bg-primary-soft text-primary',
  cancelled: 'bg-[#fdecec] text-accent',
}

export default function SellerOrders() {
  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listSellerOrders()
      .then((o) => active && setOrders(o))
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Failed to load orders'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  async function changeStatus(itemId: string, status: string) {
    // optimistic
    setOrders((prev) =>
      prev.map((o) => ({
        ...o,
        items: o.items.map((it) => (it.id === itemId ? { ...it, status } : it)),
      })),
    )
    try {
      await updateItemStatus(itemId, status)
    } catch {
      // reload on failure to resync
      setOrders(await listSellerOrders())
    }
  }

  if (loading) {
    return (
      <section className="section-x flex min-h-[50vh] items-center justify-center">
        <i className="fa-solid fa-spinner fa-spin text-3xl text-primary"></i>
      </section>
    )
  }

  return (
    <>
      <section className="page-banner bg-shop-header [background-position:top_25%_right_0]">
        <h2>Orders</h2>
        <p className="text-white">Fulfill orders for your products</p>
      </section>

      <section className="section-x">
        <div className="mb-6 flex items-center gap-4">
          <Link to="/seller" className="text-sm font-semibold text-primary">
            ← Back to products
          </Link>
        </div>

        {error && <p className="mb-4 rounded bg-[#fdecec] px-3 py-2 text-sm text-accent">{error}</p>}

        {orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-primary-border py-16 text-center">
            <i className="fa-solid fa-receipt mb-4 text-4xl text-primary-border"></i>
            <h4 className="mb-2 text-lg">No orders yet</h4>
            <p className="text-sm text-muted">Orders containing your products will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(({ order, items }) => {
              const ship = (order.shipping_address ?? {}) as Record<string, string>
              return (
                <div key={order.id} className="rounded-lg border border-[#e1e1e1] p-5">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[#f0f0f0] pb-3">
                    <div>
                      <p className="font-semibold text-ink">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-2">
                        {new Date(order.created_at).toLocaleDateString()} · Payment: {order.status}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted">
                      <p className="font-semibold text-ink">{ship.full_name ?? '—'}</p>
                      <p>{[ship.address, ship.city, ship.country].filter(Boolean).join(', ')}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {items.map((it) => (
                      <div key={it.id} className="flex flex-wrap items-center gap-3">
                        <img
                          src={it.image_url ?? 'https://placehold.co/48x48?text=No+Img'}
                          alt={it.name}
                          className="h-12 w-12 rounded object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ink">{it.name}</p>
                          <p className="text-xs text-muted-2">
                            Qty {it.quantity}
                            {it.size && ` · ${it.size}`} · ${it.price_at_purchase.toFixed(2)}
                          </p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[it.status] ?? ''}`}>
                          {it.status}
                        </span>
                        <select
                          value={it.status}
                          onChange={(e) => changeStatus(it.id, e.target.value)}
                          className="rounded border border-primary-border bg-white px-2 py-1.5 text-sm outline-none"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
