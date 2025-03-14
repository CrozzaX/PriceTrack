'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';

export default function SuccessPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFree = searchParams?.get('free') === 'true';
  
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);
  
  return (
    <div className="container mx-auto py-12 max-w-2xl px-4 text-center">
      <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold mb-4">Subscription Successful!</h1>
      
      <p className="text-gray-600 mb-8">
        {isFree 
          ? "You've successfully activated the free plan." 
          : "Thank you for your subscription. Your payment has been processed successfully."}
      </p>
      
      <div className="space-y-4">
        <Link href="/dashboard">
          <button className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors">
            Go to Dashboard
          </button>
        </Link>
        
        <div>
          <Link href="/" className="text-indigo-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 