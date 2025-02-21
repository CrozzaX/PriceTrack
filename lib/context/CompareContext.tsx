'use client';

import { Product } from '@/types';
import { createContext, useContext, useState } from 'react';

interface CompareContextType {
  compareProducts: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareProducts, setCompareProducts] = useState<Product[]>([]);

  const addToCompare = (product: Product) => {
    if (!product._id) return;
    if (compareProducts.length < 3 && !compareProducts.find(p => p._id === product._id)) {
      // Add new product at the beginning of the array and limit to 3 items
      setCompareProducts(prev => [product, ...prev].slice(0, 3));
    }
  };

  const removeFromCompare = (productId: string) => {
    if (!productId) return;
    setCompareProducts(compareProducts.filter(p => p._id !== productId));
  };

  const clearCompare = () => {
    setCompareProducts([]);
  };

  return (
    <CompareContext.Provider value={{ compareProducts, addToCompare, removeFromCompare, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
