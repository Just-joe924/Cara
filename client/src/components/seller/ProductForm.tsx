import { useState, type FormEvent } from 'react'
import type { Category, Product } from '../../types'
import {
  addProductImages,
  createProduct,
  updateProduct,
  uploadProductImage,
} from '../../api/products'
import { generateDescription } from '../../api/describe'

interface Props {
  sellerId: string
  userId: string
  sellerBrand: string | null
  categories: Category[]
  product?: Product // present ⇒ edit mode
  onSaved: () => void
  onCancel: () => void
}

export default function ProductForm({
  sellerId,
  userId,
  sellerBrand,
  categories,
  product,
  onSaved,
  onCancel,
}: Props) {
  const isEdit = Boolean(product)

  const [name, setName] = useState(product?.name ?? '')
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [stock, setStock] = useState(product ? String(product.stock) : '1')
  const [condition, setCondition] = useState('')
  const [features, setFeatures] = useState('')
  const [description, setDescription] = useState(product?.description ?? '')
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const [images, setImages] = useState<string[]>(product?.image_url ? [product.image_url] : [])

  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      const urls = await Promise.all(files.map((f) => uploadProductImage(userId, f)))
      setImages((prev) => [...prev, ...urls])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url))
  }

  async function handleGenerate() {
    if (!name.trim()) {
      setError('Add a product name first, then generate a description.')
      return
    }
    setGenerating(true)
    setError('')
    try {
      const categoryName = categories.find((c) => c.id === categoryId)?.name ?? null
      const text = await generateDescription({
        name: name.trim(),
        brand: sellerBrand,
        category: categoryName,
        condition: condition.trim() || null,
        features: features.trim() || null,
        price: price ? Number(price) : null,
      })
      setDescription(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate a description')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Product name is required.')
    if (!price || Number(price) < 0) return setError('Enter a valid price.')

    setSaving(true)
    setError('')
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        price: Number(price),
        stock: Math.max(0, Number(stock) || 0),
        category_id: categoryId || null,
        image_url: images[0] ?? null,
        is_active: isActive,
      }
      if (isEdit && product) {
        await updateProduct(product.id, payload)
      } else {
        const created = await createProduct(sellerId, payload)
        if (images.length > 1) await addProductImages(created.id, images.slice(1))
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the product')
    } finally {
      setSaving(false)
    }
  }

  const label = 'mb-1 block text-sm font-semibold text-muted'

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-[#e1e1e1] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-ink">{isEdit ? 'Edit Product' : 'Add Product'}</h3>
        <button type="button" onClick={onCancel} className="text-sm text-muted-2 hover:text-accent">
          <i className="fa-solid fa-xmark"></i> Close
        </button>
      </div>

      {error && <p className="mb-4 rounded bg-[#fdecec] px-3 py-2 text-sm text-accent">{error}</p>}

      {/* Images */}
      <label className={label}>Product Images</label>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {images.map((url) => (
          <div key={url} className="relative">
            <img src={url} alt="" className="h-20 w-20 rounded object-cover" />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white"
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        ))}
        <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded border border-dashed border-primary-border text-primary hover:bg-primary-soft">
          {uploading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-plus"></i>}
          <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
        </label>
      </div>
      <p className="mb-4 text-xs text-muted-2">First image is the main thumbnail.</p>

      <label className={label}>Name *</label>
      <input className="form-input mb-4" value={name} onChange={(e) => setName(e.target.value)} placeholder="Cartoon Astronaut T-Shirt" />

      <div className="flex flex-wrap gap-4">
        <div className="mb-4 flex-1">
          <label className={label}>Category</label>
          <select className="form-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-4 w-28">
          <label className={label}>Price ($) *</label>
          <input type="number" min={0} step="0.01" className="form-input" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="mb-4 w-24">
          <label className={label}>Stock</label>
          <input type="number" min={0} className="form-input" value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>
      </div>

      {/* Description helper */}
      <div className="mb-4 rounded border border-primary-border bg-primary-soft/40 p-4">
        <p className="mb-2 text-sm font-semibold text-ink">Auto-generate a description</p>
        <div className="flex flex-wrap gap-3">
          <input className="form-input flex-1" value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Condition (e.g. brand-new, premium)" />
          <input className="form-input flex-1" value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="Key features, comma-separated" />
        </div>
        <button type="button" onClick={handleGenerate} disabled={generating} className="btn-primary mt-3 text-sm">
          {generating ? 'Generating…' : '✨ Generate description'}
        </button>
      </div>

      <label className={label}>Description</label>
      <textarea className="form-input mb-4" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your product, or generate one above." />

      <label className="mb-4 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Visible to buyers (uncheck to save as a hidden draft)
      </label>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={saving || uploading}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}
        </button>
        <button type="button" onClick={onCancel} className="btn-normal border border-primary-border hover:bg-primary hover:text-white">
          Cancel
        </button>
      </div>
    </form>
  )
}
