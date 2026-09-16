import { Link } from 'react-router-dom'
import Feature from '../components/Feature'
import Newsletter from '../components/Newsletter'

const steps = [
  {
    icon: 'fa-store',
    title: 'Open your store',
    body: 'Register, add your business name, shop address and phone number, and your storefront is live. No listing fee, no waiting.',
  },
  {
    icon: 'fa-camera',
    title: 'List what you sell',
    body: 'Upload photos, set your price in naira, add sizes and stock. Cara can even draft the product description for you.',
  },
  {
    icon: 'fa-bag-shopping',
    title: 'Get paid',
    body: 'Buyers pay online by card, transfer or USSD — or reserve now and pay you at the shop when they collect.',
  },
]

export default function About() {
  return (
    <>
      <section className="page-banner bg-about-header [background-position:top_25%_right_0]">
        <h2>#Know Us</h2>
        <p className="text-white">
          The marketplace where local sellers show what they've got — and buyers find it.
        </p>
      </section>

      <section className="section-x flex flex-col items-center gap-0 md:flex-row">
        <img className="h-auto w-full md:w-1/2" src="/img/about/a6.jpg" alt="Buying and selling on Cara" />
        <div className="pt-6 md:pl-10 md:pt-0">
          <h2 className="text-3xl text-ink sm:text-[46px]">What Is Cara?</h2>
          <p className="my-4 text-muted">
            Cara is a marketplace, not a single shop. Anyone with something to sell can open a
            storefront here in minutes — list your products, set your prices in naira, and start
            taking orders from people nearby. Buyers get one place to browse every store, compare
            prices, save favourites and read reviews left by people who actually bought the item.
          </p>
          <p className="my-4 text-muted">
            We built it around how trade already works here. Pay online with your card, a bank
            transfer or USSD if that's easiest — or reserve your order and pay the seller in cash
            when you walk into their shop to collect it. Either way you get a receipt by email, and
            you can follow each item from <em>processing</em> to <em>ready</em> to <em>collected</em>
            {' '}in your account.
          </p>
          <p className="my-4 text-muted">
            Every product on Cara belongs to a real seller with a real address and a phone number you
            can call. That's the whole idea: the reach of an online store, with the trust of a shop
            you can walk into.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/shop">
              <button className="btn-primary">Browse the Shop</button>
            </Link>
            <Link to="/seller/onboarding">
              <button className="btn-normal border border-primary-border hover:bg-primary hover:text-white">
                Start Selling
              </button>
            </Link>
          </div>
        </div>
      </section>

      <section className="section-x">
        <h2 className="text-center text-3xl text-ink sm:text-[40px]">Selling on Cara</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted">
          Three steps from signing up to your first order.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-lg border border-primary-border p-7 shadow-[20px_20px_34px_rgba(0,0,0,0.03)] transition hover:shadow-[10px_10px_54px_rgba(70,62,221,0.1)]"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <i className={`fa-solid ${step.icon}`}></i>
                </span>
                <span className="text-sm font-bold text-muted-2">0{i + 1}</span>
              </div>
              <h4 className="mb-2 text-lg font-semibold text-ink">{step.title}</h4>
              <p className="text-sm text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The old "Download Our App" section played /img/about/1.mp4 — a mockup of
          a mobile app that doesn't exist, with prices in dollars. Removed rather
          than relabelled; the video file is still in public/img/about/ if a real
          app ever ships. */}

      <Feature />

      <Newsletter />
    </>
  )
}
