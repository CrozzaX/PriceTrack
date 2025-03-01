'use client';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

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
    <button 
      className="px-6 py-3 rounded-full font-semibold text-white bg-[#FF7559] border border-[#FF7559] hover:bg-opacity-90 transition"
      onClick={handleSignOut}
    >
      Sign Out
    </button>
  );
} 