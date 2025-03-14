'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../types/supabase';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';

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
};

export default function AdminSubscriptions() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    // Check if user is admin
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    fetchSubscriptions();
  }, [user, authLoading, router, filter]);

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage('');

      let query = supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans:plan_id (name, price, features),
          profiles:user_id (email)
        `)
        .order('created_at', { ascending: false });
      
      // Apply status filter if not 'all'
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
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

      // Transform data to include user email, plan name, and transaction status
      const formattedData = data.map(sub => ({
        ...sub,
        user_email: sub.profiles?.email,
        plan_name: sub.subscription_plans?.name,
        has_transaction: subscriptionIdsWithTransactions.has(sub.id)
      }));

      setSubscriptions(formattedData);
    } catch (err: any) {
      console.error('Error fetching subscriptions:', err);
      setError(err.message || 'Failed to fetch subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }

    try {
      setIsLoading(true);
      
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'canceled',
          updated_at: now
        })
        .eq('id', subscriptionId);

      if (error) {
        throw error;
      }

      setSuccessMessage('Subscription canceled successfully');
      // Refresh the subscriptions list
      fetchSubscriptions();
    } catch (err: any) {
      console.error('Error canceling subscription:', err);
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTransaction = async (subscription: Subscription) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call the manual-fix endpoint
      const response = await fetch(`/api/subscription/manual-fix?subscription_id=${subscription.id}&user_id=${subscription.user_id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create transaction');
      }
      
      setSuccessMessage(`Transaction created successfully for ${subscription.user_email || subscription.user_id}`);
      fetchSubscriptions();
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      setError(err.message || 'Failed to create transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Filter subscriptions by search term
  const filteredSubscriptions = subscriptions.filter(subscription => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (subscription.user_email && subscription.user_email.toLowerCase().includes(searchLower)) ||
      (subscription.plan_name && subscription.plan_name.toLowerCase().includes(searchLower)) ||
      subscription.status.toLowerCase().includes(searchLower) ||
      subscription.payment_method.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading && subscriptions.length === 0) {
    return <div className="flex justify-center items-center h-[70vh]">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Subscription Management</h1>
      
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
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div>
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="all">All Subscriptions</option>
              <option value="active">Active</option>
              <option value="canceled">Canceled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by user, plan, etc."
              className="p-2 border rounded w-full md:w-64"
            />
          </div>
        </div>
        
        <div>
          <button
            onClick={fetchSubscriptions}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Refresh
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((subscription) => (
                    <tr key={subscription.id}>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {subscription.has_transaction ? (
                          <span className="text-green-600">✓ Created</span>
                        ) : (
                          <span className="text-red-600">✗ Missing</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {subscription.status === 'active' && (
                            <button
                              onClick={() => handleCancelSubscription(subscription.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                          )}
                          {!subscription.has_transaction && (
                            <button
                              onClick={() => handleCreateTransaction(subscription)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Create Transaction
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded shadow">
              <p className="text-gray-500 text-sm">Total Subscriptions</p>
              <p className="text-2xl font-bold">{filteredSubscriptions.length}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <p className="text-gray-500 text-sm">Active Subscriptions</p>
              <p className="text-2xl font-bold">
                {filteredSubscriptions.filter(s => s.status === 'active').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <p className="text-gray-500 text-sm">Missing Transactions</p>
              <p className="text-2xl font-bold">
                {filteredSubscriptions.filter(s => !s.has_transaction).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 