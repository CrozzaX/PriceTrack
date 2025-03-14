'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../types/supabase';
import { useAuth } from '@/lib/context/AuthContext';

type Transaction = {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  created_at: string;
  updated_at: string | null;
  user_email?: string;
  payment_details?: any;
  user_subscriptions?: {
    id: string;
    plan_id: string;
    subscription_plans?: {
      name: string;
    }
  }
};

export default function AdminTransactions() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [fixAmount, setFixAmount] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState('');
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    // Check if user is admin
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    fetchTransactions();
  }, [user, authLoading, router, filter]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage('');

      let query = supabase
        .from('subscription_transactions')
        .select(`
          *,
          user_subscriptions(
            id,
            plan_id,
            subscription_plans(name)
          ),
          profiles:user_id(email)
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

      // Transform data to include user email and plan name
      const formattedData = data.map(trans => ({
        ...trans,
        user_email: trans.profiles?.email,
        plan_name: trans.user_subscriptions?.subscription_plans?.name
      }));

      setTransactions(formattedData);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  const handleFixTransaction = async (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setFixAmount(transaction.amount);
  };

  const saveFixedTransaction = async () => {
    if (!selectedTransaction) return;
    
    try {
      setIsFixing(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('subscription_transactions')
        .update({ amount: fixAmount })
        .eq('id', selectedTransaction.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setSuccessMessage(`Transaction amount updated successfully to ${formatCurrency(fixAmount, selectedTransaction.currency)}`);
      setSelectedTransaction(null);
      fetchTransactions();
    } catch (err: any) {
      console.error('Error fixing transaction:', err);
      setError(err.message || 'Failed to update transaction');
    } finally {
      setIsFixing(false);
    }
  };

  const createMissingTransaction = async (userId: string, subscriptionId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call the manual-fix endpoint
      const response = await fetch(`/api/subscription/manual-fix?subscription_id=${subscriptionId}&user_id=${userId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create transaction');
      }
      
      setSuccessMessage('Transaction created successfully');
      fetchTransactions();
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      setError(err.message || 'Failed to create transaction');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter transactions by search term
  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (transaction.user_email && transaction.user_email.toLowerCase().includes(searchLower)) ||
      (transaction.user_subscriptions?.subscription_plans?.name && 
       transaction.user_subscriptions.subscription_plans.name.toLowerCase().includes(searchLower)) ||
      transaction.status.toLowerCase().includes(searchLower) ||
      transaction.payment_method.toLowerCase().includes(searchLower) ||
      (transaction.payment_details?.billing_period && 
       transaction.payment_details.billing_period.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading && transactions.length === 0) {
    return <div className="flex justify-center items-center h-[70vh]">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Transaction Management</h1>
      
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
              <option value="all">All Transactions</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
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
            onClick={fetchTransactions}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {selectedTransaction && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
          <h2 className="text-lg font-semibold mb-2">Fix Transaction Amount</h2>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction ID
              </label>
              <div className="p-2 bg-gray-100 rounded text-gray-700">
                {selectedTransaction.id}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User
              </label>
              <div className="p-2 bg-gray-100 rounded text-gray-700">
                {selectedTransaction.user_email || selectedTransaction.user_id}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Amount
              </label>
              <div className="p-2 bg-gray-100 rounded text-gray-700">
                {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
              </div>
            </div>
            <div>
              <label htmlFor="fixAmount" className="block text-sm font-medium text-gray-700 mb-1">
                New Amount
              </label>
              <input
                id="fixAmount"
                type="number"
                value={fixAmount}
                onChange={(e) => setFixAmount(Number(e.target.value))}
                className="p-2 border rounded w-32"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveFixedTransaction}
                disabled={isFixing}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isFixing ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.user_email || transaction.user_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.user_subscriptions?.subscription_plans?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.status === 'paid' || transaction.status === 'success'
                            ? 'bg-green-100 text-green-800' 
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleFixTransaction(transaction)}
                          className="text-indigo-600 hover:text-indigo-900 mr-2"
                        >
                          Fix Amount
                        </button>
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
              <p className="text-gray-500 text-sm">Total Transactions</p>
              <p className="text-2xl font-bold">{filteredTransactions.length}</p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  filteredTransactions
                    .filter(t => t.status === 'paid' || t.status === 'success')
                    .reduce((sum, t) => sum + t.amount, 0),
                  'INR'
                )}
              </p>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <p className="text-gray-500 text-sm">Completed Transactions</p>
              <p className="text-2xl font-bold">
                {filteredTransactions.filter(t => t.status === 'paid' || t.status === 'success').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 