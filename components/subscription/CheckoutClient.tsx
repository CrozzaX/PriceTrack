'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import PaymentForm from '@/components/subscription/PaymentForm';
import { supabase } from '@/lib/supabase';

type CheckoutClientProps = {
  plan: any;
  billing: string;
};

export default function CheckoutClient({ plan, billing }: CheckoutClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  // Get the fixed price for a plan based on its name
  const getFixedPrice = (plan: any) => {
    if (plan.name.toLowerCase().includes('free')) {
      return 0;
    } else if (plan.name.toLowerCase().includes('basic')) {
      return 100;
    } else if (plan.name.toLowerCase().includes('premium')) {
      return 500;
    } else {
      // Fallback for any other plans
      return plan.price * 75; // Convert from USD to INR
    }
  };
  
  // Calculate price based on billing period (in rupees)
  const calculatePrice = (plan: any, billingType: string) => {
    const basePrice = getFixedPrice(plan);
    if (billingType === 'annual') {
      // 20% discount for annual billing
      return Math.round(basePrice * 12 * 0.8).toLocaleString('en-IN');
    }
    return basePrice.toLocaleString('en-IN');
  };

  useEffect(() => {
    async function checkAuth() {
      setIsLoading(true);
      
      // If no user, redirect to login
      if (!user) {
        console.log('No user found in checkout client, redirecting to login');
        router.push('/login?redirectTo=' + encodeURIComponent(`/subscription/checkout/${plan.id}?billing=${billing}`));
        return;
      }
      
      console.log('User authenticated in checkout client, user ID:', user.id);
      
      // Check if user already has an active subscription
      try {
        const { data: activeSubscription, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        
        if (error) {
          console.error('Error checking subscription:', error);
        }
        
        if (activeSubscription) {
          console.log('User already has an active subscription, redirecting to dashboard');
          setHasActiveSubscription(true);
          router.push('/dashboard?message=You already have an active subscription. Please cancel your current subscription before purchasing a new one.');
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuth();
  }, [user, router, plan.id, billing]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 max-w-3xl px-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7559] mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading checkout...</p>
      </div>
    );
  }
  
  if (hasActiveSubscription) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="container mx-auto py-12 max-w-3xl px-4">
      <h1 className="text-3xl font-bold mb-8">Complete Your Subscription</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Plan:</span>
              <span className="font-medium">{plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Billing Period:</span>
              <span className="font-medium capitalize">{billing}</span>
            </div>
            <div className="flex justify-between">
              <span>Price:</span>
              <span className="font-medium">
                ₹{calculatePrice(plan, billing)}
                /{billing === 'annual' ? 'year' : 'month'}
              </span>
            </div>
            <hr />
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>
                ₹{calculatePrice(plan, billing)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
          <PaymentForm plan={plan} billingPeriod={billing} />
        </div>
      </div>
    </div>
  );
} 