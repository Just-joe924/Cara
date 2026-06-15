export default function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 pt-[7px]">
      {Array.from({ length: 5 }, (_, i) => (
        <i
          key={i}
          className={`fas fa-star text-xs ${i < rating ? 'text-star' : 'text-[#cfd2d4]'}`}
        ></i>
      ))}
    </div>
  )
}
