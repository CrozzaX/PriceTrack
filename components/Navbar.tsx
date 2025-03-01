'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import SignOutButton from './SignOutButton';
import { useState, useEffect, useCallback, useRef } from 'react';
import Cookies from 'js-cookie';

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
  
  // Get user's initial for the profile icon
  const userInitial = userData?.name ? userData.name.charAt(0).toUpperCase() : '';
  
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
          
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              {isProfileLoading ? (
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FF7559] hover:bg-opacity-90 transition">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <Link 
                  href="/dashboard/profile" 
                  onClick={handleProfileClick}
                  className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-[#FF7559] hover:bg-opacity-90 transition text-white font-bold"
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
              )}
              <SignOutButton />
            </div>
          ) : <AuthButtons />}
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