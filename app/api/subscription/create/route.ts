import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      user_id, 
      plan_id, 
      start_date, 
      end_date, 
      payment_status, 
      payment_method,
      transaction_data
    } = body;

    // Validate required fields
    if (!user_id || !plan_id || !start_date || !end_date || !payment_status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the user exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has an active subscription
    const { data: existingSubscription, error: existingSubError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .maybeSingle();
    
    if (existingSubscription) {
      return NextResponse.json(
        { error: 'User already has an active subscription. Please cancel the current subscription before purchasing a new one.' },
        { status: 400 }
      );
    }

    // Get the plan details to update user role
    const { data: planData, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();
    
    if (planError || !planData) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    // Create subscription using admin client (bypasses RLS)
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .insert({
        user_id,
        plan_id,
        start_date,
        end_date,
        status: 'active',
        payment_status,
        payment_method
      })
      .select()
      .single();
    
    if (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    // Create transaction record if transaction data is provided
    if (transaction_data) {
      // Validate transaction status to ensure it's a valid enum value
      const validStatusValues = ['paid', 'pending', 'failed'];
      const transactionStatus = transaction_data.status || 'pending';
      
      if (!validStatusValues.includes(transactionStatus)) {
        console.error(`Invalid transaction status: ${transactionStatus}. Using 'pending' instead.`);
        transaction_data.status = 'pending';
      }
      
      const { data: transaction, error: transactionError } = await supabaseAdmin
        .from('subscription_transactions')
        .insert({
          user_id,
          subscription_id: subscription.id,
          ...transaction_data
        })
        .select()
        .single();
      
      if (transactionError) {
        console.error('Transaction creation error:', transactionError);
        // Don't fail the whole request if transaction creation fails
      } else {
        console.log('Transaction created successfully:', transaction.id);
      }
    }

    // Update user role based on the plan
    const subscription_tier = planData.tier || 'free';
    
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { user_metadata: { subscription_tier } }
    );

    if (updateError) {
      console.error('User role update error:', updateError);
      // Don't fail the whole request if role update fails
    }

    return NextResponse.json({ 
      success: true, 
      subscription 
    });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 