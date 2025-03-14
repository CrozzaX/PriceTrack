'use client';

import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';
import { ReactNode, useMemo } from 'react';

interface SubscriptionFeatureCheckProps {
  featureName: 'email_alerts' | 'price_history' | 'unlimited_products' | 'competitor_analysis' | 'price_drop_notifications';
  children: ReactNode;
  fallback?: ReactNode;
}

export default function SubscriptionFeatureCheck({
  featureName,
  children,
  fallback
}: SubscriptionFeatureCheckProps) {
  const { user, subscription } = useAuth();

  // Check if user has access to the specified feature
  const hasFeatureAccess = useMemo(() => {
    if (!user) return false;
    
    // If no subscription, user is on free tier
    if (!subscription) {
      // Free tier has email_alerts by default
      if (featureName === 'email_alerts') return true;
      return false;
    }
    
    // Check if subscription plan has the requested feature
    const features = subscription.subscription_plans?.features;
    return features?.[featureName] === true;
  }, [user, subscription, featureName]);

  // If user has access, render the children
  if (hasFeatureAccess) {
    return <>{children}</>;
  }

  // If fallback is provided, render it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  return (
    <div className="w-full bg-white p-6 rounded-xl shadow-sm">
      <div className="flex flex-col items-center justify-center py-10">
        <div className="bg-blue-50 p-3 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Upgrade to Access This Feature</h3>
        <p className="text-gray-600 text-center mb-6 max-w-md">
          This feature is available on our paid plans. Upgrade now to unlock all features and track more products.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            href="/subscription" 
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#4F46E5] hover:bg-[#4338CA] transition-all"
          >
            Upgrade Now
          </Link>
          <Link 
            href="/subscription/plans" 
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all"
          >
            View Plans
          </Link>
        </div>
      </div>
    </div>
  );
} 