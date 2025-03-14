import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Subscription-related helper functions
export async function getSubscriptionPlans() {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price');
  
  if (error) throw error;
  return data;
}

export async function getUserSubscription(userId: string) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*, subscription_plans(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function createSubscription(subscriptionData: {
  user_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  payment_status: string;
  payment_method?: string;
}) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert(subscriptionData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function createTransaction(transactionData: {
  user_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string;
  payment_details?: any;
}) {
  const { data, error } = await supabase
    .from('subscription_transactions')
    .insert(transactionData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function cancelSubscription(subscriptionId: string) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .update({ status: 'canceled' })
    .eq('id', subscriptionId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Export types for TypeScript support
export type { User, Session } from '@supabase/supabase-js'; 