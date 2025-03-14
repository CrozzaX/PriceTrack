import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    // Get the subscription ID from the URL
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscription_id');
    const userId = searchParams.get('user_id');
    
    if (!subscriptionId || !userId) {
      return NextResponse.json(
        { error: 'Missing subscription_id or user_id parameter' },
        { status: 400 }
      );
    }
    
    // Get the subscription details
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans:plan_id (
          id,
          name,
          price,
          features
        )
      `)
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .single();
    
    if (subError) {
      console.error('Error fetching subscription:', subError);
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      );
    }
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    // Check if a transaction already exists for this subscription
    const { data: existingTransaction, error: txError } = await supabaseAdmin
      .from('subscription_transactions')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .maybeSingle();
    
    if (txError) {
      console.error('Error checking existing transaction:', txError);
      return NextResponse.json(
        { error: 'Failed to check existing transactions' },
        { status: 500 }
      );
    }
    
    if (existingTransaction) {
      return NextResponse.json(
        { message: 'Transaction already exists for this subscription', transaction: existingTransaction },
        { status: 200 }
      );
    }
    
    // Create a new transaction for the subscription
    const planName = subscription.subscription_plans?.name || 'Unknown Plan';
    const planPrice = subscription.subscription_plans?.price || 0;
    
    // Get the fixed price for a plan based on its name
    const getFixedPrice = (planName: string) => {
      if (planName.toLowerCase().includes('free')) {
        return 0;
      } else if (planName.toLowerCase().includes('basic')) {
        return 100;
      } else if (planName.toLowerCase().includes('premium')) {
        return 500;
      } else {
        // Fallback for any other plans
        return planPrice;
      }
    };
    
    const fixedPrice = getFixedPrice(planName);
    
    const transactionData = {
      user_id: userId,
      subscription_id: subscriptionId,
      amount: fixedPrice,
      currency: 'INR',
      status: 'paid',
      payment_method: subscription.payment_method || 'credit_card',
      payment_details: {
        plan_name: planName,
        created_at: subscription.created_at,
        transaction_type: 'subscription_payment'
      }
    };
    
    const { data: transaction, error: createError } = await supabaseAdmin
      .from('subscription_transactions')
      .insert(transactionData)
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating transaction:', createError);
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Transaction created successfully',
      transaction
    });
    
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 