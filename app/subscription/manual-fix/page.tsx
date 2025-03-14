'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function ManualFixPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  // Fetch the active subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            subscription_plans:plan_id (
              id,
              name,
              price,
              features
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        
        if (error) throw error;
        
        setSubscription(data);
      } catch (err: any) {
        console.error('Error fetching subscription:', err);
        setError(err.message || 'Failed to fetch subscription');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchSubscription();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, authLoading]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?returnUrl=/subscription/manual-fix');
    }
  }, [user, authLoading, router]);
  
  const handleFixTransaction = async () => {
    if (!subscription) return;
    
    try {
      setResult(null);
      setError('');
      
      const response = await fetch(`/api/subscription/manual-fix?subscription_id=${subscription.id}&user_id=${user?.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix transaction');
      }
      
      setResult(data);
    } catch (err: any) {
      console.error('Error fixing transaction:', err);
      setError(err.message || 'An error occurred');
    }
  };
  
  // Show loading state while checking authentication
  if (authLoading || isLoading) {
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
      <h1 className="text-3xl font-bold mb-8">Manual Fix Subscription Transaction</h1>
      
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Active Subscription</h2>
        
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
        
        {!subscription ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            <p>You don't have an active subscription.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Plan</p>
                <p className="font-medium">{subscription.subscription_plans?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{subscription.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">{new Date(subscription.start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-medium">{new Date(subscription.end_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Subscription ID</p>
                <p className="font-medium text-xs truncate">{subscription.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-medium">₹{subscription.subscription_plans?.price || 0}</p>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                onClick={handleFixTransaction}
                className="py-2 px-4 bg-[#FF7559] hover:bg-[#E56A50] text-white rounded-lg"
              >
                Fix Transaction History
              </button>
              <p className="text-xs text-gray-500 mt-2">
                This will create a transaction record for your active subscription if one doesn't exist.
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-center">
        <Link
          href="/subscription"
          className="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Back to Subscription
        </Link>
      </div>
    </div>
  );
} 