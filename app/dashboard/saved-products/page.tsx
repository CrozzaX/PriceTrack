'use client';

import { useState, useEffect } from 'react';
import SavedProductCard from '@/components/dashboard/SavedProductCard';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function SavedProductsPage() {
  const [savedProducts, setSavedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSavedProducts = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token') || Cookies.get('token');
        if (!token) return;

        const response = await fetch('/api/user/saved-products', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSavedProducts(data.products);
        } else {
          const error = await response.json();
          setError(error.message || 'Failed to fetch saved products');
        }
      } catch (error) {
        console.error('Error fetching saved products:', error);
        setError('An error occurred while fetching your saved products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedProducts();
  }, []);

  const handleRemoveProduct = async (productId: string) => {
    try {
      const token = localStorage.getItem('token') || Cookies.get('token');
      if (!token) return;

      const response = await fetch(`/api/user/saved-products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove the product from the state
        setSavedProducts((prev) => prev.filter((product: any) => product._id !== productId));
        toast.success('Product removed from saved items');
      } else {
        toast.error('Failed to remove product');
      }
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Saved Products</h1>
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7559]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          {error}
        </div>
      ) : savedProducts.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg p-8">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-gray-400 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
            />
          </svg>
          <h2 className="text-xl font-semibold mb-2">No Saved Products Yet</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Start tracking your favorite products by saving them. You'll be able to monitor price changes and get notified of deals.
          </p>
          <Link 
            href="/products" 
            className="inline-block px-6 py-3 bg-[#FF7559] text-white font-semibold rounded-md hover:bg-opacity-90 transition-all"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedProducts.map((product: any) => (
            <SavedProductCard 
              key={product._id} 
              product={product} 
              onRemove={() => handleRemoveProduct(product._id)} 
            />
          ))}
        </div>
      )}
    </>
  );
} 