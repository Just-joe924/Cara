import { Link } from 'react-router-dom'
import Feature from '../components/Feature'
import Newsletter from '../components/Newsletter'
import ProductCard from '../components/ProductCard'
import { featuredProducts, newProducts } from '../data/products'

const gridClass = 'grid grid-cols-1 gap-7 pt-2.5 sm:grid-cols-2 lg:grid-cols-4'

export default function Home() {
  return (
    <>
      <section className="flex h-[40vh] w-full flex-col items-start justify-center bg-hero bg-cover [background-position:top_25%_right_0] px-5 sm:px-20 lg:h-[90vh]">
        <h4 className="pb-[15px] text-xl text-ink">Trade-in-offer</h4>
        <h2 className="text-[32px] font-semibold text-ink sm:text-[46px]">Super value deals</h2>
        <h1 className="text-[38px] font-bold text-primary sm:text-[64px]">On all products</h1>
        <p className="my-4 text-muted">Save more with coupons and up to 70% off!</p>
        <Link to="/shop">
          <button className="cursor-pointer bg-[url('/img/button.png')] bg-no-repeat py-[14px] pl-[65px] pr-20 text-[15px] font-bold text-primary">
            Shop Now
          </button>
        </Link>
      </section>

      <Feature />

      <section className="section-x text-center">
        <h2 className="text-3xl text-ink sm:text-[46px]">Featured Products</h2>
        <p className="text-muted">Summer Collection New Modern Design</p>
        <div className={gridClass}>
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="my-10 flex h-[40vh] flex-col items-center justify-center bg-banner-repair bg-cover bg-center text-center">
        <h4 className="text-base text-white">Repair Services</h4>
        <h2 className="py-2.5 text-3xl text-white">
          Up to <span className="text-accent">70% off</span> on all T-Shirts &amp; Accessories
        </h2>
        <Link to="/shop">
          <button className="btn-normal hover:bg-primary hover:text-white">Explore More</button>
        </Link>
      </section>

      <section className="section-x text-center">
        <h2 className="text-3xl text-ink sm:text-[46px]">New Arrivals</h2>
        <p className="text-muted">Summer Collection New Modern Design</p>
        <div className={gridClass}>
          {newProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="section-x flex flex-col gap-5 sm:flex-row sm:justify-between">
        <div className="group flex min-h-[50vh] flex-1 flex-col items-start justify-center bg-[url('/img/banner/b17.jpg')] bg-cover bg-center p-[30px]">
          <h4 className="text-xl font-light text-white">Crazy Deals</h4>
          <h2 className="text-[28px] font-extrabold text-white">Buy 1 Get 1 Free</h2>
          <span className="pb-[15px] text-sm font-medium text-white">The best classic dress is on sale at Cara</span>
          <Link to="/shop">
            <button className="btn-white">Learn More</button>
          </Link>
        </div>
        <div className="group flex min-h-[50vh] flex-1 flex-col items-start justify-center bg-[url('/img/banner/b10.jpg')] bg-cover bg-center p-[30px]">
          <h4 className="text-xl font-light text-white">Spring/Summer</h4>
          <h2 className="text-[28px] font-extrabold text-white">Upcoming Season</h2>
          <span className="pb-[15px] text-sm font-medium text-white">The best classic dress is on sale at Cara</span>
          <Link to="/shop">
            <button className="btn-white">Collection</button>
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-5 px-5 sm:flex-row sm:justify-between sm:px-10 lg:px-20">
        <div className="flex min-h-[30vh] flex-1 flex-col justify-center bg-[url('/img/banner/b7.jpg')] bg-cover bg-center p-5">
          <h2 className="text-[22px] font-black text-white">SEASONAL SALE</h2>
          <h3 className="text-[15px] font-extrabold text-accent-2">Winter Collection -50% OFF</h3>
        </div>
        <div className="flex min-h-[30vh] flex-1 flex-col justify-center bg-[url('/img/banner/b4.jpg')] bg-cover bg-center p-5">
          <h2 className="text-[22px] font-black text-white">NEW FOOTWEAR COLLECTION</h2>
          <h3 className="text-[15px] font-extrabold text-accent-2">Spring/Summer 2024</h3>
        </div>
        <div className="flex min-h-[30vh] flex-1 flex-col justify-center bg-[url('/img/banner/b18.jpg')] bg-cover bg-center p-5">
          <h2 className="text-[22px] font-black text-white">T-SHIRTS</h2>
          <h3 className="text-[15px] font-extrabold text-accent-2">New Trendy Prints</h3>
        </div>
      </section>

      <Newsletter />
    </>
  )
}
