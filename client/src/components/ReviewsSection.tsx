import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { deleteReview, hasPurchased, listReviews, saveReview } from '../api/reviews'
import type { Review } from '../types'
import StarRating from './StarRating'

export default function ReviewsSection({ productId }: { productId: string }) {
  const { user, profile } = useAuth()

  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [purchased, setPurchased] = useState(false)

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const myReview = useMemo(() => reviews.find((r) => r.user_id === user?.id) ?? null, [reviews, user])

  const load = useCallback(async () => {
    setReviews(await listReviews(productId))
    setLoading(false)
  }, [productId])

  useEffect(() => {
    let active = true
    setLoading(true)
    listReviews(productId).then((r) => {
      if (active) {
        setReviews(r)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [productId])

  // Check purchase eligibility once we know the user.
  useEffect(() => {
    if (!user) {
      setPurchased(false)
      return
    }
    let active = true
    hasPurchased(productId, user.id).then((p) => active && setPurchased(p))
    return () => {
      active = false
    }
  }, [productId, user])

  const summary = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, count: 0, dist: [0, 0, 0, 0, 0] }
    const dist = [0, 0, 0, 0, 0]
    let total = 0
    for (const r of reviews) {
      dist[r.rating - 1]++
      total += r.rating
    }
    return { avg: total / reviews.length, count: reviews.length, dist }
  }, [reviews])

  function startWriting() {
    setEditing(true)
    setError('')
    setRating(myReview?.rating ?? 0)
    setComment(myReview?.comment ?? '')
  }

  async function submit() {
    if (rating < 1) {
      setError('Please select a star rating.')
      return
    }
    if (!user) return
    setSubmitting(true)
    setError('')
    try {
      await saveReview(productId, user.id, {
        rating,
        comment,
        authorName: profile?.full_name ?? null,
        verified: purchased,
      })
      setEditing(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  async function removeMine() {
    if (!myReview || !confirm('Delete your review?')) return
    await deleteReview(myReview.id)
    setEditing(false)
    await load()
  }

  return (
    <section className="section-x border-t border-[#f0f0f0]">
      <h2 className="mb-6 text-2xl font-semibold text-ink">Ratings & Reviews</h2>

      {loading ? (
        <div className="py-8">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
        </div>
      ) : (
        <div className="flex flex-col gap-10 lg:flex-row">
          {/* Summary + write */}
          <div className="lg:w-1/3">
            <div className="rounded-xl border border-[#e6eaf0] p-5">
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-ink">{summary.avg.toFixed(1)}</span>
                <div className="pb-1">
                  <StarRating value={summary.avg} sizeClass="text-base" />
                  <p className="text-xs text-muted">{summary.count} review{summary.count === 1 ? '' : 's'}</p>
                </div>
              </div>

              {summary.count > 0 && (
                <div className="mt-4 space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const n = summary.dist[star - 1]
                    const pct = summary.count ? Math.round((n / summary.count) * 100) : 0
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs text-muted">
                        <span className="w-3">{star}</span>
                        <i className="fa-solid fa-star text-[10px] text-[#f5a623]"></i>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eef1f5]">
                          <div className="h-full rounded-full bg-[#f5a623]" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="w-6 text-right">{n}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="mt-5">
                {!user ? (
                  <p className="text-sm text-muted">
                    <Link to="/login" className="font-semibold text-primary">Sign in</Link> to write a review.
                  </p>
                ) : editing ? (
                  <div className="space-y-3">
                    <StarRating value={rating} sizeClass="text-2xl" onChange={setRating} />
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts (optional)…"
                      rows={4}
                      className="w-full rounded border border-[#e1e1e1] px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    {error && <p className="text-xs text-accent">{error}</p>}
                    <div className="flex gap-2">
                      <button className="btn-primary" onClick={submit} disabled={submitting}>
                        {submitting ? 'Saving…' : myReview ? 'Update review' : 'Submit review'}
                      </button>
                      <button
                        className="btn-normal border border-primary-border hover:bg-primary hover:text-white"
                        onClick={() => setEditing(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : myReview ? (
                  <div className="flex gap-3 text-sm">
                    <button className="font-semibold text-primary hover:underline" onClick={startWriting}>
                      Edit your review
                    </button>
                    <button className="font-semibold text-accent hover:underline" onClick={removeMine}>
                      Delete
                    </button>
                  </div>
                ) : (
                  <button className="btn-primary" onClick={startWriting}>
                    Write a review
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Review list */}
          <div className="flex-1">
            {reviews.length === 0 ? (
              <div className="rounded-xl border border-dashed border-primary-border py-14 text-center">
                <i className="fa-regular fa-star mb-3 text-4xl text-primary-border"></i>
                <p className="text-muted">No reviews yet. Be the first to review this product.</p>
              </div>
            ) : (
              <ul className="space-y-5">
                {reviews.map((r) => (
                  <li key={r.id} className="border-b border-[#f0f0f0] pb-5 last:border-0">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">{r.author_name || 'Anonymous'}</span>
                        {r.verified && (
                          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
                            <i className="fa-solid fa-circle-check mr-1"></i>Verified purchase
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-2">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <StarRating value={r.rating} sizeClass="text-xs" />
                    {r.comment && <p className="mt-2 text-sm leading-relaxed text-muted">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
