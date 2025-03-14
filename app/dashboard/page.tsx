'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/context/AuthContext';
import SubscriptionCard from '@/components/subscription/SubscriptionCard';
import TransactionHistory from '@/components/subscription/TransactionHistory';

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams ? searchParams.get('message') : null;
  const { user, subscription, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    
    // Check for token in localStorage first
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    console.log('Dashboard - Local Storage Check:', { 
      hasToken: !!token, 
      hasUser: !!storedUser,
      authContextUser: !!user,
      authLoading
    });
    
    // Only redirect if we're sure the user is not authenticated through any method
    // Don't redirect while still loading auth state
    if (!authLoading && !user && !token) {
      console.log('Dashboard - Redirecting to login: No authentication found');
      router.push('/login?redirectTo=/dashboard');
      return;
    }
    
    // If we have a user, token, or we're still loading, just update loading state
    if (isMounted) {
      setIsLoading(false);
    }

    // Set notification message if present in URL
    if (message) {
      setNotification(message);
      // Clear the message from URL after displaying it
      const url = new URL(window.location.href);
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.toString());
    }
  }, [router, user, authLoading, isMounted, message]);

  // Animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  if (!isMounted || isLoading) {
    return <div className="flex justify-center items-center h-[70vh]">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {notification && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md mb-6 flex justify-between items-center">
          <p>{notification}</p>
          <button 
            onClick={() => setNotification(null)}
            className="text-amber-800 hover:text-amber-900"
          >
            &times;
          </button>
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <motion.div 
          className="bg-white p-6 rounded-lg shadow-md"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <span className="text-gray-500">Email:</span>
              <p>{user?.email || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').email : '')}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-white p-6 rounded-lg shadow-md"
          variants={itemVariants}
        >
          <h2 className="text-xl font-semibold mb-4">Your Subscription</h2>
          {subscription ? (
            <SubscriptionCard subscription={subscription} />
          ) : (
            <div>
              <p className="mb-4">You don't have an active subscription.</p>
              <Link href="/subscription" className="text-indigo-600 font-medium hover:underline">
                Browse Plans
              </Link>
            </div>
          )}
        </motion.div>
      </div>
      
      <motion.div 
        className="bg-white p-6 rounded-lg shadow-md mb-8"
        variants={itemVariants}
      >
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        <TransactionHistory />
      </motion.div>
      
      {/* Rest of the dashboard content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <motion.div 
          className="bg-blue-50 p-6 rounded-lg cursor-pointer"
          variants={itemVariants}
          whileHover="hover"
        >
          <h2 className="text-lg font-semibold mb-2">Saved Products</h2>
          <p className="text-gray-600 mb-4">View and manage your saved products</p>
          <Link href="/dashboard/saved-products" className="text-blue-600 hover:underline group flex items-center">
            Go to Saved Products 
            <motion.span 
              className="inline-block ml-1"
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              →
            </motion.span>
          </Link>
        </motion.div>
        
        <motion.div 
          className="bg-green-50 p-6 rounded-lg cursor-pointer"
          variants={itemVariants}
          whileHover="hover"
        >
          <h2 className="text-lg font-semibold mb-2">Your Profile</h2>
          <p className="text-gray-600 mb-4">Update your personal information</p>
          <Link href="/dashboard/profile" className="text-green-600 hover:underline group flex items-center">
            Go to Profile 
            <motion.span 
              className="inline-block ml-1"
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              →
            </motion.span>
          </Link>
        </motion.div>
        
        <motion.div 
          className="bg-purple-50 p-6 rounded-lg cursor-pointer"
          variants={itemVariants}
          whileHover="hover"
        >
          <h2 className="text-lg font-semibold mb-2">Password Settings</h2>
          <p className="text-gray-600 mb-4">Update your account password</p>
          <Link href="/dashboard/password" className="text-purple-600 hover:underline group flex items-center">
            Change Password 
            <motion.span 
              className="inline-block ml-1"
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              →
            </motion.span>
          </Link>
        </motion.div>
        
        <motion.div 
          className="bg-yellow-50 p-6 rounded-lg cursor-pointer"
          variants={itemVariants}
          whileHover="hover"
        >
          <h2 className="text-lg font-semibold mb-2">Browse Products</h2>
          <p className="text-gray-600 mb-4">Search and track new products</p>
          <Link href="/products" className="text-yellow-600 hover:underline group flex items-center">
            Go to Products 
            <motion.span 
              className="inline-block ml-1"
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              →
            </motion.span>
          </Link>
        </motion.div>
        
        <motion.div 
          className="bg-indigo-50 p-6 rounded-lg cursor-pointer"
          variants={itemVariants}
          whileHover="hover"
        >
          <h2 className="text-lg font-semibold mb-2">Premium Features</h2>
          <p className="text-gray-600 mb-4">Explore premium subscription benefits</p>
          <Link href="/premium-features" className="text-indigo-600 hover:underline group flex items-center">
            View Premium Features 
            <motion.span 
              className="inline-block ml-1"
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              →
            </motion.span>
          </Link>
        </motion.div>
        
        <motion.div 
          className="bg-teal-50 p-6 rounded-lg cursor-pointer"
          variants={itemVariants}
          whileHover="hover"
        >
          <h2 className="text-lg font-semibold mb-2">Business Features</h2>
          <p className="text-gray-600 mb-4">Discover our enterprise-grade solutions</p>
          <Link href="/business-features" className="text-teal-600 hover:underline group flex items-center">
            View Business Features 
            <motion.span 
              className="inline-block ml-1"
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              →
            </motion.span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
} 