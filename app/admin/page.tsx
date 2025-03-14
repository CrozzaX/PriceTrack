'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../types/supabase';
import { useAuth } from '@/lib/context/AuthContext';

type DashboardStats = {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  recentTransactions: any[];
  planDistribution: { name: string; count: number }[];
};

type SubscriptionWithPlan = {
  subscription_plans?: {
    name?: string;
  };
};

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    recentTransactions: [],
    planDistribution: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    // Check if user is admin
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    fetchDashboardStats();
  }, [user, authLoading, router]);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get total users count
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Get active subscriptions count
      const { count: activeSubscriptions, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (subsError) throw subsError;

      // Get total revenue
      const { data: transactions, error: transError } = await supabase
        .from('subscription_transactions')
        .select('amount')
        .eq('status', 'completed');

      if (transError) throw transError;

      const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

      // Get recent transactions
      const { data: recentTransactions, error: recentTransError } = await supabase
        .from('subscription_transactions')
        .select(`
          *,
          subscription_plans:plan_id (name),
          users:user_id (email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentTransError) throw recentTransError;

      // Get plan distribution
      const { data: subscriptions, error: distError } = await supabase
        .from('user_subscriptions')
        .select(`
          subscription_plans:plan_id (name)
        `)
        .eq('status', 'active');

      if (distError) throw distError;

      // Calculate plan distribution
      const planCounts: Record<string, number> = {};
      (subscriptions as SubscriptionWithPlan[]).forEach(sub => {
        const planName = sub.subscription_plans?.name || 'Unknown';
        planCounts[planName] = (planCounts[planName] || 0) + 1;
      });

      const planDistribution = Object.entries(planCounts).map(([name, count]) => ({
        name,
        count
      }));

      setStats({
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        totalRevenue,
        recentTransactions: recentTransactions || [],
        planDistribution
      });
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message || 'Failed to fetch dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-[70vh]">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm uppercase">Total Users</h2>
          <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
          <Link href="/admin/users" className="text-indigo-600 text-sm mt-4 inline-block hover:underline">
            View All Users
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm uppercase">Active Subscriptions</h2>
          <p className="text-3xl font-bold mt-2">{stats.activeSubscriptions}</p>
          <Link href="/admin/subscriptions" className="text-indigo-600 text-sm mt-4 inline-block hover:underline">
            Manage Subscriptions
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm uppercase">Total Revenue</h2>
          <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalRevenue)}</p>
          <Link href="/admin/transactions" className="text-indigo-600 text-sm mt-4 inline-block hover:underline">
            View Transactions
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            <Link href="/admin/transactions" className="text-indigo-600 text-sm hover:underline">
              View All
            </Link>
          </div>
          
          {stats.recentTransactions.length === 0 ? (
            <p className="text-gray-500">No recent transactions</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {transaction.users?.email || transaction.user_id}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {transaction.subscription_plans?.name || transaction.plan_id}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Plan Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Subscription Plan Distribution</h2>
            <Link href="/admin/plans" className="text-indigo-600 text-sm hover:underline">
              Manage Plans
            </Link>
          </div>
          
          {stats.planDistribution.length === 0 ? (
            <p className="text-gray-500">No active subscriptions</p>
          ) : (
            <div className="space-y-4">
              {stats.planDistribution.map((plan) => (
                <div key={plan.name} className="flex items-center">
                  <div className="w-32 truncate">{plan.name}</div>
                  <div className="flex-1 mx-2">
                    <div className="bg-gray-200 h-4 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ 
                          width: `${(plan.count / stats.activeSubscriptions) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-right">{plan.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 