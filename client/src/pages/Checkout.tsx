import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { createOrder, createCheckoutSession } from '../api/orders'

interface ShippingForm {
  fullName: string
  email: string
  address: string
  city: string
  zip: string
  country: string
  payment: 'card' | 'paypal' | 'cod'
}

const EMPTY_FORM: ShippingForm = {
  fullName: '',
  email: '',
  address: '',
  city: '',
  zip: '',
  country: '',
  payment: 'card',
}

const SHIPPING_FLAT: number = 0 // free shipping, matching the cart page

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart()
  const navigate = useNavigate()

  const [form, setForm] = useState<ShippingForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingForm, string>>>({})
  const [orderId, setOrderId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const total = subtotal + SHIPPING_FLAT

  // Snapshot the item count at the moment the order is placed, since
  // placing the order clears the cart.
  const placedItemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  )

  function update<K extends keyof ShippingForm>(field: K, value: ShippingForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function validate(): boolean {
    const next: Partial<Record<keyof ShippingForm, string>> = {}
    if (!form.fullName.trim()) next.fullName = 'Full name is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email'
    if (!form.address.trim()) next.address = 'Address is required'
    if (!form.city.trim()) next.city = 'City is required'
    if (!form.zip.trim()) next.zip = 'ZIP / postal code is required'
    if (!form.country.trim()) next.country = 'Country is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError('')
    if (items.length === 0 || !validate()) return
    setSubmitting(true)

    const shipping = {
      full_name: form.fullName,
      email: form.email,
      address: form.address,
      city: form.city,
      zip: form.zip,
      country: form.country,
      payment_method: form.payment,
    }

    try {
      if (form.payment === 'card') {
        // Hand off to Stripe Checkout; the cart is cleared on payment success.
        const { url } = await createCheckoutSession(shipping)
        window.location.href = url
        return
      }
      // Cash on delivery — finalize immediately via the API.
      const order = await createOrder(shipping)
      setOrderId(order.id)
      await clearCart() // clears client cart state (server already cleared the DB cart)
      window.scrollTo(0, 0)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full rounded border border-[#e1e1e1] px-[15px] py-3 text-sm outline-none focus:border-primary'

  // --- Confirmation view ---
  if (orderId) {
    return (
      <section className="section-x flex min-h-[60vh] flex-col items-center justify-center text-center">
        <i className="fa-solid fa-circle-check text-[64px] text-primary"></i>
        <h2 className="mt-5 text-3xl text-ink">Thank you for your order!</h2>
        <p className="my-3 text-muted">
          Your order <strong>#{orderId.slice(0, 8)}</strong> has been placed
          {placedItemCount > 0 ? ` (${placedItemCount} item${placedItemCount > 1 ? 's' : ''})` : ''}.
          <br />
          Track it anytime in{' '}
          <Link to="/account" className="font-semibold text-primary">
            your account
          </Link>
          .
        </p>
        <p className="text-muted">This is a demo store — no payment was processed.</p>
        <div className="mt-3 flex justify-center gap-3">
          <Link to="/shop">
            <button className="btn-primary">Continue Shopping</button>
          </Link>
          <Link to="/">
            <button className="btn-normal border border-primary-border hover:bg-primary hover:text-white">Back to Home</button>
          </Link>
        </div>
      </section>
    )
  }

  // --- Empty cart guard ---
  if (items.length === 0) {
    return (
      <section className="section-x flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-3xl text-ink">Your cart is empty</h2>
        <p className="my-4 text-muted">Add some products before heading to checkout.</p>
        <Link to="/shop">
          <button className="btn-primary">Go to Shop</button>
        </Link>
      </section>
    )
  }

  // --- Checkout form view ---
  return (
    <>
      <section className="page-banner bg-shop-header [background-position:top_25%_right_0]">
        <h2>#checkout</h2>
        <p className="text-white">You're just one step away from your new wardrobe</p>
      </section>

      <section className="section-x flex flex-wrap items-start gap-10">
        <form className="flex-1 basis-[420px]" onSubmit={handleSubmit} noValidate>
          <h3 className="mb-4 text-lg font-semibold">Shipping Details</h3>

          <div className="mb-4">
            <input type="text" placeholder="Full Name" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className={inputClass} />
            {errors.fullName && <small className="mt-1.5 block text-xs text-accent">{errors.fullName}</small>}
          </div>

          <div className="mb-4">
            <input type="email" placeholder="Email Address" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} />
            {errors.email && <small className="mt-1.5 block text-xs text-accent">{errors.email}</small>}
          </div>

          <div className="mb-4">
            <input type="text" placeholder="Street Address" value={form.address} onChange={(e) => update('address', e.target.value)} className={inputClass} />
            {errors.address && <small className="mt-1.5 block text-xs text-accent">{errors.address}</small>}
          </div>

          <div className="flex gap-4">
            <div className="mb-4 flex-1">
              <input type="text" placeholder="City" value={form.city} onChange={(e) => update('city', e.target.value)} className={inputClass} />
              {errors.city && <small className="mt-1.5 block text-xs text-accent">{errors.city}</small>}
            </div>
            <div className="mb-4 flex-1">
              <input type="text" placeholder="ZIP / Postal Code" value={form.zip} onChange={(e) => update('zip', e.target.value)} className={inputClass} />
              {errors.zip && <small className="mt-1.5 block text-xs text-accent">{errors.zip}</small>}
            </div>
          </div>

          <div className="mb-4">
            <input type="text" placeholder="Country" value={form.country} onChange={(e) => update('country', e.target.value)} className={inputClass} />
            {errors.country && <small className="mt-1.5 block text-xs text-accent">{errors.country}</small>}
          </div>

          <h3 className="mb-4 mt-7 text-lg font-semibold">Payment Method</h3>
          <div className="flex flex-col gap-3">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="radio" name="payment" checked={form.payment === 'card'} onChange={() => update('payment', 'card')} />
              Credit / Debit Card
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="radio" name="payment" checked={form.payment === 'paypal'} onChange={() => update('payment', 'paypal')} />
              PayPal
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="radio" name="payment" checked={form.payment === 'cod'} onChange={() => update('payment', 'cod')} />
              Cash on Delivery
            </label>
          </div>

          {submitError && (
            <p className="mt-4 rounded bg-[#fdecec] px-3 py-2 text-sm text-accent">{submitError}</p>
          )}
          <button type="submit" className="btn-primary mt-7 w-full" disabled={submitting}>
            {submitting
              ? form.payment === 'card'
                ? 'Redirecting to payment…'
                : 'Placing order…'
              : form.payment === 'card'
                ? `Pay $${total.toFixed(2)}`
                : `Place Order — $${total.toFixed(2)}`}
          </button>
        </form>

        <aside className="flex-1 basis-[320px] rounded-md border border-[#e2e9e1] p-[26px] lg:sticky lg:top-24">
          <h3 className="mb-4 text-lg font-semibold">Order Summary</h3>
          <ul className="mb-4">
            {items.map((item) => (
              <li key={item.product.id} className="flex items-center gap-3 border-b border-[#f0f0f0] py-2.5">
                <img className="h-[50px] w-[50px] rounded-md object-cover" src={item.product.image_url ?? ''} alt={item.product.name} />
                <div className="flex flex-1 flex-col">
                  <span className="text-[13px] font-semibold text-ink">{item.product.name}</span>
                  <span className="text-xs text-muted-2">Qty: {item.quantity}</span>
                </div>
                <span className="text-[13px] font-bold text-primary">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <table className="mb-[18px] w-full border-collapse">
            <tbody className="text-sm">
              <tr>
                <td className="py-2">Subtotal</td>
                <td className="py-2 text-right">${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-2">Shipping</td>
                <td className="py-2 text-right">{SHIPPING_FLAT === 0 ? 'Free' : `$${SHIPPING_FLAT.toFixed(2)}`}</td>
              </tr>
              <tr className="text-base">
                <td className="border-t border-[#e2e9e1] pt-3"><strong>Total</strong></td>
                <td className="border-t border-[#e2e9e1] pt-3 text-right"><strong>${total.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
          <button
            type="button"
            className="btn-normal w-full border border-primary-border hover:bg-primary hover:text-white"
            onClick={() => navigate('/cart')}
          >
            Back to Cart
          </button>
        </aside>
      </section>
    </>
  )
}
