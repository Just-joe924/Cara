import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyCheckout } from '../api/orders'
import { useCart } from '../context/CartContext'

type Status = 'verifying' | 'paid' | 'unpaid' | 'error'

export default function CheckoutSuccess() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const { clearCart } = useCart()

  const [status, setStatus] = useState<Status>('verifying')
  const [orderId, setOrderId] = useState<string | undefined>()
  const [message, setMessage] = useState('')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return // guard React 18 StrictMode double-invoke
    ran.current = true

    if (!sessionId) {
      setStatus('error')
      setMessage('Missing checkout session.')
      return
    }

    verifyCheckout(sessionId)
      .then(async (result) => {
        setOrderId(result.order_id)
        if (result.paid) {
          setStatus('paid')
          await clearCart() // sync local cart state with the server-cleared cart
        } else {
          setStatus('unpaid')
        }
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Verification failed')
      })
  }, [sessionId, clearCart])

  return (
    <section className="section-x flex min-h-[60vh] flex-col items-center justify-center text-center">
      {status === 'verifying' && (
        <>
          <i className="fa-solid fa-spinner fa-spin text-[48px] text-primary"></i>
          <p className="mt-5 text-muted">Confirming your payment…</p>
        </>
      )}

      {status === 'paid' && (
        <>
          <i className="fa-solid fa-circle-check text-[64px] text-primary"></i>
          <h2 className="mt-5 text-3xl text-ink">Payment successful!</h2>
          <p className="my-3 text-muted">
            {orderId && (
              <>
                Order <strong>#{orderId.slice(0, 8)}</strong> is confirmed.{' '}
              </>
            )}
            Thank you for shopping with Cara.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <Link to="/account">
              <button className="btn-primary">View My Orders</button>
            </Link>
            <Link to="/shop">
              <button className="btn-normal border border-primary-border hover:bg-primary hover:text-white">
                Continue Shopping
              </button>
            </Link>
          </div>
        </>
      )}

      {status === 'unpaid' && (
        <>
          <i className="fa-solid fa-clock text-[64px] text-star"></i>
          <h2 className="mt-5 text-3xl text-ink">Payment pending</h2>
          <p className="my-3 text-muted">
            Your payment hasn't completed yet. If you were charged, your order will update shortly.
          </p>
          <Link to="/account">
            <button className="btn-primary">Go to My Orders</button>
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <i className="fa-solid fa-circle-exclamation text-[64px] text-accent"></i>
          <h2 className="mt-5 text-3xl text-ink">Something went wrong</h2>
          <p className="my-3 text-muted">{message}</p>
          <Link to="/cart">
            <button className="btn-primary">Back to Cart</button>
          </Link>
        </>
      )}
    </section>
  )
}
