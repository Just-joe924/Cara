import { useState, type FormEvent } from 'react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [signedUp, setSignedUp] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSignedUp(true)
    setEmail('')
  }

  return (
    <section className="my-10 flex flex-wrap items-center justify-between gap-6 bg-navy bg-newsletter bg-cover bg-no-repeat px-5 py-10 [background-position:20%_30%] sm:px-10 lg:px-20">
      <div>
        <h4 className="text-[22px] font-bold text-white">Sign Up For Newsletters</h4>
        <p className="text-sm font-semibold text-[#818ea0]">
          Get E-mail updates about our latest shop and{' '}
          <span className="text-[#ffbd27]">special offers.</span>
        </p>
      </div>
      <form className="flex w-full sm:w-[70%] lg:w-2/5" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-[50px] w-full rounded rounded-r-none border border-transparent px-5 text-sm outline-none"
        />
        <button
          type="submit"
          className="whitespace-nowrap rounded rounded-l-none bg-primary px-[30px] py-[15px] text-sm font-semibold text-white"
        >
          {signedUp ? 'Subscribed ✓' : 'Sign Up'}
        </button>
      </form>
    </section>
  )
}
