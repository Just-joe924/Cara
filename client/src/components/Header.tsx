import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'relative text-base font-semibold transition hover:text-primary',
    "after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:bg-primary after:transition-all after:content-[''] hover:after:w-full",
    isActive ? 'text-primary after:w-full' : 'text-[#1a1a1a] after:w-0',
  ].join(' ')

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { totalQuantity } = useCart()

  return (
    <header className="sticky top-0 left-0 z-[999] flex items-center justify-between bg-header px-5 py-5 shadow-[0_5px_15px_rgba(0,0,0,0.06)] sm:px-10 lg:px-20">
      <Link to="/">
        <img src="/img/logo.png" alt="Cara" />
      </Link>

      <nav>
        <ul
          className={`fixed top-0 right-0 z-[1000] flex h-screen w-[300px] flex-col items-start gap-0 bg-header pt-20 pl-2.5 shadow-[0_40px_60px_rgba(0,0,0,0.01)] transition-transform duration-300 lg:static lg:h-auto lg:w-auto lg:translate-x-0 lg:flex-row lg:items-center lg:bg-transparent lg:p-0 lg:shadow-none ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {navLinks.map((link) => (
            <li key={link.to} className="mb-6 px-5 lg:mb-0">
              <NavLink
                to={link.to}
                end={link.to === '/'}
                className={linkClass}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
          <li className="relative mb-6 hidden px-5 lg:mb-0 lg:block">
            <Link to="/cart" onClick={() => setMobileOpen(false)} className="text-[#1a1a1a] hover:text-primary">
              <i className="fa-solid fa-bag-shopping"></i>
              {totalQuantity > 0 && <span className="cart-count">{totalQuantity}</span>}
            </Link>
          </li>
          <button
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute top-7 left-7 text-2xl text-ink lg:hidden"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </ul>
      </nav>

      <div className="flex items-center lg:hidden">
        <Link to="/cart" className="relative text-2xl text-[#1a1a1a]">
          <i className="fa-solid fa-bag-shopping"></i>
          {totalQuantity > 0 && <span className="cart-count">{totalQuantity}</span>}
        </Link>
        <button
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="pl-5 text-2xl text-[#1a1a1a]"
        >
          <i className="fa-solid fa-outdent"></i>
        </button>
      </div>
    </header>
  )
}
