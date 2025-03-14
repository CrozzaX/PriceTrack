'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const checkAuth = async () => {
      try {
        // Check for token in both localStorage and cookies
        const localToken = localStorage.getItem('token');
        const cookieToken = Cookies.get('sb-access-token');
        
        console.log('AuthCheck - Authentication check:', { 
          hasLocalToken: !!localToken, 
          hasCookieToken: !!cookieToken,
          isMounted
        });
        
        if (localToken || cookieToken) {
          console.log('AuthCheck - Token found, user is authenticated');
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
        
        // No token found, redirect to login
        console.log('AuthCheck - No token found, redirecting to login');
        router.push('/login');
      } catch (error) {
        console.error('AuthCheck - Error checking authentication:', error);
        setIsLoading(false);
        router.push('/login');
      }
    };

    if (isMounted) {
      checkAuth();
    }
    
    return () => {
      // Cleanup if needed
    };
  }, [router, isMounted]);

  if (!isMounted || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7559]"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
} 