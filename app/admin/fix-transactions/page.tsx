'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../types/supabase';
import { useAuth } from '@/lib/context/AuthContext';

type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  payment_method: string;
  payment_status: string;
  user_email?: string;
  plan_name?: string;
  has_transaction?: boolean;
  selected?: boolean;
};

export default function AdminFixTransactions() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    // Check if user is admin
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    fetchSubscriptionsWithoutTransactions();
  }, [user, authLoading, router]);

  const fetchSubscriptionsWithoutTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage('');

      // Get all active subscriptions
      const { data: subscriptionsData, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans:plan_id (name, price, features),
          profiles:user_id (email)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (subError) {
        throw subError;
      }

      // Get all transactions to check which subscriptions have transactions
      const { data: transactions, error: txError } = await supabase
        .from('subscription_transactions')
        .select('subscription_id');
      
      if (txError) {
        throw txError;
      }

      // Create a set of subscription IDs that have transactions
      const subscriptionIdsWithTransactions = new Set(
        transactions?.map(tx => tx.subscription_id) || []
      );

      // Filter subscriptions that don't have transactions
      const subscriptionsWithoutTransactions = subscriptionsData
        .filter(sub => !subscriptionIdsWithTransactions.has(sub.id))
        .map(sub => ({
          ...sub,
          user_email: sub.profiles?.email,
          plan_name: sub.subscription_plans?.name,
          has_transaction: false,
          selected: false
        }));

      setSubscriptions(subscriptionsWithoutTransactions);
    } catch (err: any) {
      console.error('Error fetching subscriptions:', err);
      setError(err.message || 'Failed to fetch subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setSubscriptions(subscriptions.map(sub => ({
      ...sub,
      selected: newSelectAll
    })));
  };

  const handleSelectSubscription = (id: string) => {
    setSubscriptions(subscriptions.map(sub => 
      sub.id === id ? { ...sub, selected: !sub.selected } : sub
    ));
    
    // Update selectAll state based on whether all subscriptions are selected
    const allSelected = subscriptions.every(sub => 
      sub.id === id ? !sub.selected : sub.selected
    );
    setSelectAll(allSelected);
  };

  const handleFixSelected = async () => {
    const selectedSubscriptions = subscriptions.filter(sub => sub.selected);
    
    if (selectedSubscriptions.length === 0) {
      setError('Please select at least one subscription to fix');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      setSuccessMessage('');
      
      let successCount = 0;
      let errorCount = 0;
      
      // Process each selected subscription
      for (const subscription of selectedSubscriptions) {
        try {
          // Call the manual-fix endpoint
          const response = await fetch(`/api/subscription/manual-fix?subscription_id=${subscription.id}&user_id=${subscription.user_id}`);
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to create transaction');
          }
          
          successCount++;
        } catch (err) {
          console.error(`Error creating transaction for subscription ${subscription.id}:`, err);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        setSuccessMessage(`Successfully created ${successCount} transactions${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
      } else {
        setError('Failed to create any transactions');
      }
      
      // Refresh the list
      fetchSubscriptionsWithoutTransactions();
    } catch (err: any) {
      console.error('Error fixing transactions:', err);
      setError(err.message || 'Failed to fix transactions');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading && subscriptions.length === 0) {
    return <div className="flex justify-center items-center h-[70vh]">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Fix Missing Transactions</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Subscriptions Missing Transactions</h2>
            <div className="flex space-x-2">
              <button
                onClick={fetchSubscriptionsWithoutTransactions}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                disabled={isProcessing}
              >
                Refresh
              </button>
              <button
                onClick={handleFixSelected}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                disabled={isProcessing || subscriptions.filter(s => s.selected).length === 0}
              >
                {isProcessing ? 'Processing...' : 'Fix Selected'}
              </button>
            </div>
          </div>
        </div>
        
        {subscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No subscriptions found without transactions. All good! 👍</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2">Select All</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((subscription) => (
                    <tr key={subscription.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={subscription.selected}
                          onChange={() => handleSelectSubscription(subscription.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {subscription.user_email || subscription.user_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {subscription.plan_name || subscription.plan_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          subscription.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subscription.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(subscription.start_date)} - {formatDate(subscription.end_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          subscription.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {subscription.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">How to Fix Transactions</h2>
        <div className="space-y-2 text-gray-700">
          <p>This tool helps you fix subscriptions that are missing transaction records:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Select the subscriptions you want to fix using the checkboxes</li>
            <li>Click the "Fix Selected" button to create transaction records</li>
            <li>Each transaction will be created with the correct amount based on the plan</li>
            <li>The transaction status will be set to "paid" for all fixed transactions</li>
          </ol>
          <p className="mt-4 text-sm text-gray-500">
            Note: This tool only shows active subscriptions that don't have associated transaction records.
          </p>
        </div>
      </div>
    </div>
  );
} 