import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { items, subtotal, removeFromCart, setQuantity, clearCart } = useCart()
  const navigate = useNavigate()
  const [coupon, setCoupon] = useState('')
  const [couponMsg, setCouponMsg] = useState('')

  function applyCoupon() {
    setCouponMsg(
      coupon.trim() ? `Coupon "${coupon.trim()}" is not valid for this demo.` : '',
    )
  }

  return (
    <>
      <section className="page-banner bg-about-header [background-position:top_25%_right_0]">
        <h2>#cart</h2>
        <p className="text-white">Add your coupon code &amp; save up to 70%</p>
      </section>

      <section className="section-x overflow-x-auto">
        <table className="w-full border-collapse whitespace-nowrap">
          <thead className="border-y border-header">
            <tr className="text-center text-[13px] font-bold uppercase text-ink">
              <td className="py-[18px]">Remove</td>
              <td className="py-[18px]">Image</td>
              <td className="py-[18px]">Product</td>
              <td className="py-[18px]">Price</td>
              <td className="py-[18px]">Quantity</td>
              <td className="py-[18px]">Subtotal</td>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted">
                  Your cart is empty.{' '}
                  <Link to="/shop" className="font-bold text-primary">
                    Continue shopping
                  </Link>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.product.id} className="text-center text-[13px] text-muted">
                  <td className="pt-[15px]">
                    <button
                      className="text-base text-[#888] hover:text-accent"
                      aria-label={`Remove ${item.product.name}`}
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <i className="fa-regular fa-circle-xmark"></i>
                    </button>
                  </td>
                  <td className="pt-[15px]">
                    <img className="mx-auto w-[70px]" src={item.product.image_url ?? ''} alt={item.product.name} />
                  </td>
                  <td className="pt-[15px]">{item.product.name}</td>
                  <td className="pt-[15px]">${item.product.price.toFixed(2)}</td>
                  <td className="pt-[15px]">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => setQuantity(item.product.id, Number(e.target.value))}
                      className="w-[70px] rounded border border-[#e1e1e1] py-2.5 pl-3.5 pr-1.5 text-center"
                    />
                  </td>
                  <td className="pt-[15px]">${(item.product.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {items.length > 0 && (
          <div className="mt-5">
            <button className="btn-normal border border-primary-border hover:bg-primary hover:text-white" onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        )}
      </section>

      <section className="section-x flex flex-wrap justify-between gap-8">
        <div className="w-full lg:w-1/2">
          <h3 className="pb-4 text-lg font-semibold">Apply Coupon</h3>
          <div className="flex flex-wrap gap-2.5">
            <input
              type="text"
              placeholder="Enter Coupon Code"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              className="w-[60%] rounded border border-[#e2e9e1] px-5 py-2.5 outline-none"
            />
            <button className="bg-primary px-5 py-3 font-semibold text-white" onClick={applyCoupon}>
              Apply
            </button>
          </div>
          {couponMsg && <p className="mt-2.5 text-[13px] text-accent">{couponMsg}</p>}
        </div>

        <div className="w-full border border-[#e2e9e1] p-[30px] lg:w-[45%]">
          <h3 className="pb-4 text-lg font-semibold">Cart Totals</h3>
          <table className="mb-5 w-full border-collapse">
            <tbody className="text-[13px]">
              <tr>
                <td className="w-1/2 border border-[#e2e9e1] p-2.5">Cart Subtotal</td>
                <td className="w-1/2 border border-[#e2e9e1] p-2.5">${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="border border-[#e2e9e1] p-2.5">Shipping</td>
                <td className="border border-[#e2e9e1] p-2.5">Free</td>
              </tr>
              <tr>
                <td className="border border-[#e2e9e1] p-2.5"><strong>Total</strong></td>
                <td className="border border-[#e2e9e1] p-2.5"><strong>${subtotal.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
          <button
            className="btn-primary"
            disabled={items.length === 0}
            onClick={() => navigate('/checkout')}
          >
            Proceed to checkout
          </button>
        </div>
      </section>
    </>
  )
}
