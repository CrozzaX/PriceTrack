'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

type SubscriptionCardProps = {
  subscription: any;
};

export default function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth();
  
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      if (!user) {
        throw new Error('You must be logged in to cancel a subscription');
      }
      
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_id: subscription.id,
          user_id: user.id
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
      
      router.refresh();
    } catch (err: any) {
      console.error('Error canceling subscription:', err);
      setError('Failed to cancel subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md">
          {error}
        </div>
      )}
      
      <div className="flex justify-between">
        <span className="text-gray-500">Plan:</span>
        <span className="font-medium">{subscription.subscription_plans.name}</span>
      </div>
      
      <div className="flex justify-between">
        <span className="text-gray-500">Status:</span>
        <span className="font-medium capitalize">{subscription.status}</span>
      </div>
      
      <div className="flex justify-between">
        <span className="text-gray-500">Start Date:</span>
        <span className="font-medium">
          {new Date(subscription.start_date).toLocaleDateString()}
        </span>
      </div>
      
      <div className="flex justify-between">
        <span className="text-gray-500">End Date:</span>
        <span className="font-medium">
          {new Date(subscription.end_date).toLocaleDateString()}
        </span>
      </div>
      
      {subscription.status === 'active' && (
        <button
          onClick={handleCancelSubscription}
          disabled={isLoading}
          className="w-full mt-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Cancel Subscription'}
        </button>
      )}
      
      {subscription.status !== 'active' && (
        <a
          href="/subscription"
          className="block w-full mt-4 py-2 text-center bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Renew Subscription
        </a>
      )}
    </div>
  );
} 