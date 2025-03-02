'use client';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear cookies
    Cookies.remove('token', { path: '/' });
    
    // Trigger storage event for other components
    window.dispatchEvent(new Event('storage'));
    
    // Redirect to home page
    router.push('/');
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