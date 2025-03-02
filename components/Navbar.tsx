'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import SignOutButton from './SignOutButton';
import { useState, useEffect, useCallback, useRef } from 'react';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [userData, setUserData] = useState<{ name?: string; email?: string; profileImage?: string } | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const dataFetchedRef = useRef(false);
  
  // Function to fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || Cookies.get('token');
      if (!token) return;
      
      const response = await fetch('/api/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        // Add cache control to prevent excessive fetching
        cache: 'force-cache'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        // Update localStorage with latest user data
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, []);
  
  // Function to handle profile icon click
  const handleProfileClick = (e: React.MouseEvent) => {
    if (!userData) {
      e.preventDefault();
      setIsProfileLoading(true);
      
      // Fetch user data before navigating
      fetchUserProfile().then(() => {
        setIsProfileLoading(false);
        router.push('/dashboard/profile');
      });
    }
  };
  
  // Check authentication status
  useEffect(() => {
    setIsMounted(true);
    
    // Check if user is logged in (check both localStorage and cookies)
    const checkAuth = () => {
      const token = localStorage.getItem('token') || Cookies.get('token');
      setIsLoggedIn(!!token);
      
      // Get user data from localStorage if available
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUserData(parsedUser);
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    };
    
    checkAuth();
    
    // Add event listener for storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'token') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Set up an interval to periodically check for user data changes (less frequent)
    const intervalId = setInterval(checkAuth, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);
  
  // Fetch user data if needed (separate effect to avoid infinite loop)
  useEffect(() => {
    if (isLoggedIn && !userData && !dataFetchedRef.current) {
      dataFetchedRef.current = true;
      fetchUserProfile();
    }
  }, [isLoggedIn, userData, fetchUserProfile]);
  
  // Reset the dataFetched ref when user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      dataFetchedRef.current = false;
    }
  }, [isLoggedIn]);
  
  // Prefetch the profile page when user is logged in
  useEffect(() => {
    if (isLoggedIn && typeof window !== 'undefined') {
      router.prefetch('/dashboard/profile');
    }
  }, [isLoggedIn, router]);
  
  // Only render full content on client-side to avoid hydration issues
  if (!isMounted) {
    return (
      <header className="fixed top-0 left-0 w-full bg-white bg-opacity-90 backdrop-blur-md z-50 border-b border-gray-200">
        <nav className="flex justify-between items-center px-5 md:px-20 py-4 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="font-bold text-xl">Price<span>Wise</span></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-20 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-24 h-9 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </nav>
      </header>
    );
  }
  
  // Get user's initial for the profile icon
  const userInitial = userData?.name ? userData.name.charAt(0).toUpperCase() : '';
  
  return (
    <motion.header 
      className="fixed top-0 left-0 w-full bg-white bg-opacity-90 backdrop-blur-md z-50 border-b border-gray-200"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
        duration: 0.6
      }}
    >
      <nav className="flex justify-between items-center px-5 md:px-20 py-4 max-w-[1440px] mx-auto">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80">
          <motion.svg 
            width="27" 
            height="27" 
            viewBox="0 0 27 27" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <path d="M13.5 26.5C20.4036 26.5 26 20.9036 26 14C26 7.09644 20.4036 1.5 13.5 1.5C6.59644 1.5 1 7.09644 1 14C1 20.9036 6.59644 26.5 13.5 26.5Z" stroke="#FF7559" strokeWidth="2"/>
            <path d="M8 14L12 18L20 10" stroke="#FF7559" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
          <motion.div 
            className="font-bold text-xl font-['Space_Grotesk']"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            Price<motion.span 
              className="text-[#FF7559]"
              animate={{ 
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut" 
              }}
            >
              Wise
            </motion.span>
          </motion.div>
        </Link>

        <div className="flex items-center gap-4">
          <NavLink href="/products" isActive={pathname === '/products'}>
            My Products
          </NavLink>
          
          {isLoggedIn && (
            <NavLink href="/dashboard" isActive={pathname?.startsWith('/dashboard')}>
              Dashboard
            </NavLink>
          )}
          
          {isLoggedIn ? (
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {isProfileLoading ? (
                <motion.div 
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FF7559] hover:bg-opacity-90"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <motion.div 
                    className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Link 
                    href="/dashboard/profile" 
                    onClick={handleProfileClick}
                    className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-[#FF7559] hover:bg-opacity-90 text-white font-bold"
                    title="User Profile"
                  >
                    {userData?.profileImage ? (
                      <Image 
                        src={userData.profileImage} 
                        alt="Profile" 
                        width={40} 
                        height={40} 
                        className="object-cover w-full h-full"
                        priority
                        unoptimized={userData.profileImage.startsWith('data:')}
                      />
                    ) : (
                      userInitial || (
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      )
                    )}
                  </Link>
                </motion.div>
              )}
              <SignOutButton />
            </motion.div>
          ) : <AuthButtons />}
        </div>
      </nav>
    </motion.header>
  );
};

// NavLink component with animations
function NavLink({ href, children, isActive }: { href: string; children: React.ReactNode; isActive: boolean }) {
  return (
    <Link href={href} prefetch={true}>
      <motion.div 
        className={`relative text-gray-700 hover:text-[#FF7559] ${isActive ? 'text-[#FF7559] font-medium' : ''}`}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        {children}
        <motion.div 
          className="absolute bottom-0 left-0 h-0.5 bg-[#FF7559]"
          initial={{ width: isActive ? "100%" : "0%" }}
          whileHover={{ width: "100%" }}
          animate={{ width: isActive ? "100%" : "0%" }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
      </motion.div>
    </Link>
  );
}

// Auth buttons component for login/register
function AuthButtons() {
  return (
    <motion.div 
      className="flex items-center gap-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <Link 
          href="/login"
          className="px-4 py-2 text-gray-700 hover:text-[#FF7559] relative group"
        >
          Log In
          <motion.div 
            className="absolute bottom-0 left-0 h-0.5 bg-[#FF7559]"
            initial={{ width: "0%" }}
            whileHover={{ width: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          />
        </Link>
      </motion.div>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Link 
          href="/login?signup=true"
          className="px-4 py-2 rounded-full font-semibold text-white bg-[#FF7559] hover:bg-opacity-90"
        >
          Sign Up
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default Navbar;