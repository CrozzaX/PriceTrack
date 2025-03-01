'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';
import { useSavedProducts } from '@/lib/context/SavedProductsContext';

interface SaveProductButtonProps {
  productId: string;
  source?: string;
}

export default function SaveProductButton({ productId, source = 'Other' }: SaveProductButtonProps) {
  const router = useRouter();
  const { checkIfProductIsSaved, saveProduct, removeProduct } = useSavedProducts();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in (check both localStorage and cookies)
    const token = localStorage.getItem('token') || Cookies.get('token');
    setIsLoggedIn(!!token);
    
    // Check if product is already saved using the context
    if (token) {
      setIsSaved(checkIfProductIsSaved(productId));
    }
  }, [productId, checkIfProductIsSaved]);
  
  const handleSaveClick = async () => {
    if (!isLoggedIn) {
      // Redirect to login with return URL
      const returnUrl = `/products/${productId}`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isSaved) {
        // Remove product from saved list using context
        const success = await removeProduct(productId);
        if (success) {
          setIsSaved(false);
          toast.success('Product removed from saved items');
        } else {
          toast.error('Failed to remove product');
        }
      } else {
        // Add product to saved list using context
        const success = await saveProduct(productId, source);
        if (success) {
          setIsSaved(true);
          toast.success('Product saved successfully');
        } else {
          toast.error('Failed to save product');
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleSaveClick}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
        isSaved 
          ? 'bg-[#FF7559] text-white' 
          : 'bg-white border border-[#FF7559] text-[#FF7559] hover:bg-[#FF7559] hover:text-white'
      } disabled:opacity-70 disabled:cursor-not-allowed`}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill={isSaved ? "currentColor" : "none"} 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
      </svg>
      {isLoading ? 'Processing...' : (isSaved ? 'Saved' : 'Save Product')}
    </button>
  );
} 