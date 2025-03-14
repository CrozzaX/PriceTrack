import { getSubscriptionPlans } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import CheckoutClient from '@/components/subscription/CheckoutClient';

export default async function CheckoutPage({ 
  params, 
  searchParams 
}: { 
  params: { planId: string }, 
  searchParams: { [key: string]: string | string[] | undefined } 
}) {
  const planId = params.planId;
  const billingParam = searchParams.billing;
  const billing = typeof billingParam === 'string' ? billingParam : 'monthly';
  
  // Fetch subscription plans
  const plans = await getSubscriptionPlans();
  const plan = plans.find(p => p.id === planId);
  
  if (!plan) {
    redirect('/subscription');
  }
  
  // If it's a free plan, redirect to success directly
  if (plan.price === 0) {
    redirect('/subscription/success?free=true');
  }
  
  return <CheckoutClient plan={plan} billing={billing} />;
} 