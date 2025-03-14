import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '../../../../types/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to view subscription details' },
        { status: 401 }
      );
    }
    
    // Get the user's active subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans:plan_id (
          id,
          name,
          description,
          features,
          monthly_price,
          annual_price
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (subError) {
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Failed to fetch subscription details' },
        { status: 500 }
      );
    }
    
    // Get recent transactions
    const { data: transactions, error: transError } = await supabase
      .from('subscription_transactions')
      .select(`
        *,
        subscription_plans:plan_id (
          name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (transError) {
      console.error('Failed to fetch transactions:', transError);
      // We don't want to fail the whole request if just the transactions fetch fails
    }
    
    return NextResponse.json({
      subscription: subscription || null,
      transactions: transactions || []
    });
    
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 