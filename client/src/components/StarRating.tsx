interface StarRatingProps {
  /** Rating value 0–5 (fractional allowed in display mode). */
  value: number
  /** Font-size class for the stars, e.g. "text-sm". */
  sizeClass?: string
  /** When set, renders clickable stars and reports the chosen 1–5 value. */
  onChange?: (value: number) => void
  className?: string
}

/**
 * Five-star rating. Read-only by default (supports half stars); pass `onChange`
 * to make it an interactive input.
 */
export default function StarRating({ value, sizeClass = 'text-sm', onChange, className = '' }: StarRatingProps) {
  const interactive = typeof onChange === 'function'

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = value >= i
        const half = !filled && value >= i - 0.5
        const icon = filled ? 'fa-solid fa-star' : half ? 'fa-solid fa-star-half-stroke' : 'fa-regular fa-star'
        if (interactive) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange!(i)}
              aria-label={`${i} star${i > 1 ? 's' : ''}`}
              className={`${sizeClass} text-[#f5a623] transition hover:scale-110`}
            >
              <i className={value >= i ? 'fa-solid fa-star' : 'fa-regular fa-star'}></i>
            </button>
          )
        }
        return <i key={i} className={`${icon} ${sizeClass} text-[#f5a623]`}></i>
      })}
    </div>
  )
}
