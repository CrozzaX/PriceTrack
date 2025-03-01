'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import Cookies from 'js-cookie';

interface SavedProductsContextType {
  savedProducts: any[];
  isLoading: boolean;
  error: string | null;
  checkIfProductIsSaved: (productId: string) => boolean;
  saveProduct: (productId: string, source?: string) => Promise<boolean>;
  removeProduct: (productId: string) => Promise<boolean>;
  refreshSavedProducts: () => Promise<void>;
  lastUpdated: number;
}

const SavedProductsContext = createContext<SavedProductsContextType | undefined>(undefined);

export function SavedProductsProvider({ children }: { children: ReactNode }) {
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchSavedProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token') || Cookies.get('token');
      if (!token) {
        setSavedProducts([]);
        setIsLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch('/api/user/saved-products', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        signal: controller.signal,
        cache: 'no-store' // Ensure we get fresh data
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setSavedProducts(data.products);
        setLastUpdated(Date.now());
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch saved products');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Saved products fetch request timed out');
      } else {
        console.error('Error fetching saved products:', error);
        setError('An error occurred while fetching your saved products');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize saved products on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      setIsInitialized(true);
      fetchSavedProducts();
    }
  }, [fetchSavedProducts, isInitialized]);

  // Check if a product is saved
  const checkIfProductIsSaved = useCallback((productId: string) => {
    return savedProducts.some(product => product._id === productId);
  }, [savedProducts]);

  // Save a product
  const saveProduct = useCallback(async (productId: string, source: string = 'Other') => {
    try {
      const token = localStorage.getItem('token') || Cookies.get('token');
      if (!token) return false;

      const response = await fetch('/api/user/saved-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId, source })
      });

      if (response.ok) {
        // Get the product details from the response if available
        const data = await response.json();
        if (data.product) {
          setSavedProducts(prev => [...prev, data.product]);
        } else {
          // If product details not in response, refresh the list
          fetchSavedProducts();
        }
        setLastUpdated(Date.now());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving product:', error);
      return false;
    }
  }, [fetchSavedProducts]);

  // Remove a product
  const removeProduct = useCallback(async (productId: string) => {
    try {
      const token = localStorage.getItem('token') || Cookies.get('token');
      if (!token) return false;

      const response = await fetch(`/api/user/saved-products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSavedProducts(prev => prev.filter(product => product._id !== productId));
        setLastUpdated(Date.now());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing product:', error);
      return false;
    }
  }, []);

  // Refresh saved products
  const refreshSavedProducts = useCallback(async () => {
    await fetchSavedProducts();
  }, [fetchSavedProducts]);

  return (
    <SavedProductsContext.Provider
      value={{
        savedProducts,
        isLoading,
        error,
        checkIfProductIsSaved,
        saveProduct,
        removeProduct,
        refreshSavedProducts,
        lastUpdated
      }}
    >
      {children}
    </SavedProductsContext.Provider>
  );
}

export function useSavedProducts() {
  const context = useContext(SavedProductsContext);
  if (context === undefined) {
    throw new Error('useSavedProducts must be used within a SavedProductsProvider');
  }
  return context;
} 