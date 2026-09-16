import { Link } from 'react-router-dom'
import { SITE_CONTACT } from '../data/site'

const colLink = 'mb-2.5 text-[13px] text-ink no-underline hover:text-primary'

export default function Footer() {
  return (
    <footer className="section-x flex flex-wrap justify-between gap-8">
      <div className="mb-5 flex flex-col items-start">
        <img className="mb-[30px]" src="/img/logo.png" alt="Cara" />
        <h4 className="mb-5 text-sm font-semibold">Contact</h4>
        <p className="mb-2 text-[13px] text-muted">
          <strong>Address:</strong> {SITE_CONTACT.address}
        </p>
        <p className="mb-2 text-[13px] text-muted">
          <strong>Phone:</strong> {SITE_CONTACT.phone}
        </p>
        <p className="mb-2 text-[13px] text-muted">
          <strong>Email:</strong> {SITE_CONTACT.email}
        </p>
        {/* Social links removed — Cara has no social accounts yet. Add a
            "Follow Us" block back here once the handles exist. */}
      </div>

      <div className="mb-5 flex flex-col items-start">
        <h4 className="mb-5 text-sm font-semibold">About</h4>
        <Link to="/about" className={colLink}>About Us</Link>
        <a href="#" className={colLink}>Delivery Information</a>
        <a href="#" className={colLink}>Privacy Policy</a>
        <a href="#" className={colLink}>Terms &amp; Conditions</a>
        <Link to="/contact" className={colLink}>Contact Us</Link>
      </div>

      <div className="mb-5 flex flex-col items-start">
        <h4 className="mb-5 text-sm font-semibold">My Account</h4>
        <Link to="/login" className={colLink}>Sign In</Link>
        <Link to="/cart" className={colLink}>View Cart</Link>
        <Link to="/wishlist" className={colLink}>My Wishlist</Link>
        <a href="#" className={colLink}>Track My Order</a>
        <a href="#" className={colLink}>Help</a>
      </div>

      <div className="mb-5 flex max-w-[230px] flex-col items-start">
        <h4 className="mb-5 text-sm font-semibold">Sell on Cara</h4>
        <p className="mb-3 text-[13px] text-muted">
          Open a storefront, list your products in naira and reach buyers near you.
        </p>
        <Link
          to="/seller/onboarding"
          className="mb-1 rounded bg-primary px-4 py-2 text-[13px] font-semibold text-white no-underline hover:opacity-90"
        >
          Start Selling
        </Link>
        <p className="mb-2 mt-4 text-[13px] text-muted">Payments secured by Paystack</p>
        <img src="/img/pay/pay.png" alt="Accepted payment methods" />
      </div>

      <div className="w-full text-center">
        <p className="text-[13px] text-muted">&copy; 2024 Cara. All rights reserved.</p>
      </div>
    </footer>
  )
}
