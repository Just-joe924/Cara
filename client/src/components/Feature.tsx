const features = [
  { img: '/img/features/f1.png', label: 'Free Shipping', badge: 'bg-[#fddde4]' },
  { img: '/img/features/f2.png', label: 'Online Order', badge: 'bg-[#cdebbc]' },
  { img: '/img/features/f3.png', label: 'Save Money', badge: 'bg-[#d1e8f2]' },
  { img: '/img/features/f4.png', label: 'Promotions', badge: 'bg-[#cdd4f8]' },
  { img: '/img/features/f5.png', label: 'Happy Sell', badge: 'bg-[#f6dbf6]' },
  { img: '/img/features/f6.png', label: '24/7 Support', badge: 'bg-[#fff2e5]' },
]

export default function Feature() {
  return (
    <section className="section-x flex flex-wrap items-center justify-center gap-y-8 sm:justify-between">
      {features.map((f) => (
        <div
          key={f.label}
          className="w-[155px] rounded border border-primary-border p-[15px] text-center shadow-[20px_20px_34px_rgba(0,0,0,0.03)] transition hover:shadow-[10px_10px_54px_rgba(70,62,221,0.1)] sm:w-[180px] sm:px-[15px] sm:py-[25px]"
        >
          <img className="mb-2.5 w-full" src={f.img} alt={f.label} />
          <h6 className={`inline-block rounded px-2 pb-1.5 pt-[9px] font-semibold leading-none text-primary ${f.badge}`}>
            {f.label}
          </h6>
        </div>
      ))}
    </section>
  )
}
