'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { hasFeatureAccess } from '@/lib/permissions';
import Link from 'next/link';

type FeatureAccessProps = {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Component that conditionally renders content based on user's subscription level
 * If the user has access to the feature, the children are rendered
 * Otherwise, the fallback content is rendered
 */
export default function FeatureAccess({ feature, children, fallback }: FeatureAccessProps) {
  const { user } = useAuth();
  
  const hasAccess = hasFeatureAccess(user, feature);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Default fallback if none provided
  const defaultFallback = (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <p className="text-gray-600 mb-2">
        This feature requires a higher subscription level.
      </p>
      <Link href="/subscription" className="text-indigo-600 hover:underline text-sm">
        Upgrade your subscription
      </Link>
    </div>
  );
  
  return <>{fallback || defaultFallback}</>;
}

/**
 * Component that only renders its children if the user is an admin
 */
export function AdminOnly({ children, fallback }: Omit<FeatureAccessProps, 'feature'>) {
  return (
    <FeatureAccess 
      feature="admin_dashboard" 
      fallback={fallback || (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-600">
            You need administrator access to view this content.
          </p>
        </div>
      )}
    >
      {children}
    </FeatureAccess>
  );
}

/**
 * Component that only renders its children if the user has an active subscription
 */
export function SubscriberOnly({ children, fallback }: Omit<FeatureAccessProps, 'feature'>) {
  return (
    <FeatureAccess 
      feature="saved_products" 
      fallback={fallback || (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-yellow-700 mb-2">
            This feature requires an active subscription.
          </p>
          <Link href="/subscription" className="text-indigo-600 hover:underline text-sm">
            View subscription plans
          </Link>
        </div>
      )}
    >
      {children}
    </FeatureAccess>
  );
}

/**
 * Component that only renders its children if the user has premium access
 */
export function PremiumOnly({ children, fallback }: Omit<FeatureAccessProps, 'feature'>) {
  return (
    <FeatureAccess 
      feature="advanced_analytics" 
      fallback={fallback || (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-purple-700 mb-2">
            This is a premium feature.
          </p>
          <Link href="/subscription" className="text-indigo-600 hover:underline text-sm">
            Upgrade to Premium
          </Link>
        </div>
      )}
    >
      {children}
    </FeatureAccess>
  );
} 
 
 
 