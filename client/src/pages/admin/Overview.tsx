import { useEffect, useState } from 'react'
import { fetchStats, type AdminStats } from '../../api/admin'
import { formatNaira as money } from '../../lib/money'

function Card({ icon, label, value, tint }: { icon: string; label: string; value: string; tint: string }) {
  return (
    <div className="rounded-xl border border-[#e6eaf0] bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}>
          <i className={`fa-solid ${icon}`}></i>
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
    </div>
  )
}

export default function Overview() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchStats()
      .then((s) => active && setStats(s))
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Failed to load'))
    return () => {
      active = false
    }
  }, [])

  if (error) return <p className="rounded bg-[#fdecec] px-3 py-2 text-sm text-accent">{error}</p>
  if (!stats) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
      </div>
    )
  }

  const maxRev = Math.max(1, ...stats.series.map((d) => d.revenue))

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card icon="fa-users" label="Users" value={String(stats.counts.users)} tint="bg-[#e7f0ff] text-[#2563eb]" />
        <Card icon="fa-store" label="Sellers" value={String(stats.counts.sellers)} tint="bg-primary-soft text-primary" />
        <Card icon="fa-box" label="Products" value={String(stats.counts.products)} tint="bg-[#fff2e5] text-[#b26a00]" />
        <Card icon="fa-naira-sign" label="Revenue" value={money(stats.revenue)} tint="bg-[#e9f9ef] text-[#059669]" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="rounded-xl border border-[#e6eaf0] bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Revenue — last 14 days</h2>
            <span className="text-sm text-muted">{stats.counts.orders} orders total</span>
          </div>
          <div className="flex h-48 items-end gap-1.5">
            {stats.series.map((d) => (
              <div key={d.date} className="group flex flex-1 flex-col items-center justify-end gap-1">
                <div className="relative w-full">
                  <div
                    className="w-full rounded-t bg-primary/80 transition group-hover:bg-primary"
                    style={{ height: `${Math.round((d.revenue / maxRev) * 160)}px` }}
                  ></div>
                  <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] text-white group-hover:block">
                    {money(d.revenue)}
                  </span>
                </div>
                <span className="text-[9px] text-muted-2">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Role breakdown + recent orders */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[#e6eaf0] bg-white p-5">
            <h2 className="mb-3 font-semibold text-ink">Users by role</h2>
            <ul className="space-y-2 text-sm">
              {(['admin', 'seller', 'customer'] as const).map((role) => (
                <li key={role} className="flex items-center justify-between">
                  <span className="capitalize text-muted">{role}</span>
                  <span className="font-semibold text-ink">{stats.usersByRole[role] ?? 0}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[#e6eaf0] bg-white p-5">
            <h2 className="mb-3 font-semibold text-ink">Recent orders</h2>
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-muted">No orders yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.recentOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-2">#{o.id.slice(0, 8)}</span>
                    <span className="font-semibold text-ink">{money(Number(o.total_amount))}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
