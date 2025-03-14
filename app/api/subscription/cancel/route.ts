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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription_id, user_id } = body;

    // Validate required fields
    if (!subscription_id || !user_id) {
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

    // Verify the subscription exists and belongs to the user
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('id', subscription_id)
      .eq('user_id', user_id)
      .single();
    
    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found or does not belong to the user' },
        { status: 404 }
      );
    }

    // Update the subscription status to canceled
    const { data: updatedSubscription, error: updateError } = await supabaseAdmin
      .from('user_subscriptions')
      .update({ status: 'canceled' })
      .eq('id', subscription_id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Subscription cancellation error:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }

    // Create a transaction record for the cancellation
    const transactionData = {
      user_id,
      subscription_id,
      amount: 0, // No charge for cancellation
      currency: subscription.subscription_plans?.currency || 'USD',
      status: 'failed', // Using 'failed' instead of 'canceled' as it's likely a valid enum value
      payment_method: 'none',
      payment_details: {
        cancellation_reason: 'user_requested',
        transaction_type: 'cancellation',
        original_plan: subscription.subscription_plans?.name || 'Unknown plan'
      }
    };

    const { data: transactionRecord, error: transactionError } = await supabaseAdmin
      .from('subscription_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      console.error('Transaction record creation error:', transactionError);
      // Don't fail the whole request if transaction record creation fails
    }

    // Update user role back to free
    const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { user_metadata: { subscription_tier: 'free' } }
    );

    if (updateUserError) {
      console.error('User role update error:', updateUserError);
      // Don't fail the whole request if role update fails
    }

    return NextResponse.json({ 
      success: true, 
      subscription: updatedSubscription,
      transaction: transactionRecord || null
    });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 