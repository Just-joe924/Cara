import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createSeller, getMySeller } from '../api/sellers'
import { uploadProductImage } from '../api/products'

const BUSINESS_TYPES = [
  'Retail',
  'Wholesale',
  'Handmade',
  'Dropshipping',
  'Digital Products',
  'Services',
  'Other',
]

export default function SellerOnboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [checking, setChecking] = useState(true)
  const [form, setForm] = useState({
    business_name: '',
    brand_name: '',
    business_type: '',
    description: '',
    phone: '',
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

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!form.business_name.trim()) {
      setError('Business name is required.')
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
        phone: form.phone.trim() || null,
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

  return (
    <>
      <section className="page-banner bg-about-header [background-position:top_25%_right_0]">
        <h2>#StartSelling</h2>
        <p className="text-white">Set up your store and reach Cara shoppers</p>
      </section>

      <section className="section-x flex justify-center">
        <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-lg border border-[#e1e1e1] p-8 shadow-sm">
          <h2 className="mb-2 text-3xl text-ink">Become a Seller</h2>
          <p className="mb-6 text-sm text-muted">Tell buyers about your business.</p>

          {error && <p className="mb-4 rounded bg-[#fdecec] px-3 py-2 text-sm text-accent">{error}</p>}

          <label className="mb-1 block text-sm font-semibold text-muted">Business Name *</label>
          <input className="form-input mb-4" value={form.business_name} onChange={(e) => update('business_name', e.target.value)} placeholder="Acme Apparel Co." />

          <label className="mb-1 block text-sm font-semibold text-muted">Brand Name</label>
          <input className="form-input mb-1" value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} placeholder="Acme" />
          <p className="mb-4 text-xs text-muted-2">Buyers can find your products by searching this brand.</p>

          <label className="mb-1 block text-sm font-semibold text-muted">Business Type</label>
          <select className="form-input mb-4" value={form.business_type} onChange={(e) => update('business_type', e.target.value)}>
            <option value="">Select a type…</option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <label className="mb-1 block text-sm font-semibold text-muted">About Your Store</label>
          <textarea className="form-input mb-4" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="What makes your brand special?" />

          <div className="flex gap-4">
            <div className="mb-4 flex-1">
              <label className="mb-1 block text-sm font-semibold text-muted">Phone</label>
              <input className="form-input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+1 234 567 890" />
            </div>
            <div className="mb-4 flex-1">
              <label className="mb-1 block text-sm font-semibold text-muted">Website</label>
              <input className="form-input" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://…" />
            </div>
          </div>

          <label className="mb-1 block text-sm font-semibold text-muted">Logo (optional)</label>
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
