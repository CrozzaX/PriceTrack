'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!storedUser || !token) {
      router.push('/login');
      return;
    }
    
    try {
      setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7559]"></div>
      </div>
    );
  }

  return (
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
  );
} 