// app/products/[id]/page.tsx
import Modal from "@/components/Modal";
import PriceStats from "@/components/PriceStats";
import ProductCard from "@/components/ProductCard";
import ProductActions from "@/components/ProductActions";
import { getProductById, getSimilarProducts } from "@/lib/actions"
import { formatNumber } from "@/lib/utils";
import { Product } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import PriceHistoryChart from '@/components/PriceHistoryChart';

interface Props {
  params: Promise<{ id: string }> | { id: string }
}

export default async function ProductDetails({ params }: Props) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;

    if (!productId) {
      redirect('/');
    }

    const product = await getProductById(productId);

    if (!product) {
      redirect('/');
    }

    const similarProducts = await getSimilarProducts(productId);

    return (
      <div className="product-container">
        <div className="flex gap-28 xl:flex-row flex-col">
          <div className="product-image">
            <Image 
              src={product.image}
              alt={product.title}
              width={580}
              height={400}
              className="mx-auto"
            />
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-start gap-5 flex-wrap pb-6">
              <div className="flex flex-col gap-3">
                <p className="text-[28px] text-secondary font-semibold">
                  {product.title}
                </p>

                <Link
                  href={product.url}
                  target="_blank"
                  className="text-base text-black opacity-50"
                >
                  Visit Product
                </Link>
              </div>

              <ProductActions 
                productId={productId} 
                initialLikes={product.reviewsCount || 0} 
                productUrl={product.url}
              />
            </div>

            <div className="product-info">
              <div className="flex flex-col gap-2">
                <p className="text-[34px] text-secondary font-bold">
                  {product.currency} {formatNumber(product.currentPrice)}
                </p>
                <p className="text-[21px] text-black opacity-50 line-through">
                  {product.currency} {formatNumber(product.originalPrice)}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <div className="product-stars">
                    <Image 
                      src="/assets/icons/star.svg"
                      alt="star"
                      width={16}
                      height={16}
                    />
                    <p className="text-sm text-primary-orange font-semibold">
                      {product.stars || '25'}
                    </p>
                  </div>

                  <div className="product-reviews">
                    <Image 
                      src="/assets/icons/comment.svg"
                      alt="comment"
                      width={16}
                      height={16}
                    />
                    <p className="text-sm text-secondary font-semibold">
                      {product.reviewsCount} Reviews
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="my-7">
              <PriceStats 
                currentPrice={product.currentPrice}
                averagePrice={product.averagePrice}
                highestPrice={product.highestPrice}
                lowestPrice={product.lowestPrice}
                currency={product.currency}
              />
            </div>

            <div className="my-7">
              <h3 className="text-2xl text-secondary font-semibold mb-4">Price History</h3>
              <PriceHistoryChart priceHistory={product.priceHistory} />
            </div>

            <div className="flex gap-4 mt-6">
              {/* Modal component moved below */}
            </div>
          </div>
        </div>

        {/* Add the Track button (Modal) below the price history section */}
        <div className="flex justify-center my-8">
          <Modal productId={productId} />
        </div>

        <div className="flex flex-col gap-5">
          <h3 className="text-2xl text-secondary font-semibold">
            Product Description
          </h3>

          <div className="flex flex-col gap-4">
            {product?.description?.split('\n').filter(Boolean).map((line: string, index: number) => (
              <p key={index} className="text-black-100">
                {line}
              </p>
            ))}
          </div>
        </div>

        <Link 
          href={product.url} 
          target="_blank" 
          className="bg-[#111827] text-white rounded-full px-6 py-3 w-fit mx-auto flex items-center justify-center gap-3 min-w-[200px] hover:opacity-90 transition-opacity mt-8"
        >
          <Image 
            src="/assets/icons/bag.svg"
            alt="check"
            width={22}
            height={22}
          />
          <span className="text-base text-white">Buy Now</span>
        </Link>

        {similarProducts && similarProducts?.length > 0 && (
          <div className="py-14 flex flex-col gap-2 w-full">
            <p className="section-text">Similar Products</p>

            <div className="flex flex-wrap justify-center gap-6 mt-7">
              {similarProducts.map((product) => (
                <div key={product._id} className="product-wrapper">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error in ProductDetails:', error);
    redirect('/');
  }
}