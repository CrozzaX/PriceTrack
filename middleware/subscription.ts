import { NextRequest, NextResponse } from 'next/server';
import { Database } from '../types/supabase';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

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