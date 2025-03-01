'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    setIsLoading(false);
  }, [router]);

  // Only render content on client-side to avoid hydration issues
  if (!isMounted || isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7559]"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <p className="text-gray-600 mb-4">
        Welcome to your PriceWise dashboard. Monitor your saved products and manage your profile from here.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Saved Products</h2>
          <p className="text-gray-600 mb-4">View and manage your saved products</p>
          <Link href="/dashboard/saved-products" className="text-blue-600 hover:underline">
            Go to Saved Products →
          </Link>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Your Profile</h2>
          <p className="text-gray-600 mb-4">Update your personal information</p>
          <Link href="/dashboard/profile" className="text-green-600 hover:underline">
            Go to Profile →
          </Link>
        </div>
        
        <div className="bg-purple-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Password Settings</h2>
          <p className="text-gray-600 mb-4">Update your account password</p>
          <Link href="/dashboard/password" className="text-purple-600 hover:underline">
            Change Password →
          </Link>
        </div>
        
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Browse Products</h2>
          <p className="text-gray-600 mb-4">Search and track new products</p>
          <Link href="/products" className="text-yellow-600 hover:underline">
            Go to Products →
          </Link>
        </div>
      </div>
    </div>
  );
} 