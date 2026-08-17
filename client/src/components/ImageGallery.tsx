import { useState } from 'react'

/**
 * Product image gallery: a large main image with a row of clickable thumbnails
 * beneath it. The first image is the default view.
 */
export default function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0)
  if (images.length === 0) {
    return <div className="aspect-square w-full rounded-lg bg-[#f0f2f5]" />
  }

  const current = images[Math.min(active, images.length - 1)]

  return (
    <div>
      <img className="aspect-square w-full rounded-lg object-cover" src={current} alt={alt} />
      {images.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              className={`h-16 w-16 overflow-hidden rounded-md border-2 transition ${
                i === active ? 'border-primary' : 'border-transparent hover:border-primary-border'
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
