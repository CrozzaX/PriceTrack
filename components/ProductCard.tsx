'use client'; // Add this at the top

import { Product } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react'
import { useCompare } from '@/lib/context/CompareContext';

interface Props {
  product: Product;
}

const ProductCard = ({ product }: Props) => {
  const { compareProducts, addToCompare, removeFromCompare } = useCompare();
  const isInCompare = compareProducts.some(p => p._id === product._id);
  
  // Ensure the image URL is absolute and has a default
  const getImageUrl = (url: string | undefined): string => {
    if (!url) return '/assets/images/placeholder.jpg';
    return url.startsWith("//") ? `https:${url}` : url;
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product._id) return; // Guard against undefined _id
    
    if (isInCompare) {
      removeFromCompare(product._id);
    } else {
      addToCompare(product);
    }
  };

  return (
    <Link href={`/products/${product._id}`} className="product-card relative">
      <button
        onClick={handleCompareClick}
        className="absolute top-2 right-2 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
      >
        {isInCompare ? (
          <span className="text-2xl text-gray-600 leading-none mb-1">−</span>
        ) : (
          <span className="text-2xl text-gray-600 leading-none">+</span>
        )}
      </button>

      <div className="product-image-container">
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-contain p-2"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      
      <div className="product-details">
        <h3 className="product-title" title={product.title}>
          {product.title}
        </h3>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="product-category">
            {product.category}
          </div>
          <div className="product-price">
            {product.currency}{product.currentPrice.toLocaleString()}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
