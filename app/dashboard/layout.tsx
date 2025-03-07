'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import AuthCheck from '@/components/AuthCheck';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Get user data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Only render content on client-side to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7559]"></div>
      </div>
    );
  }

  return (
    <AuthCheck>
      <div className="min-h-screen pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full md:w-64 shrink-0">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="space-y-1">
                  <Link href="/dashboard" 
                        className={`block px-4 py-2 rounded-md ${pathname === '/dashboard' ? 'bg-gray-100 text-[#FF7559]' : 'hover:bg-gray-50'}`}>
                    Dashboard
                  </Link>
                  <Link href="/dashboard/profile"
                        className={`block px-4 py-2 rounded-md ${pathname === '/dashboard/profile' ? 'bg-gray-100 text-[#FF7559]' : 'hover:bg-gray-50'}`}>
                    Profile
                  </Link>
                  <Link href="/dashboard/password"
                        className={`block px-4 py-2 rounded-md ${pathname === '/dashboard/password' ? 'bg-gray-100 text-[#FF7559]' : 'hover:bg-gray-50'}`}>
                    Password
                  </Link>
                  <Link href="/dashboard/saved-products"
                        className={`block px-4 py-2 rounded-md ${pathname === '/dashboard/saved-products' ? 'bg-gray-100 text-[#FF7559]' : 'hover:bg-gray-50'}`}>
                    Saved Products
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow p-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthCheck>
  );
} 