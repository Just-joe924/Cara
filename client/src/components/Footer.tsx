import { Link } from 'react-router-dom'

const colLink = 'mb-2.5 text-[13px] text-ink no-underline hover:text-primary'

export default function Footer() {
  return (
    <footer className="section-x flex flex-wrap justify-between gap-8">
      <div className="mb-5 flex flex-col items-start">
        <img className="mb-[30px]" src="/img/logo.png" alt="Cara" />
        <h4 className="mb-5 text-sm font-semibold">Contact</h4>
        <p className="mb-2 text-[13px] text-muted">
          <strong>Address:</strong> 562 Washington Road Street 32, San Francisco
        </p>
        <p className="mb-2 text-[13px] text-muted">
          <strong>Phone:</strong> +01 222 365 /(+91) 01 2345 6789
        </p>
        <p className="mb-2 text-[13px] text-muted">
          <strong>Hours:</strong> 10:00 - 18:00, Mon - Sat
        </p>
        <div className="mt-5">
          <h4 className="mb-5 text-sm font-semibold">Follow Us</h4>
          <div className="flex gap-1 text-muted">
            <i className="fab fa-facebook-f cursor-pointer hover:text-primary"></i>
            <i className="fab fa-twitter cursor-pointer hover:text-primary"></i>
            <i className="fab fa-instagram cursor-pointer hover:text-primary"></i>
            <i className="fab fa-pinterest-p cursor-pointer hover:text-primary"></i>
            <i className="fab fa-youtube cursor-pointer hover:text-primary"></i>
          </div>
        </div>
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

      <div className="mb-5 flex flex-col items-start">
        <h4 className="mb-5 text-sm font-semibold">Install App</h4>
        <p className="mb-2 text-[13px] text-muted">From App Store or Google Play</p>
        <div className="flex gap-2.5">
          <img className="rounded-md border border-primary" src="/img/pay/app.jpg" alt="App Store" />
          <img className="rounded-md border border-primary" src="/img/pay/play.jpg" alt="Google Play" />
        </div>
        <p className="mb-2 mt-4 text-[13px] text-muted">Secured Payment Gateways</p>
        <img src="/img/pay/pay.png" alt="Payment methods" />
      </div>

      <div className="w-full text-center">
        <p className="text-[13px] text-muted">&copy; 2024 Cara. All rights reserved.</p>
      </div>
    </footer>
  )
}
