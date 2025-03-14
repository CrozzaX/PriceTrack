'use client';

import { useState, useEffect } from 'react';
import { useSavedProducts } from '@/lib/context/SavedProductsContext';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';
import ProductLimitWarning from '@/components/subscription/ProductLimitWarning';

export default function SavedProductsPage() {
  const { savedProducts, isLoading, error, refreshSavedProducts } = useSavedProducts();
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token') || Cookies.get('token');
    setIsAuthenticated(!!token);
    
    // Refresh saved products
    refreshSavedProducts();
  }, [refreshSavedProducts]);

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 py-10">
        <div className="text-center max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V7a3 3 0 00-3-3H6a3 3 0 00-3 3v4a3 3 0 003 3h4a3 3 0 003-3z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sign in to view saved products</h2>
          <p className="text-gray-600 mb-8">
            You need to be signed in to view and manage your saved products.
          </p>
          <Link 
            href="/login?returnUrl=/dashboard/saved-products" 
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#FF7559] hover:bg-opacity-90 transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Saved Products</h1>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-gray-100 rounded-lg h-[350px]"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Saved Products</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-700">Error loading saved products. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!savedProducts || savedProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        <div className="text-center max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No saved products yet</h2>
          <p className="text-gray-600 mb-8">
            Start tracking prices by saving products you're interested in.
          </p>
          <Link 
            href="/products" 
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#FF7559] hover:bg-opacity-90 transition-all"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Saved Products</h1>
        <Link 
          href="/products" 
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#FF7559] hover:bg-opacity-90 transition-all"
        >
          Browse More
        </Link>
      </div>

      {/* Product limit warning */}
      <ProductLimitWarning currentCount={savedProducts.length} />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {savedProducts.map((product) => (
          <motion.div 
            key={product._id} 
            className="product-wrapper"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </div>
  );
} 