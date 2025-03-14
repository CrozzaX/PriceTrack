import { User } from '@supabase/supabase-js';

// Define feature access levels
export enum FeatureAccess {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  BUSINESS = 'business',
  ADMIN = 'admin'
}

// Define the hierarchy of access levels
const accessHierarchy: Record<string, number> = {
  'free': 0,
  'subscriber': 1,
  'basic': 1,
  'premium': 2,
  'business': 3,
  'admin': 4
};

// Define features and their required access levels
export const featureAccessMap: Record<string, FeatureAccess> = {
  // Free features
  'product_tracking': FeatureAccess.FREE,
  'basic_alerts': FeatureAccess.FREE,
  
  // Basic subscription features
  'saved_products': FeatureAccess.BASIC,
  'email_alerts': FeatureAccess.BASIC,
  
  // Premium features
  'price_history': FeatureAccess.PREMIUM,
  'advanced_analytics': FeatureAccess.PREMIUM,
  'priority_alerts': FeatureAccess.PREMIUM,
  
  // Business features
  'api_access': FeatureAccess.BUSINESS,
  'bulk_tracking': FeatureAccess.BUSINESS,
  'team_access': FeatureAccess.BUSINESS,
  
  // Admin features
  'admin_dashboard': FeatureAccess.ADMIN,
  'user_management': FeatureAccess.ADMIN,
  'subscription_management': FeatureAccess.ADMIN
};

/**
 * Check if a user has access to a specific feature
 * @param user The user object from Supabase Auth
 * @param feature The feature to check access for
 * @returns boolean indicating if the user has access
 */
export function hasFeatureAccess(user: User | null, feature: string): boolean {
  if (!user) return false;
  
  // Get the required access level for the feature
  const requiredAccess = featureAccessMap[feature];
  if (!requiredAccess) {
    console.warn(`Unknown feature: ${feature}`);
    return false;
  }
  
  // Get the user's role from metadata
  const userRole = (user.user_metadata?.role || 'free').toLowerCase();
  
  // Admin always has access to everything
  if (userRole === 'admin') return true;
  
  // Check if user's access level is sufficient
  const userAccessLevel = accessHierarchy[userRole] || 0;
  const requiredAccessLevel = accessHierarchy[requiredAccess] || 0;
  
  return userAccessLevel >= requiredAccessLevel;
}

/**
 * Check if a user has admin access
 * @param user The user object from Supabase Auth
 * @returns boolean indicating if the user has admin access
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  return (user.user_metadata?.role || '').toLowerCase() === 'admin';
}

/**
 * Get the user's subscription level
 * @param user The user object from Supabase Auth
 * @returns The user's subscription level
 */
export function getUserSubscriptionLevel(user: User | null): string {
  if (!user) return 'free';
  return (user.user_metadata?.role || 'free').toLowerCase();
}

/**
 * Check if a user's subscription is active
 * @param user The user object from Supabase Auth
 * @returns boolean indicating if the user has an active subscription
 */
export function hasActiveSubscription(user: User | null): boolean {
  if (!user) return false;
  return (user.user_metadata?.subscription_status || '').toLowerCase() === 'active';
} 
 
 
 