'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import SignOutButton from './SignOutButton';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    
    // Check if user is logged in (check both localStorage and cookies)
    const checkAuth = () => {
      const token = localStorage.getItem('token') || Cookies.get('token');
      setIsLoggedIn(!!token);
    };
    
    checkAuth();
    
    // Add event listener for storage events
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Only render full content on client-side to avoid hydration issues
  if (!isMounted) {
    return (
      <header className="fixed top-0 left-0 w-full bg-white bg-opacity-90 backdrop-blur-md z-50 border-b border-gray-200">
        <nav className="flex justify-between items-center px-5 md:px-20 py-4 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gray-200"></div>
            <div className="font-bold text-xl">Price<span>Wise</span></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-20 h-5 bg-gray-200 rounded"></div>
            <div className="w-24 h-9 bg-gray-200 rounded-full"></div>
          </div>
        </nav>
      </header>
    );
  }
  
  return (
    <header className="fixed top-0 left-0 w-full bg-white bg-opacity-90 backdrop-blur-md z-50 border-b border-gray-200">
      <nav className="flex justify-between items-center px-5 md:px-20 py-4 max-w-[1440px] mx-auto">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.5 26.5C20.4036 26.5 26 20.9036 26 14C26 7.09644 20.4036 1.5 13.5 1.5C6.59644 1.5 1 7.09644 1 14C1 20.9036 6.59644 26.5 13.5 26.5Z" stroke="#FF7559" strokeWidth="2"/>
            <path d="M8 14L12 18L20 10" stroke="#FF7559" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="font-bold text-xl font-['Space_Grotesk']">Price<span className="text-[#FF7559]">Wise</span></div>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/products" className="text-gray-700 hover:text-[#FF7559] transition">
            My Products
          </Link>
          
          {isLoggedIn && (
            <Link 
              href="/dashboard" 
              prefetch={true}
              className={`text-gray-700 hover:text-[#FF7559] transition ${
                pathname?.startsWith('/dashboard') ? 'text-[#FF7559] font-medium' : ''
              }`}
            >
              Dashboard
            </Link>
          )}
          
          {isLoggedIn ? <SignOutButton /> : <AuthButtons />}
        </div>
      </nav>
    </header>
  );
};

// Auth buttons component for login/register
function AuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <Link 
        href="/login"
        className="px-4 py-2 text-gray-700 hover:text-[#FF7559] transition"
      >
        Log In
      </Link>
      <Link 
        href="/login?signup=true"
        className="px-4 py-2 rounded-full font-semibold text-white bg-[#FF7559] hover:bg-opacity-90 transition"
      >
        Sign Up
      </Link>
    </div>
  );
}

export default Navbar;