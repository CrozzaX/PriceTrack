import { NextRequest, NextResponse } from 'next/server';
import { Database } from '../types/supabase';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { supabase } from '@/lib/supabase';
import { connectToAuthDB } from '@/lib/mongoose/auth';

interface SubscriptionCheckResult {
  hasAccess: boolean;
  message: string;
  redirectUrl?: string;
  user?: any;
  subscription?: any;
  currentPlan?: string | null;
}

export async function checkSubscription(
  req: NextRequest,
  res: NextResponse,
  requiredPlan: string | null = null
): Promise<SubscriptionCheckResult> {
  const supabase = createMiddlewareClient<Database>({ req, res });
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return {
      hasAccess: false,
      message: 'Authentication required',
      redirectUrl: '/login'
    };
  }
  
  // If no specific plan is required, just check if user is authenticated
  if (!requiredPlan) {
    return {
      hasAccess: true,
      message: 'Access granted',
      user
    };
  }
  
  // Get the user's active subscription
  const { data: subscription, error: subError } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      subscription_plans:plan_id (
        id,
        name
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();
  
  if (subError) {
    console.error('Error fetching subscription:', subError);
    return {
      hasAccess: false,
      message: 'Error checking subscription status',
      redirectUrl: '/subscription'
    };
  }
  
  // If no active subscription found
  if (!subscription) {
    return {
      hasAccess: false,
      message: 'Active subscription required',
      redirectUrl: '/subscription'
    };
  }
  
  // Check if the user's plan matches the required plan
  const planName = subscription.subscription_plans?.name;
  if (requiredPlan && planName !== requiredPlan) {
    return {
      hasAccess: false,
      message: `${requiredPlan} plan required`,
      redirectUrl: '/subscription',
      currentPlan: planName || null
    };
  }
  
  // User has the required subscription
  return {
    hasAccess: true,
    message: 'Access granted',
    user,
    subscription
  };
}

export async function withSubscription(
  req: NextRequest,
  requiredPlan: string | null = null
) {
  const res = NextResponse.next();
  const result = await checkSubscription(req, res, requiredPlan);
  
  if (!result.hasAccess && result.redirectUrl) {
    const url = req.nextUrl.clone();
    url.pathname = result.redirectUrl;
    url.searchParams.set('message', result.message);
    return NextResponse.redirect(url);
  }
  
  return res;
}

export interface SubscriptionFeatures {
  email_alerts: boolean;
  max_products: number;
  price_history: boolean;
  unlimited_products: boolean;
  competitor_analysis: boolean;
  price_drop_notifications: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: SubscriptionFeatures;
  is_active: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  subscription_plans: SubscriptionPlan;
}

// Get user subscription with features
export async function getUserSubscriptionWithFeatures(userId: string): Promise<{
  subscription: UserSubscription | null;
  features: SubscriptionFeatures;
}> {
  try {
    // Default free tier features
    const defaultFeatures: SubscriptionFeatures = {
      email_alerts: true,
      max_products: 5,
      price_history: false,
      unlimited_products: false,
      competitor_analysis: false,
      price_drop_notifications: false
    };

    if (!userId) {
      return { subscription: null, features: defaultFeatures };
    }

    // Get user's active subscription
    try {
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return { subscription: null, features: defaultFeatures };
      }

      if (!subscription) {
        return { subscription: null, features: defaultFeatures };
      }

      // Extract features from the subscription plan
      const features = subscription.subscription_plans.features as SubscriptionFeatures;

      return { subscription, features };
    } catch (subError) {
      console.error('Error in subscription query:', subError);
      
      // If there's an error with the UUID format, try to get a valid UUID from auth
      try {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        
        if (!userError && userData?.user) {
          const supabaseUserId = userData.user.id;
          
          // Retry with the valid UUID
          const { data: subscription, error } = await supabase
            .from('user_subscriptions')
            .select('*, subscription_plans(*)')
            .eq('user_id', supabaseUserId)
            .eq('status', 'active')
            .maybeSingle();
            
          if (!error && subscription) {
            // Extract features from the subscription plan
            const features = subscription.subscription_plans.features as SubscriptionFeatures;
            return { subscription, features };
          }
        }
      } catch (retryError) {
        console.error('Error in retry subscription query:', retryError);
      }
      
      return { subscription: null, features: defaultFeatures };
    }
  } catch (error) {
    console.error('Error in getUserSubscriptionWithFeatures:', error);
    return {
      subscription: null,
      features: {
        email_alerts: true,
        max_products: 5,
        price_history: false,
        unlimited_products: false,
        competitor_analysis: false,
        price_drop_notifications: false
      }
    };
  }
}

// Check if user has reached their product limit
export async function hasReachedProductLimit(userId: string): Promise<{
  hasReached: boolean;
  currentCount: number;
  maxAllowed: number;
  subscription: UserSubscription | null;
}> {
  try {
    // Get user subscription and features
    const { subscription, features } = await getUserSubscriptionWithFeatures(userId);

    // If user has unlimited products, they haven't reached the limit
    if (features.unlimited_products) {
      return {
        hasReached: false,
        currentCount: 0, // We don't need to count if unlimited
        maxAllowed: Infinity,
        subscription
      };
    }

    // Get count of user's saved products
    try {
      // Try to get user metadata from Supabase
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError) {
        console.error('Error fetching user with admin API:', userError);
        
        // Fallback to MongoDB count if Supabase fails
        const authConn = await connectToAuthDB();
        const User = authConn.model('User');
        const user = await User.findById(userId);
        
        if (!user) {
          return {
            hasReached: true,
            currentCount: 0,
            maxAllowed: features.max_products,
            subscription
          };
        }
        
        const savedProductsCount = user.savedProducts?.length || 0;
        
        return {
          hasReached: savedProductsCount >= features.max_products,
          currentCount: savedProductsCount,
          maxAllowed: features.max_products,
          subscription
        };
      }
      
      // Get saved products count from user metadata
      const savedProductsCount = userData?.user?.user_metadata?.saved_products_count || 0;
      
      return {
        hasReached: savedProductsCount >= features.max_products,
        currentCount: savedProductsCount,
        maxAllowed: features.max_products,
        subscription
      };
    } catch (error) {
      console.error('Error fetching user metadata:', error);
      
      // Fallback to MongoDB count
      const authConn = await connectToAuthDB();
      const User = authConn.model('User');
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          hasReached: true,
          currentCount: 0,
          maxAllowed: features.max_products,
          subscription
        };
      }
      
      const savedProductsCount = user.savedProducts?.length || 0;
      
      return {
        hasReached: savedProductsCount >= features.max_products,
        currentCount: savedProductsCount,
        maxAllowed: features.max_products,
        subscription
      };
    }
  } catch (error) {
    console.error('Error in hasReachedProductLimit:', error);
    return {
      hasReached: true,
      currentCount: 0,
      maxAllowed: 5, // Default to free tier limit
      subscription: null
    };
  }
}

// Check if user has access to a specific feature
export async function hasFeatureAccess(
  userId: string,
  featureName: keyof SubscriptionFeatures
): Promise<boolean> {
  try {
    const { features } = await getUserSubscriptionWithFeatures(userId);
    return features[featureName] === true;
  } catch (error) {
    console.error(`Error checking access to feature ${featureName}:`, error);
    return false;
  }
} 