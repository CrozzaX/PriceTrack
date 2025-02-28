'use client';

import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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