'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';

interface ProductActionsProps {
  productId: string;
  initialLikes?: number; // This will be ignored for the heart icon
  productUrl?: string; // URL to the product on the e-commerce site
}

export default function ProductActions({ productId, initialLikes = 0, productUrl }: ProductActionsProps) {
  const router = useRouter();
  // Always start with zero likes regardless of initialLikes
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in (check both localStorage and cookies)
    const token = localStorage.getItem('token') || Cookies.get('token');
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
            (p: any) => p._id === productId
          );
          setIsSaved(isProductSaved);
        }
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };
    
    // Check if user has liked this product (could be stored in localStorage for simplicity)
    const likedProducts = JSON.parse(localStorage.getItem('likedProducts') || '[]');
    if (likedProducts.includes(productId)) {
      setIsLiked(true);
      setLikes(1); // If the user has liked it before, set to 1
    }
    
    checkSavedStatus();
  }, [productId]);

  const handleLikeClick = () => {
    if (!isLoggedIn) {
      // Redirect to login with return URL
      const returnUrl = `/products/${productId}`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    
    // Toggle like status
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikes(newIsLiked ? 1 : 0);
    
    // Store liked status in localStorage
    const likedProducts = JSON.parse(localStorage.getItem('likedProducts') || '[]');
    if (newIsLiked) {
      if (!likedProducts.includes(productId)) {
        likedProducts.push(productId);
      }
    } else {
      const index = likedProducts.indexOf(productId);
      if (index > -1) {
        likedProducts.splice(index, 1);
      }
    }
    localStorage.setItem('likedProducts', JSON.stringify(likedProducts));
    
    // Here you would typically call an API to update the like count
    // For now, we'll just show a toast
    toast.success(newIsLiked ? 'Added like' : 'Removed like');
  };

  const handleSaveClick = async () => {
    if (!isLoggedIn) {
      // Redirect to login with return URL
      const returnUrl = `/products/${productId}`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token') || Cookies.get('token');
      
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
          toast.success('Product removed from saved items');
        } else {
          toast.error('Failed to remove product');
        }
      } else {
        // Add product to saved list
        const response = await fetch('/api/user/saved-products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ productId, source: 'Other' })
        });
        
        if (response.ok) {
          setIsSaved(true);
          toast.success('Product saved successfully');
        } else {
          const data = await response.json();
          toast.error(data.message || 'Failed to save product');
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareClick = () => {
    if (!productUrl) {
      toast.error('Product URL not available');
      return;
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(productUrl)
      .then(() => {
        toast.success('Product link copied to clipboard!');
      })
      .catch((error) => {
        console.error('Error copying to clipboard:', error);
        toast.error('Failed to copy link. Please try again.');
      });
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handleLikeClick}
        className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill={isLiked ? "#FF7559" : "none"} 
          stroke={isLiked ? "#FF7559" : "currentColor"} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <span className="text-sm font-medium">{likes}</span>
      </button>
      
      <button
        onClick={handleSaveClick}
        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        disabled={isLoading}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill={isSaved ? "#FF7559" : "none"} 
          stroke={isSaved ? "#FF7559" : "currentColor"} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={isLoading ? "opacity-50" : ""}
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
      
      <button
        onClick={handleShareClick}
        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        title="Copy product link to clipboard"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
      </button>
    </div>
  );
} 