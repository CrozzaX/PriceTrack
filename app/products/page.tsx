import Image from 'next/image';
import HeroCarousel from "@/components/HeroCarousel";
import Searchbar from "@/components/Searchbar";
import { getAllProducts } from "@/lib/actions";
import ProductCard from "@/components/ProductCard";

export default async function ProductsPage() {
  const allProducts = await getAllProducts();

  // Make sure we have products and sort them by newest first
  const sortedProducts = allProducts?.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="w-full min-h-screen flex flex-col pt-20">
      <section className="px-6 md:px-20 py-24">
        <div className="flex max-xl:flex-col gap-16">
          <div className="flex flex-col justify-center"> 
            <p className="small-text">
              Smart Shopping Starts Here:
              <Image 
                src="/assets/icons/arrow-right.svg"
                alt="arrow-right"
                width={16}
                height={16}
              />
            </p>

            <h1 className="head-text">
              Track Your Products with
              <span className="text-primary"> PriceWise</span>
            </h1>

            <p className="mt-6">
              Enter a product URL below to start tracking its price. We support major retailers including Amazon, Best Buy, and more.
            </p>

            <Searchbar />
          </div>

          <HeroCarousel />
        </div>
      </section>

      <section className="trending-section">
        <h2 className="section-text">Trending Products</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedProducts?.map((product) => (
            <div key={product._id} className="product-wrapper">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
} 