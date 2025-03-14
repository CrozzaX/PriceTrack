'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Redirect if user is not admin
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return null; // Will redirect in useEffect
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Subscriptions', path: '/admin/subscriptions' },
    { name: 'Plans', path: '/admin/plans' },
    { name: 'Transactions', path: '/admin/transactions' },
    { name: 'Fix Transactions', path: '/admin/fix-transactions' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-700 text-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/admin" className="text-xl font-bold">
                Admin Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span>{user.email}</span>
              <Link href="/dashboard" className="text-sm hover:underline">
                Back to Site
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Navigation</h2>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    href={item.path}
                    className={`block px-4 py-2 rounded ${
                      pathname === item.path
                        ? 'bg-indigo-100 text-indigo-700 font-medium'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
          
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 
 
 
 