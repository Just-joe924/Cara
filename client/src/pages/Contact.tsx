import { useState, type FormEvent } from 'react'
import Newsletter from '../components/Newsletter'

const team = [
  { img: '/img/people/1.png', name: 'John Doe', role: 'Senior Marketing Manager', phone: '+1 234 567 890', email: 'johndoe@gmail.com' },
  { img: '/img/people/2.png', name: 'William Smith', role: 'Senior Marketing Manager', phone: '+1 578 907 267', email: 'williamsmith@gmail.com' },
  { img: '/img/people/3.png', name: 'Emma Stone', role: 'Senior Marketing Manager', phone: '+1 289 567 670', email: 'emmastone@gmail.com' },
]

const inputClass = 'mb-5 w-full rounded border border-[#e1e1e1] px-[15px] py-3 outline-none focus:border-primary'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSent(false)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    setSent(true)
    setForm({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <>
      <section className="page-banner bg-about-header [background-position:top_25%_right_0]">
        <h2>#Let's_talk</h2>
        <p className="text-white">LEAVE A MESSAGE, We'd love to hear from you!</p>
      </section>

      <section className="section-x flex flex-col items-center justify-between gap-8 lg:flex-row">
        <div className="w-full lg:w-2/5">
          <span className="text-xs">GET IN TOUCH</span>
          <h2 className="py-5 text-[26px] leading-[35px] text-ink">
            Visit one of our agency locations or contact us today.
          </h2>
          <h3 className="pb-4 text-base font-semibold">Head Office</h3>
          <ul>
            <li className="flex items-center p-2.5">
              <i className="fa-solid fa-map pr-[22px] text-sm"></i>
              <p className="m-0 text-sm text-muted">56 Glassford Street Glasgow G1 1UL New York</p>
            </li>
            <li className="flex items-center p-2.5">
              <i className="fa-solid fa-envelope pr-[22px] text-sm"></i>
              <p className="m-0 text-sm text-muted">contact@cara.com</p>
            </li>
            <li className="flex items-center p-2.5">
              <i className="fa-solid fa-phone pr-[22px] text-sm"></i>
              <p className="m-0 text-sm text-muted">+1 234 567 890</p>
            </li>
            <li className="flex items-center p-2.5">
              <i className="fa-solid fa-clock pr-[22px] text-sm"></i>
              <p className="m-0 text-sm text-muted">Monday to Saturday: 9.00am to 16.00pm</p>
            </li>
          </ul>
        </div>
        <div className="h-[440px] w-full lg:w-[55%]">
          <iframe
            title="Cara location map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3962.8350216390545!2d3.638261609469411!3d6.66735619329981!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103be14f00000001%3A0x6fdaf3d4a440c169!2sCaleb%20University!5e0!3m2!1sen!2sng!4v1776419934976!5m2!1sen!2sng"
            className="h-full w-full"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </section>

      <section className="m-[30px] flex flex-col justify-between gap-8 border border-[#e1e1e1] p-10 lg:flex-row lg:p-20">
        <form onSubmit={handleSubmit} className="flex w-full flex-col items-start lg:w-[65%]">
          <span className="text-xs">LEAVE A MESSAGE</span>
          <h2 className="py-5 text-[26px] leading-[35px] text-ink">We love to hear from you</h2>
          <input type="text" placeholder="Your Name" value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} />
          <input type="email" placeholder="Your Email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} />
          <input type="text" placeholder="Subject" value={form.subject} onChange={(e) => update('subject', e.target.value)} className={inputClass} />
          <textarea rows={10} placeholder="Your Message" value={form.message} onChange={(e) => update('message', e.target.value)} className={inputClass}></textarea>
          <button type="submit" className="btn-primary">
            {sent ? 'Message sent ✓' : 'Submit'}
          </button>
        </form>

        <div className="w-full lg:w-auto">
          {team.map((person) => (
            <div key={person.name} className="flex items-start pb-6">
              <img className="mr-4 h-[65px] w-[65px] rounded-none object-cover" src={person.img} alt={person.name} />
              <p className="m-0 text-[13px] leading-[25px]">
                <span className="block text-base font-semibold text-black">{person.name}</span>
                {person.role} <br /> Phone: {person.phone} <br /> Email: {person.email}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Newsletter />
    </>
  )
}
