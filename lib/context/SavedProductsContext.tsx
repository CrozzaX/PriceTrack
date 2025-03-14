'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import Cookies from 'js-cookie';
import { Product } from '@/types';

interface SavedProduct extends Product {
  savedInfo?: {
    dateAdded: Date;
    source: 'Amazon' | 'Flipkart' | 'Myntra' | 'ProductCard' | 'ProductDetail' | 'Other';
  };
}

interface SavedProductsContextType {
  savedProducts: SavedProduct[];
  isLoading: boolean;
  error: string | null;
  checkIfProductIsSaved: (productId: string) => boolean;
  saveProduct: (productId: string, source?: string) => Promise<boolean>;
  removeProduct: (productId: string) => Promise<boolean>;
  refreshSavedProducts: () => Promise<void>;
  lastUpdated: number;
}

const SavedProductsContext = createContext<SavedProductsContextType | undefined>(undefined);

// Cache control constants - increased to reduce API calls
const CACHE_DURATION = 300000; // 5 minutes in milliseconds (increased from 1 minute)
const CACHE_KEY = 'savedProductsCache';

// Debounce function to prevent rapid successive API calls
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function SavedProductsProvider({ children }: { children: ReactNode }) {
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const fetchInProgressRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);

  // Try to load from cache first
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { products, timestamp } = JSON.parse(cachedData);
          const now = Date.now();
          
          // Use cached data if it's recent enough
          if (now - timestamp < CACHE_DURATION) {
            setSavedProducts(products);
            setLastUpdated(timestamp);
            setIsLoading(false);
            lastFetchTimeRef.current = timestamp;
          }
        }
      } catch (error) {
        // If cache parsing fails, just fetch from server
        console.error('Error reading from cache:', error);
      }
    }
  }, [isInitialized]);

  const fetchSavedProducts = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous fetches
    if (fetchInProgressRef.current) return;
    
    // Check if we've fetched recently (unless forced refresh)
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTimeRef.current < CACHE_DURATION) {
      setIsLoading(false);
      return;
    }
    
    try {
      fetchInProgressRef.current = true;
      setIsLoading(true);
      
      const token = localStorage.getItem('token') || Cookies.get('token');
      if (!token) {
        setSavedProducts([]);
        setIsLoading(false);
        setError('Authentication required. Please sign in.');
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
        setSavedProducts(data.products || []);
        
        lastFetchTimeRef.current = now;
        setLastUpdated(now);
        setError(null); // Clear any previous errors
        
        // Cache the products data
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          products: data.products || [],
          timestamp: now
        }));
      } else {
        // Handle different error status codes
        if (response.status === 401) {
          setError('Your session has expired. Please sign in again.');
          // Clear invalid tokens
          localStorage.removeItem('token');
          Cookies.remove('token');
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to fetch saved products');
        }
        setSavedProducts([]);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Saved products fetch request timed out');
        setError('Request timed out. Please try again.');
      } else {
        console.error('Error fetching saved products:', error);
        setError('An error occurred while fetching your saved products');
      }
      setSavedProducts([]);
    } finally {
      setIsLoading(false);
      fetchInProgressRef.current = false;
    }
  }, []);

  // Debounced version of fetchSavedProducts to prevent rapid API calls
  const debouncedFetchSavedProducts = useCallback(
    debounce((forceRefresh: boolean) => fetchSavedProducts(forceRefresh), 300),
    [fetchSavedProducts]
  );

  // Initialize saved products on mount - only once
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      setIsInitialized(true);
      
      // Check for authentication token
      const token = localStorage.getItem('token') || Cookies.get('token');
      if (token) {
        // Fetch saved products only if cache is expired or empty
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (!cachedData) {
          fetchSavedProducts(false);
        } else {
          try {
            const { timestamp } = JSON.parse(cachedData);
            const now = Date.now();
            if (now - timestamp >= CACHE_DURATION) {
              fetchSavedProducts(false);
            }
          } catch (error) {
            fetchSavedProducts(false);
          }
        }
        
        // Set up event listener for auth changes - use a single listener
        const handleAuthChange = () => {
          const currentToken = localStorage.getItem('token') || Cookies.get('token');
          if (currentToken) {
            debouncedFetchSavedProducts(false);
          } else {
            setSavedProducts([]);
          }
        };
        
        // Use a custom event instead of storage event to reduce unnecessary calls
        window.addEventListener('authchange', handleAuthChange);
        
        return () => {
          window.removeEventListener('authchange', handleAuthChange);
        };
      } else {
        // No token, clear saved products
        setSavedProducts([]);
        setIsLoading(false);
      }
    }
  }, [fetchSavedProducts, debouncedFetchSavedProducts, isInitialized]);

  // Check if a product is saved - use memory cache to avoid API calls
  const checkIfProductIsSaved = useCallback((productId: string) => {
    return savedProducts.some(product => product._id === productId);
  }, [savedProducts]);

  // Save a product with improved caching
  const saveProduct = useCallback(async (productId: string, source: string = 'Other') => {
    try {
      const token = localStorage.getItem('token') || Cookies.get('token');
      if (!token) {
        setError('Authentication required');
        return false;
      }

      // Check if product is already saved in local state to avoid unnecessary API calls
      if (savedProducts.some(product => product._id === productId)) {
        return true; // Product is already saved, no need for API call
      }

      const response = await fetch('/api/user/saved-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId, source })
      });

      const data = await response.json();

      if (response.ok) {
        // Handle both new saves and already saved products
        if (data.savedProduct || data.alreadySaved) {
          // Update the local cache immediately without API call
          if (!data.alreadySaved && data.savedProduct) {
            // Force a refresh only if we need to, but use debounced version
            debouncedFetchSavedProducts(true);
          }
        }
        setLastUpdated(Date.now());
        setError(null);
        return true;
      } else {
        setError(data.message || 'Failed to save product');
        return false;
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error saving product';
      console.error('Error saving product:', error);
      setError(errorMessage);
      return false;
    }
  }, [debouncedFetchSavedProducts, savedProducts]);

  // Remove a product with local state update
  const removeProduct = useCallback(async (productId: string) => {
    try {
      const token = localStorage.getItem('token') || Cookies.get('token');
      if (!token) return false;

      // Optimistic update - remove from local state first
      setSavedProducts(prev => prev.filter(product => product._id !== productId));

      const response = await fetch(`/api/user/saved-products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update timestamp but don't fetch again since we already updated local state
        setLastUpdated(Date.now());
        setError(null);
        
        // Update the cache with our new state
        const now = Date.now();
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          products: savedProducts.filter(product => product._id !== productId),
          timestamp: now
        }));
        
        return true;
      } else {
        // If the API call fails, revert our optimistic update
        debouncedFetchSavedProducts(true);
        const data = await response.json();
        setError(data.message || 'Failed to remove product');
        return false;
      }
    } catch (error: any) {
      // If there's an error, refresh to get the correct state
      debouncedFetchSavedProducts(true);
      console.error('Error removing product:', error);
      setError(error?.message || 'Error removing product');
      return false;
    }
  }, [debouncedFetchSavedProducts, savedProducts]);

  // Public method to refresh saved products - use debounced version
  const refreshSavedProducts = useCallback(async () => {
    await fetchSavedProducts(true);
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