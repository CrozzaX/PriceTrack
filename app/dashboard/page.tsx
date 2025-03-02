'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

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

  // Animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { 
      y: 20, 
      opacity: 0,
      scale: 0.95
    },
    visible: { 
      y: 0, 
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    },
    hover: {
      y: -5,
      scale: 1.03,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  // Only render content on client-side to avoid hydration issues
  if (!isMounted || isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7559]"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1 
        className="text-2xl font-bold mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        Dashboard
      </motion.h1>
      
      <motion.p 
        className="text-gray-600 mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        Welcome to your PriceWise dashboard. Monitor your saved products and manage your profile from here.
      </motion.p>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
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
      </motion.div>
    </motion.div>
  );
} 