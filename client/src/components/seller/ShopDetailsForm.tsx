import { useState, type FormEvent } from 'react'
import { updateSeller } from '../../api/sellers'
import { uploadProductImage } from '../../api/products'
import { NIGERIAN_STATES } from '../../data/nigeria'
import type { Seller } from '../../types'

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
const PHONE_RE = /^(?:\+?234|0)[789]\d{9}$/
const normalisePhone = (value: string) => value.replace(/[\s-]/g, '')

/**
 * Edit an existing seller's shop details. Sellers who onboarded before shop
 * addresses existed have no address on file, which breaks pay-on-pickup for
 * their buyers — this is how they fill it in.
 */
export default function ShopDetailsForm({
  seller,
  userId,
  onSaved,
  onCancel,
}: {
  seller: Seller
  userId: string
  onSaved: (updated: Seller) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    business_name: seller.business_name ?? '',
    brand_name: seller.brand_name ?? '',
    business_type: seller.business_type ?? '',
    description: seller.description ?? '',
    email: seller.email ?? '',
    phone: seller.phone ?? '',
    phone_alt: seller.phone_alt ?? '',
    address_line: seller.address_line ?? '',
    city: seller.city ?? '',
    state: seller.state ?? '',
    landmark: seller.landmark ?? '',
    website: seller.website ?? '',
  })
  const [logoUrl, setLogoUrl] = useState<string | null>(seller.logo_url)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      setLogoUrl(await uploadProductImage(userId, file))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logo upload failed')
    } finally {
      setUploading(false)
    }
  }

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
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setSaving(true)
    setError('')
    try {
      const updated = await updateSeller(seller.id, {
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
      onSaved(updated)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save your shop details'
      setError(msg.includes('duplicate') ? 'That brand name is already taken.' : msg)
    } finally {
      setSaving(false)
    }
  }

  const labelClass = 'mb-1 block text-sm font-semibold text-muted'

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-[#e1e1e1] p-6 shadow-sm" noValidate>
      <h3 className="mb-4 text-xl font-semibold text-ink">Shop Details</h3>

      {error && <p className="mb-4 rounded bg-[#fdecec] px-3 py-2 text-sm text-accent">{error}</p>}

      <div className="flex flex-wrap gap-4">
        <div className="mb-4 min-w-[220px] flex-1">
          <label className={labelClass}>Business Name *</label>
          <input className="form-input" value={form.business_name} onChange={(e) => update('business_name', e.target.value)} />
        </div>
        <div className="mb-4 min-w-[220px] flex-1">
          <label className={labelClass}>Brand Name</label>
          <input className="form-input" value={form.brand_name} onChange={(e) => update('brand_name', e.target.value)} />
        </div>
      </div>

      <label className={labelClass}>Business Type</label>
      <select className="form-input mb-4" value={form.business_type} onChange={(e) => update('business_type', e.target.value)}>
        <option value="">Select a type…</option>
        {BUSINESS_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <label className={labelClass}>About Your Store</label>
      <textarea className="form-input mb-6" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />

      <h4 className="mb-1 border-t border-[#f0f0f0] pt-5 text-base font-semibold text-ink">Shop Address</h4>
      <p className="mb-4 text-xs text-muted-2">Buyers who pay on pickup collect their orders here.</p>

      <label className={labelClass}>Street Address *</label>
      <input className="form-input mb-4" value={form.address_line} onChange={(e) => update('address_line', e.target.value)} placeholder="12 Adeola Odeku Street, Shop B4" />

      <div className="flex flex-wrap gap-4">
        <div className="mb-4 min-w-[200px] flex-1">
          <label className={labelClass}>City / Town *</label>
          <input className="form-input" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Ikeja" />
        </div>
        <div className="mb-4 min-w-[200px] flex-1">
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
      <input className="form-input mb-6" value={form.landmark} onChange={(e) => update('landmark', e.target.value)} placeholder="Opposite Ikeja City Mall" />

      <h4 className="mb-1 border-t border-[#f0f0f0] pt-5 text-base font-semibold text-ink">Contact Details</h4>
      <p className="mb-4 text-xs text-muted-2">Shown to buyers on your storefront.</p>

      <label className={labelClass}>Business Email *</label>
      <input type="email" className="form-input mb-4" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="sales@acme.ng" />

      <div className="flex flex-wrap gap-4">
        <div className="mb-4 min-w-[200px] flex-1">
          <label className={labelClass}>Phone Number *</label>
          <input type="tel" className="form-input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="08012345678" />
        </div>
        <div className="mb-4 min-w-[200px] flex-1">
          <label className={labelClass}>Second Phone</label>
          <input type="tel" className="form-input" value={form.phone_alt} onChange={(e) => update('phone_alt', e.target.value)} placeholder="WhatsApp / alternate" />
        </div>
      </div>

      <label className={labelClass}>Website</label>
      <input className="form-input mb-6" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://…" />

      <label className={labelClass}>Logo</label>
      <div className="mb-6 flex items-center gap-4">
        {logoUrl && <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-full object-cover" />}
        <input type="file" accept="image/*" onChange={handleLogo} className="text-sm" />
        {uploading && <i className="fa-solid fa-spinner fa-spin text-primary"></i>}
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={saving || uploading}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button
          type="button"
          className="btn-normal border border-primary-border hover:bg-primary hover:text-white"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
