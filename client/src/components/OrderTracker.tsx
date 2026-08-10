import type { OrderItem } from '../types'

const STAGES = [
  { key: 'processing', label: 'Processing', icon: 'fa-box' },
  { key: 'shipped', label: 'Shipped', icon: 'fa-truck' },
  { key: 'delivered', label: 'Delivered', icon: 'fa-circle-check' },
]

const stageIndex = (status?: string) => {
  const i = STAGES.findIndex((s) => s.key === status)
  return i === -1 ? 0 : i
}

/**
 * Buyer-facing fulfillment timeline for an order. Fulfillment lives per line
 * item (sellers update their own), so the overall stage is the *least* advanced
 * non-cancelled item — the order isn't "Shipped" until everything has shipped.
 */
export default function OrderTracker({ items }: { items: OrderItem[] }) {
  const active = items.filter((i) => (i.status ?? 'processing') !== 'cancelled')

  // Whole order cancelled.
  if (items.length > 0 && active.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-[#fdecec] px-4 py-3 text-sm font-semibold text-accent">
        <i className="fa-solid fa-ban"></i> This order was cancelled.
      </div>
    )
  }

  const stages = active.map((i) => stageIndex(i.status))
  const current = stages.length ? Math.min(...stages) : 0
  const mixed = stages.length > 0 && Math.min(...stages) !== Math.max(...stages)

  return (
    <div>
      <div className="flex items-center">
        {STAGES.map((stage, i) => {
          const done = i <= current
          const isCurrent = i === current
          return (
            <div key={stage.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm transition ${
                    done
                      ? 'border-primary bg-primary text-white'
                      : 'border-[#e1e1e1] bg-white text-muted-2'
                  } ${isCurrent ? 'ring-4 ring-primary-soft' : ''}`}
                >
                  <i className={`fa-solid ${stage.icon}`}></i>
                </span>
                <span className={`mt-1.5 text-xs font-medium ${done ? 'text-ink' : 'text-muted-2'}`}>
                  {stage.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`mx-1 h-0.5 flex-1 ${i < current ? 'bg-primary' : 'bg-[#e1e1e1]'}`}></div>
              )}
            </div>
          )
        })}
      </div>
      {mixed && (
        <p className="mt-3 text-xs text-muted-2">
          <i className="fa-solid fa-circle-info mr-1"></i>
          Items in this order are at different stages — see each item below.
        </p>
      )}
    </div>
  )
}
