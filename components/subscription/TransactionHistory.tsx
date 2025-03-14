'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/context/AuthContext';

type Transaction = {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  payment_details: {
    cancellation_reason?: string;
    transaction_type?: string;
    original_plan?: string;
    [key: string]: any;
  };
  created_at: string;
  user_subscriptions?: {
    subscription_plans?: {
      name: string;
    }
  }
};

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    const fetchTransactions = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('subscription_transactions')
          .select('*, user_subscriptions(subscription_plans(name))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        console.log('Transactions data:', data);
        setTransactions(data || []);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transaction history');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [user]);
  
  if (isLoading) {
    return <div className="text-center py-4">Loading transaction history...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 py-4">{error}</div>;
  }
  
  if (transactions.length === 0) {
    return <div className="text-gray-500 py-4">No transactions found.</div>;
  }

  // Helper function to check if a transaction is a cancellation
  const isCancellation = (transaction: Transaction) => {
    return transaction.payment_details?.transaction_type === 'cancellation';
  };

  // Helper function to get transaction type description
  const getTransactionTypeDescription = (transaction: Transaction) => {
    if (isCancellation(transaction)) {
      return 'Subscription Cancellation';
    }
    
    if (transaction.amount === 0) {
      return 'Free Plan';
    }
    
    return transaction.user_subscriptions?.subscription_plans?.name || 'Unknown';
  };
  
  // Helper function to get status badge styling
  const getStatusBadgeStyle = (transaction: Transaction) => {
    if (isCancellation(transaction)) {
      return 'bg-gray-100 text-gray-800';
    }
    
    switch (transaction.status) {
      case 'success':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Helper function to get status display text
  const getStatusDisplayText = (transaction: Transaction) => {
    if (isCancellation(transaction)) {
      return 'canceled';
    }
    
    return transaction.status === 'success' ? 'paid' : transaction.status;
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Transaction Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className={isCancellation(transaction) ? 'bg-gray-50' : ''}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(transaction.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {getTransactionTypeDescription(transaction)}
                {isCancellation(transaction) && transaction.payment_details?.original_plan && (
                  <span className="block text-xs text-gray-400 mt-1">
                    Plan: {transaction.payment_details.original_plan}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {isCancellation(transaction) ? (
                  <span>-</span>
                ) : (
                  <span>{transaction.currency} {transaction.amount}</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  getStatusBadgeStyle(transaction)
                }`}>
                  {getStatusDisplayText(transaction)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 