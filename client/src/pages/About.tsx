import Feature from '../components/Feature'
import Newsletter from '../components/Newsletter'

export default function About() {
  return (
    <>
      <section className="page-banner bg-about-header [background-position:top_25%_right_0]">
        <h2>#Know Us</h2>
        <p className="text-white">
          Discover our story, values, and the craftsmanship behind every product we create.
        </p>
      </section>

      <section className="section-x flex flex-col items-center gap-0 md:flex-row">
        <img className="h-auto w-full md:w-1/2" src="/img/about/a6.jpg" alt="About Cara" />
        <div className="pt-6 md:pl-10 md:pt-0">
          <h2 className="text-3xl text-ink sm:text-[46px]">Who Are We?</h2>
          <p className="my-4 text-muted">
            We are passionate about creating fashion that reflects individuality and confidence. Our
            brand is built on the belief that everyone deserves access to stylish, high-quality
            clothing without compromise. From design to delivery, we focus on craftsmanship, comfort,
            and consistency, ensuring every piece meets our standards. More than just a store, we are
            a community driven by creativity, authenticity, and a commitment to helping you look and
            feel your best.
          </p>
          <abbr title="Cara" className="text-muted no-underline">
            Create stunning looks with as much or as little control as you like thanks to a choice of
            basic and creative collections.
          </abbr>
        </div>
      </section>

      <section className="section-x text-center">
        <h1 className="text-[38px] font-bold text-ink sm:text-[64px]">
          Download Our <a href="#" className="text-primary">App</a>
        </h1>
        <div className="mx-auto mt-8 h-full w-full md:w-[70%]">
          <video className="w-full rounded-[20px]" autoPlay loop muted playsInline>
            <source src="/img/about/1.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      <Feature />

      <Newsletter />
    </>
  )
}
