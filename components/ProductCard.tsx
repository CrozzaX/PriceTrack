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
    <Link href={`/products/${product._id || ''}`} className="product-card">
      <button 
        onClick={handleCompareClick}
        className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-100"
      >
        <Image 
          src={isInCompare ? "/assets/icons/check.svg" : "/assets/icons/compare-arrows.svg"}
          alt="+"
          width={16}
          height={16}
          className="object-contain"
        />
      </button>

      <div className="product-card_img-container">
        <Image 
          src={getImageUrl(product.image)}
          alt={product.title || 'Product Image'}
          width={200}
          height={200}
          className="product-card_img"
        />
      </div>

      <div className="product-card_content">
        <h3 className="product-title">{product.title || 'Untitled Product'}</h3>

        <div className="flex justify-between items-center mt-2">
          <p className="text-black opacity-50 text-sm capitalize">
            {product.category || 'General'}
          </p>

          <p className="text-secondary font-semibold">
            <span>{product.currency || '$'}</span>
            <span>{typeof product.currentPrice === 'number' ? product.currentPrice.toFixed(2) : '0.00'}</span>
          </p>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
