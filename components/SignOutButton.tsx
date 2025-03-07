'use client';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    // Sign out from Supabase if using Supabase auth
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out from Supabase:', error);
    }
    
    // Clear all possible auth tokens from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('jwt_token');
    
    // Also try to clear any Supabase session data
    try {
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('supabase.auth.data');
      localStorage.removeItem('supabase.auth.event');
    } catch (error) {
      console.error('Error clearing Supabase session data:', error);
    }
    
    // Clear cookies
    Cookies.remove('token', { path: '/' });
    Cookies.remove('jwt_token', { path: '/' });
    
    // Clear any pending Google auth
    sessionStorage.removeItem('pendingGoogleAuth');
    
    // Trigger storage event for other components
    window.dispatchEvent(new Event('storage'));
    
    // Create and dispatch a custom event for auth change
    const authEvent = new CustomEvent('authchange', { detail: { isAuthenticated: false } });
    window.dispatchEvent(authEvent);
    
    // Redirect to home page
    router.push('/');
    
    // Force a page reload to ensure all components update
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  return (
    <motion.button 
      className="px-6 py-3 rounded-full font-semibold text-white bg-[#FF7559] border border-[#FF7559] relative overflow-hidden"
      onClick={handleSignOut}
      whileHover={{ scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)" }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <motion.span 
        className="relative z-10"
        initial={{ x: 0 }}
        whileHover={{ x: 3 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        Sign Out
      </motion.span>
      <motion.div 
        className="absolute inset-0 bg-white/10"
        initial={{ x: "-100%" }}
        whileHover={{ x: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />
    </motion.button>
  );
} 