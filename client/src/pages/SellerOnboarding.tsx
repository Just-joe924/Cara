import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createSeller, getMySeller } from '../api/sellers'
import { uploadProductImage } from '../api/products'
import { NIGERIAN_STATES } from '../data/nigeria'

const BUSINESS_TYPES = [
  'Retail',
  'Wholesale',
  'Handmade',
  'Dropshipping',
  'Digital Products',
  'Services',
  'Other',
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Nigerian mobile numbers: 08012345678, +2348012345678, 2348012345678. */
const PHONE_RE = /^(?:\+?234|0)[789]\d{9}$/

const normalisePhone = (value: string) => value.replace(/[\s-]/g, '')

export default function SellerOnboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [checking, setChecking] = useState(true)
  const [form, setForm] = useState({
    business_name: '',
    brand_name: '',
    business_type: '',
    description: '',
    email: '',
    phone: '',
    phone_alt: '',
    address_line: '',
    city: '',
    state: '',
    landmark: '',
    website: '',
  })
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Already a seller? Go straight to the dashboard.
  useEffect(() => {
    if (!user) return
    getMySeller(user.id)
      .then((s) => {
        if (s) navigate('/seller', { replace: true })
      })
      .finally(() => setChecking(false))
  }, [user, navigate])

  // Prefill the contact email with the account they signed up with.
  useEffect(() => {
    if (user?.email) setForm((prev) => (prev.email ? prev : { ...prev, email: user.email! }))
  }, [user])

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    setError('')
    try {
      setLogoUrl(await uploadProductImage(user.id, file))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logo upload failed')
    } finally {
      setUploading(false)
    }
  }

  /** Returns an error message, or '' when the form is good to submit. */
  function validate(): string {
    if (!form.business_name.trim()) return 'Business name is required.'
    if (!EMAIL_RE.test(form.email.trim())) return 'Enter a valid business email address.'
    if (!PHONE_RE.test(normalisePhone(form.phone))) return 'Enter a valid Nigerian phone number.'
    if (form.phone_alt.trim() && !PHONE_RE.test(normalisePhone(form.phone_alt))) {
      return 'The second phone number is not a valid Nigerian number.'
    }
    if (!form.address_line.trim()) return 'Your shop address is required — buyers collect their orders there.'
    if (!form.city.trim()) return 'Enter the city or town your shop is in.'
    if (!form.state) return 'Select the state your shop is in.'
    return ''
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return

    const problem = validate()
    if (problem) {
      setError(problem)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await createSeller(user.id, {
        business_name: form.business_name.trim(),
        brand_name: form.brand_name.trim() || null,
        business_type: form.business_type || null,
        description: form.description.trim() || null,
        email: form.email.trim(),
        phone: normalisePhone(form.phone),
        phone_alt: normalisePhone(form.phone_alt) || null,
        address_line: form.address_line.trim(),
        city: form.city.trim(),
        state: form.state,
        landmark: form.landmark.trim() || null,
        website: form.website.trim() || null,
        logo_url: logoUrl,
      })
      navigate('/seller', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not create your seller profile'
      setError(msg.includes('duplicate') ? 'That brand name is already taken.' : msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) {
    return (
      <section className="section-x flex min-h-[50vh] items-center justify-center">
        <i className="fa-solid fa-spinner fa-spin text-3xl text-primary"></i>
      </section>
    )
  }

  const labelClass = 'mb-1 block text-sm font-semibold text-muted'

  return (
    <>
      <section className="page-banner bg-about-header [background-position:top_25%_right_0]">
        <h2>#StartSelling</h2>
        <p className="text-white">Set up your store and reach Cara shoppers</p>
      </section>

      <section className="section-x flex justify-center">
        <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-lg border border-[#e1e1e1] p-8 shadow-sm" noValidate>
          <h2 className="mb-2 text-3xl text-ink">Become a Seller</h2>
          <p className="mb-6 text-sm text-muted">Tell buyers about your business and where to find you.</p>

          {error && <p className="mb-4 rounded bg-[#fdecec] px-3 py-2 text-sm text-accent">{error}</p>}

          {/* --- Business --- */}
          <label className={labelClass}>Business Name *</label>
          <input className="form-input mb-4" value={form.business_name} onChange={(e) => update('business_name', e.target.value)} placeholder="Acme Apparel Co." />

          <label className={labelClass}>Brand Name</label>
          <input className="form-input mb-1" value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} placeholder="Acme" />
          <p className="mb-4 text-xs text-muted-2">Buyers can find your products by searching this brand.</p>

          <label className={labelClass}>Business Type</label>
          <select className="form-input mb-4" value={form.business_type} onChange={(e) => update('business_type', e.target.value)}>
            <option value="">Select a type…</option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <label className={labelClass}>About Your Store</label>
          <textarea className="form-input mb-6" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="What makes your brand special?" />

          {/* --- Shop address --- */}
          <h3 className="mb-1 border-t border-[#f0f0f0] pt-6 text-lg font-semibold text-ink">Shop Address</h3>
          <p className="mb-4 text-xs text-muted-2">
            Buyers who choose <strong>pay on pickup</strong> collect their orders here, so make it easy to find.
          </p>

          <label className={labelClass}>Street Address *</label>
          <input className="form-input mb-4" value={form.address_line} onChange={(e) => update('address_line', e.target.value)} placeholder="12 Adeola Odeku Street, Shop B4" />

          <div className="flex gap-4">
            <div className="mb-4 flex-1">
              <label className={labelClass}>City / Town *</label>
              <input className="form-input" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Ikeja" />
            </div>
            <div className="mb-4 flex-1">
              <label className={labelClass}>State *</label>
              <select className="form-input" value={form.state} onChange={(e) => update('state', e.target.value)}>
                <option value="">Select state…</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <label className={labelClass}>Nearest Landmark</label>
          <input className="form-input mb-1" value={form.landmark} onChange={(e) => update('landmark', e.target.value)} placeholder="Opposite Ikeja City Mall" />
          <p className="mb-6 text-xs text-muted-2">Optional, but it's how people actually find you.</p>

          {/* --- Contact --- */}
          <h3 className="mb-1 border-t border-[#f0f0f0] pt-6 text-lg font-semibold text-ink">Contact Details</h3>
          <p className="mb-4 text-xs text-muted-2">We use these to reach you about orders. Buyers see them on your storefront.</p>

          <label className={labelClass}>Business Email *</label>
          <input type="email" className="form-input mb-4" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="sales@acme.ng" />

          <div className="flex gap-4">
            <div className="mb-4 flex-1">
              <label className={labelClass}>Phone Number *</label>
              <input type="tel" className="form-input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="08012345678" />
            </div>
            <div className="mb-4 flex-1">
              <label className={labelClass}>Second Phone</label>
              <input type="tel" className="form-input" value={form.phone_alt} onChange={(e) => update('phone_alt', e.target.value)} placeholder="WhatsApp / alternate" />
            </div>
          </div>

          <label className={labelClass}>Website</label>
          <input className="form-input mb-6" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://…" />

          <label className={labelClass}>Logo (optional)</label>
          <div className="mb-6 flex items-center gap-4">
            {logoUrl && <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-full object-cover" />}
            <input type="file" accept="image/*" onChange={handleLogo} className="text-sm" />
            {uploading && <i className="fa-solid fa-spinner fa-spin text-primary"></i>}
          </div>

          <button type="submit" className="btn-primary w-full" disabled={submitting || uploading}>
            {submitting ? 'Creating your store…' : 'Create Store'}
          </button>
        </form>
      </section>
    </>
  )
}
