'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token') || Cookies.get('token');
      
      if (!token) {
        // Redirect to login with return URL
        router.push(`/login?returnUrl=${encodeURIComponent(pathname || '')}`);
      } else {
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [router, pathname]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7559]"></div>
      </div>
    );
  }

  return <>{children}</>;
} 