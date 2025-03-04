'use client'; // Add this at the top

import { Product } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react'
import { useCompare } from '@/lib/context/CompareContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';
import { useSavedProducts } from '@/lib/context/SavedProductsContext';

interface Props {
  product: Product;
}

const ProductCard = ({ product }: Props) => {
  const router = useRouter();
  const { compareProducts, addToCompare, removeFromCompare } = useCompare();
  const { checkIfProductIsSaved, saveProduct, removeProduct } = useSavedProducts();
  const isInCompare = compareProducts.some(p => p._id === product._id);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Ensure the image URL is absolute and has a default
  const getImageUrl = (url: string | undefined): string => {
    if (!url) return '/assets/images/placeholder.jpg';
    return url.startsWith("//") ? `https:${url}` : url;
  };

  useEffect(() => {
    // Check if user is logged in (check both localStorage and cookies)
    const token = localStorage.getItem('token') || Cookies.get('token');
    setIsLoggedIn(!!token);
    
    // Check if product is already saved using the context
    if (token && product._id) {
      setIsSaved(checkIfProductIsSaved(product._id));
    }
  }, [product._id, checkIfProductIsSaved]);

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product._id) return; // Guard against undefined _id
    
    if (isInCompare) {
      removeFromCompare(product._id);
    } else {
      addToCompare(product);
    }
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      // Redirect to login with return URL
      const returnUrl = `/products`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    
    if (!product._id) {
      toast.error('Invalid product');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isSaved) {
        // Remove product from saved list using context
        const success = await removeProduct(product._id);
        if (success) {
          setIsSaved(false);
          toast.success('Product removed from saved items');
        } else {
          toast.error('Failed to remove product');
        }
      } else {
        // Add product to saved list using context
        const success = await saveProduct(product._id, 'ProductCard');
        if (success) {
          setIsSaved(true);
          toast.success('Product saved successfully');
        } else {
          toast.error('Failed to save product. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link href={`/products/${product._id}`} className="product-card relative">
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button
          onClick={handleSaveClick}
          className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
          disabled={isLoading}
          aria-label={isSaved ? "Remove from saved" : "Save product"}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill={isSaved ? "#FF7559" : "none"} 
            stroke={isSaved ? "#FF7559" : "currentColor"} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={`transition-all duration-300 ${isLoading ? "opacity-50" : ""} ${isSaved ? "animate-pulse" : ""}`}
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
        
        <button
          onClick={handleCompareClick}
          className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-all duration-300 transform hover:scale-110 hover:shadow-lg"
          aria-label={isInCompare ? "Remove from compare" : "Add to compare"}
        >
          {isInCompare ? (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#FF7559" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="transition-transform duration-300"
            >
              <path d="M5 12h14"></path>
            </svg>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="transition-transform duration-300"
            >
              <path d="M12 5v14M5 12h14"></path>
            </svg>
          )}
        </button>
      </div>

      <div className="product-image-container group">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skeleton-shine"></div>
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
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
