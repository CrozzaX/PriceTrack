'use client';

import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';
import { useMemo } from 'react';

interface ProductLimitWarningProps {
  currentCount?: number;
  showAlways?: boolean;
}

export default function ProductLimitWarning({ 
  currentCount: externalCount, 
  showAlways = false 
}: ProductLimitWarningProps) {
  const { user, subscription } = useAuth();

  const { hasLimit, currentCount, maxAllowed, isApproaching, hasReached } = useMemo(() => {
    if (!user) {
      return { 
        hasLimit: false, 
        currentCount: 0, 
        maxAllowed: 0, 
        isApproaching: false, 
        hasReached: false 
      };
    }
    
    // If no subscription, user is on free tier
    if (!subscription) {
      const count = externalCount || 0;
      return {
        hasLimit: true,
        currentCount: count,
        maxAllowed: 5, // Free tier limit
        isApproaching: count >= 3, // Show warning at 60% usage
        hasReached: count >= 5
      };
    }
    
    // Check subscription plan limits
    const features = subscription.subscription_plans?.features;
    const hasUnlimited = features?.unlimited_products === true;
    
    if (hasUnlimited) {
      return { 
        hasLimit: false, 
        currentCount: 0, 
        maxAllowed: Infinity, 
        isApproaching: false, 
        hasReached: false 
      };
    }
    
    const maxProducts = features?.max_products || 5;
    const count = externalCount || 0;
    
    return {
      hasLimit: true,
      currentCount: count,
      maxAllowed: maxProducts,
      isApproaching: count >= (maxProducts * 0.8), // Show warning at 80% usage
      hasReached: count >= maxProducts
    };
  }, [user, subscription, externalCount]);

  // Don't show anything if not approaching limit and not forced to show
  if ((!isApproaching && !hasReached && !showAlways) || !hasLimit) {
    return null;
  }

  // Get plan name
  const planName = subscription?.subscription_plans?.name || 'Free';
  const nextPlan = planName === 'Free' ? 'Basic' : planName === 'Basic' ? 'Premium' : null;

  return (
    <div className={`w-full p-4 rounded-lg mb-6 ${
      hasReached 
        ? 'bg-red-50 border border-red-200' 
        : 'bg-yellow-50 border border-yellow-200'
    }`}>
      <div className="flex items-start">
        <div className={`p-2 rounded-full mr-3 ${
          hasReached ? 'bg-red-100' : 'bg-yellow-100'
        }`}>
          {hasReached ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <h4 className={`font-medium text-sm ${
            hasReached ? 'text-red-800' : 'text-yellow-800'
          }`}>
            {hasReached 
              ? `Product limit reached (${currentCount}/${maxAllowed})` 
              : `Approaching product limit (${currentCount}/${maxAllowed})`
            }
          </h4>
          <p className={`text-sm mt-1 ${
            hasReached ? 'text-red-600' : 'text-yellow-600'
          }`}>
            {hasReached 
              ? `You've reached the maximum number of products for your ${planName} plan.` 
              : `You're approaching the maximum number of products for your ${planName} plan.`
            }
            {nextPlan && ` Consider upgrading to the ${nextPlan} plan for more products and features.`}
          </p>
          <div className="mt-3">
            <Link 
              href="/subscription/plans" 
              className={`inline-flex items-center text-sm font-medium ${
                hasReached 
                  ? 'text-red-600 hover:text-red-800' 
                  : 'text-yellow-600 hover:text-yellow-800'
              }`}
            >
              View Plans
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 