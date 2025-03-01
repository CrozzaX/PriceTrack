'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SaveProductButtonProps {
  productId: string;
  source?: string;
}

export default function SaveProductButton({ productId, source = 'Other' }: SaveProductButtonProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    
    // Check if product is already saved
    const checkSavedStatus = async () => {
      if (!token) return;
      
      try {
        const response = await fetch('/api/user/saved-products', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const isProductSaved = data.products.some(
            (product: any) => product._id === productId
          );
          setIsSaved(isProductSaved);
        }
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };
    
    checkSavedStatus();
  }, [productId]);
  
  const handleSaveClick = async () => {
    if (!isLoggedIn) {
      // Redirect to login
      router.push('/login');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (isSaved) {
        // Remove product from saved list
        const response = await fetch(`/api/user/saved-products/${productId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setIsSaved(false);
        }
      } else {
        // Add product to saved list
        const response = await fetch('/api/user/saved-products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ productId, source })
        });
        
        if (response.ok) {
          setIsSaved(true);
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
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
      {isSaved ? 'Saved' : 'Save Product'}
    </button>
  );
} 