import { Fragment, useEffect, useState } from 'react'
import { fetchOrders, type AdminOrder } from '../../api/admin'
import { formatNaira as money } from '../../lib/money'

const statusBadge: Record<string, string> = {
  pending: 'bg-[#fff2e5] text-[#b26a00]',
  paid: 'bg-[#e9f9ef] text-[#059669]',
  shipped: 'bg-[#d1e8f2] text-[#0b6ba8]',
  delivered: 'bg-primary-soft text-primary',
  cancelled: 'bg-[#fdecec] text-accent',
}

export default function Orders() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchOrders()
      .then((o) => active && setOrders(o))
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Failed to load orders'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-ink">Orders <span className="text-sm font-normal text-muted">({orders.length})</span></h2>

      {error && <p className="rounded bg-[#fdecec] px-3 py-2 text-sm text-accent">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-[#e6eaf0] bg-white">
        {loading ? (
          <div className="flex justify-center py-16">
            <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
          </div>
        ) : orders.length === 0 ? (
          <p className="px-4 py-10 text-center text-muted">No orders yet.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#e6eaf0] text-left text-xs font-bold uppercase text-muted">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const ship = (o.shipping_address ?? {}) as Record<string, string>
                const isOpen = open === o.id
                return (
                  <Fragment key={o.id}>
                    <tr
                      onClick={() => setOpen(isOpen ? null : o.id)}
                      className="cursor-pointer border-b border-[#f0f2f5] hover:bg-[#fafbfc] last:border-0"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-2">#{o.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-ink">{ship.full_name ?? '—'}</td>
                      <td className="px-4 py-3 text-muted">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-ink">{o.order_items?.length ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusBadge[o.status] ?? 'bg-[#eef1f5] text-muted'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-ink">{money(o.total_amount)}</td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-[#fafbfc]">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="space-y-1.5">
                            {(o.order_items ?? []).map((it) => (
                              <div key={it.id} className="flex justify-between text-xs text-muted">
                                <span>
                                  {it.products?.name ?? 'Product'} × {it.quantity}
                                  {it.size ? ` · ${it.size}` : ''}
                                  <span className="ml-2 capitalize text-muted-2">({it.status})</span>
                                </span>
                                <span className="text-ink">{money(it.price_at_purchase * it.quantity)}</span>
                              </div>
                            ))}
                            {[ship.address, ship.city, ship.country].filter(Boolean).length > 0 && (
                              <p className="pt-1 text-xs text-muted-2">
                                Ship to: {[ship.address, ship.city, ship.country].filter(Boolean).join(', ')}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
