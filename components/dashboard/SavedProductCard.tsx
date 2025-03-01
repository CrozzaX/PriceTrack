'use client';

import Image from 'next/image';
import Link from 'next/link';

interface SavedProductCardProps {
  product: any;
  onRemove: () => void;
}

export default function SavedProductCard({ product, onRemove }: SavedProductCardProps) {
  const formatPrice = (price: number) => {
    // Handle invalid currency codes or non-ASCII characters
    let currencyCode = 'USD';
    
    // Check if product.currency exists and is a valid currency code
    if (product.currency && /^[A-Z]{3}$/.test(product.currency)) {
      currencyCode = product.currency;
    }
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode
      }).format(price);
    } catch (error) {
      // Fallback to simple formatting if NumberFormat fails
      return `$${price.toFixed(2)}`;
    }
  };

  const calculateDiscountPercentage = (currentPrice: number, originalPrice: number) => {
    if (originalPrice <= 0) return 0;
    const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    return Math.round(discount);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative pt-[56.25%]">
        <Image
          src={product.image || '/placeholder-product.png'}
          alt={product.title}
          fill
          className="object-cover"
        />
        
        {product.discountRate > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{calculateDiscountPercentage(product.currentPrice, product.originalPrice)}%
          </div>
        )}
        
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
          aria-label="Remove product"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2 h-12">{product.title}</h3>
        
        <div className="mt-2 flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900">{formatPrice(product.currentPrice)}</p>
            {product.originalPrice > product.currentPrice && (
              <p className="text-sm text-gray-500 line-through">{formatPrice(product.originalPrice)}</p>
            )}
          </div>
          
          <Link 
            href={`/products/${product._id}`} 
            className="text-[#FF7559] hover:underline text-sm font-medium"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
} 