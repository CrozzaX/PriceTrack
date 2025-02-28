import React from 'react';
import Image from 'next/image';

interface ProductPriceProps {
  currentPrice: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  currency?: string;
}

const ProductPrice = ({
  currentPrice,
  originalPrice,
  rating,
  reviewCount,
  currency = '₹'
}: ProductPriceProps) => {
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col">
        <div className="text-3xl font-bold text-gray-900">
          {currency} {currentPrice.toLocaleString()}
        </div>
        {originalPrice && (
          <div className="text-gray-500 line-through">
            {currency} {originalPrice.toLocaleString()}
          </div>
        )}
      </div>

      {(rating || reviewCount) && (
        <div className="flex items-center gap-2">
          {rating && (
            <div className="flex items-center gap-1 px-3 py-2 bg-[#FBF3EA] rounded-full">
              <Image
                src="/assets/icons/star.svg"
                alt="Rating"
                width={16}
                height={16}
              />
              <span className="text-sm font-medium">{rating}</span>
            </div>
          )}
          
          {reviewCount && (
            <div className="flex items-center gap-1 px-3 py-2 bg-[#F3F4F6] rounded-full">
              <Image
                src="/assets/icons/comment.svg"
                alt="Reviews"
                width={16}
                height={16}
              />
              <span className="text-sm font-medium">{reviewCount} Reviews</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductPrice; 