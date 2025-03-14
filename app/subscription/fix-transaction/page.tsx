'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';

export default function FixTransactionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?returnUrl=/subscription/fix-transaction');
    }
  }, [user, authLoading, router]);
  
  const handleFixTransaction = async () => {
    setIsLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await fetch('/api/subscription/fix-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include cookies in the request
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix transaction');
      }
      
      setResult(data);
      
    } catch (error: any) {
      console.error('Error fixing transaction:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="container mx-auto py-12 max-w-3xl px-4 text-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  // Don't render the main content if not authenticated
  if (!user) {
    return null;
  }
  
  return (
    <div className="container mx-auto py-12 max-w-3xl px-4">
      <h1 className="text-3xl font-bold mb-8">Fix Subscription Transaction</h1>
      
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <p className="mb-6 text-gray-700">
          If your subscription transaction history is not showing your current subscription, 
          you can use this tool to fix it. This will create a transaction record for your 
          active subscription if one doesn't exist.
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {result && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">{result.message || 'Transaction fixed successfully!'}</p>
            {result.transaction && (
              <pre className="mt-2 text-xs bg-green-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(result.transaction, null, 2)}
              </pre>
            )}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleFixTransaction}
            disabled={isLoading}
            className={`py-3 px-6 rounded-lg flex items-center justify-center ${
              isLoading 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-[#FF7559] hover:bg-[#E56A50] text-white'
            }`}
          >
            {isLoading ? 'Processing...' : 'Fix Transaction'}
          </button>
          
          <Link
            href="/subscription"
            className="py-3 px-6 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center"
          >
            Back to Subscription
          </Link>
        </div>
      </div>
      
      {result && (
        <div className="mt-6 text-center">
          <Link
            href="/subscription"
            className="text-[#FF7559] hover:underline"
          >
            Go to Subscription Page
          </Link>
        </div>
      )}
    </div>
  );
} 