import Newsletter from '../components/Newsletter'
import { blogPosts } from '../data/blog'

export default function Blog() {
  return (
    <>
      <section className="page-banner bg-blog-header [background-position:top_25%_right_0]">
        <h2>#readmore</h2>
        <p className="text-white">Read all case studies about our products!</p>
      </section>

      <section className="px-5 pt-24 sm:px-10 lg:px-[150px] lg:pt-[150px]">
        {blogPosts.map((post) => (
          <div key={post.id} className="relative flex w-full flex-col items-start gap-8 pb-24 md:flex-row md:items-center">
            <div className="w-full md:mr-10 md:w-1/2">
              <img className="h-[300px] w-full object-cover" src={post.image} alt={post.title} />
            </div>
            <div className="w-full md:w-1/2">
              <h4 className="text-xl font-semibold text-ink">{post.title}</h4>
              <p className="my-4 text-muted">{post.excerpt}</p>
              <a
                href="#"
                className="relative text-[11px] font-bold text-black transition after:absolute after:top-1 after:-right-[60px] after:h-px after:w-[50px] after:bg-black after:content-[''] hover:text-primary hover:after:bg-primary"
              >
                CONTINUE READING
              </a>
            </div>
            <h1 className="absolute -top-10 left-0 -z-10 text-[70px] font-bold text-[#c9cbce]">{post.date}</h1>
          </div>
        ))}
      </section>

      <section className="section-x text-center">
        <a href="#" className="rounded bg-primary px-5 py-[15px] font-semibold text-white">1</a>{' '}
        <a href="#" className="rounded bg-primary px-5 py-[15px] font-semibold text-white">2</a>{' '}
        <a href="#" className="rounded bg-primary px-5 py-[15px] font-semibold text-white">
          <i className="fa-solid fa-arrow-right-long"></i>
        </a>
      </section>

      <Newsletter />
    </>
  )
}
