'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../types/supabase';
import { useAuth } from '@/lib/context/AuthContext';

type SubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  features: string[];
  monthly_price: number;
  annual_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

export default function AdminPlans() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlan, setNewPlan] = useState<Partial<SubscriptionPlan>>({
    name: '',
    description: '',
    features: [],
    monthly_price: 0,
    annual_price: 0,
    is_active: true
  });
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    // Check if user is admin
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }

    fetchPlans();
  }, [user, authLoading, router]);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('monthly_price', { ascending: true });

      if (error) {
        throw error;
      }

      setPlans(data);
    } catch (err: any) {
      console.error('Error fetching plans:', err);
      setError(err.message || 'Failed to fetch subscription plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (planId: string, currentStatus: boolean) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (error) {
        throw error;
      }

      // Refresh the plans list
      fetchPlans();
    } catch (err: any) {
      console.error('Error updating plan:', err);
      setError(err.message || 'Failed to update plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          name: editingPlan.name,
          description: editingPlan.description,
          features: editingPlan.features,
          monthly_price: editingPlan.monthly_price,
          annual_price: editingPlan.annual_price,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPlan.id);

      if (error) {
        throw error;
      }

      // Reset editing state and refresh plans
      setEditingPlan(null);
      fetchPlans();
    } catch (err: any) {
      console.error('Error updating plan:', err);
      setError(err.message || 'Failed to update plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('subscription_plans')
        .insert({
          name: newPlan.name || '',
          description: newPlan.description || '',
          features: newPlan.features || [],
          monthly_price: newPlan.monthly_price || 0,
          annual_price: newPlan.annual_price || 0,
          is_active: newPlan.is_active !== undefined ? newPlan.is_active : true,
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // Reset creation state and refresh plans
      setIsCreating(false);
      setNewPlan({
        name: '',
        description: '',
        features: [],
        monthly_price: 0,
        annual_price: 0,
        is_active: true
      });
      fetchPlans();
    } catch (err: any) {
      console.error('Error creating plan:', err);
      setError(err.message || 'Failed to create plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureChange = (value: string, index: number, isEditing: boolean) => {
    if (isEditing && editingPlan) {
      const updatedFeatures = [...editingPlan.features];
      updatedFeatures[index] = value;
      setEditingPlan({ ...editingPlan, features: updatedFeatures });
    } else if (!isEditing) {
      const updatedFeatures = [...(newPlan.features || [])];
      updatedFeatures[index] = value;
      setNewPlan({ ...newPlan, features: updatedFeatures });
    }
  };

  const addFeature = (isEditing: boolean) => {
    if (isEditing && editingPlan) {
      setEditingPlan({ ...editingPlan, features: [...editingPlan.features, ''] });
    } else if (!isEditing) {
      setNewPlan({ ...newPlan, features: [...(newPlan.features || []), ''] });
    }
  };

  const removeFeature = (index: number, isEditing: boolean) => {
    if (isEditing && editingPlan) {
      const updatedFeatures = [...editingPlan.features];
      updatedFeatures.splice(index, 1);
      setEditingPlan({ ...editingPlan, features: updatedFeatures });
    } else if (!isEditing) {
      const updatedFeatures = [...(newPlan.features || [])];
      updatedFeatures.splice(index, 1);
      setNewPlan({ ...newPlan, features: updatedFeatures });
    }
  };

  if (isLoading && plans.length === 0) {
    return <div className="flex justify-center items-center h-[70vh]">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Subscription Plans Management</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Create New Plan
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Create Plan Form */}
      {isCreating && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price ($)</label>
              <input
                type="number"
                value={newPlan.monthly_price}
                onChange={(e) => setNewPlan({ ...newPlan, monthly_price: parseFloat(e.target.value) })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Annual Price ($)</label>
              <input
                type="number"
                value={newPlan.annual_price}
                onChange={(e) => setNewPlan({ ...newPlan, annual_price: parseFloat(e.target.value) })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
              <input
                type="checkbox"
                checked={newPlan.is_active}
                onChange={(e) => setNewPlan({ ...newPlan, is_active: e.target.checked })}
                className="mr-2"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Features</label>
              <button
                type="button"
                onClick={() => addFeature(false)}
                className="text-indigo-600 text-sm"
              >
                + Add Feature
              </button>
            </div>
            {(newPlan.features || []).map((feature, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleFeatureChange(e.target.value, index, false)}
                  className="w-full p-2 border rounded mr-2"
                />
                <button
                  type="button"
                  onClick={() => removeFeature(index, false)}
                  className="text-red-600"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsCreating(false)}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePlan}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Create Plan
            </button>
          </div>
        </div>
      )}
      
      {/* Edit Plan Form */}
      {editingPlan && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Edit Plan: {editingPlan.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={editingPlan.name}
                onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={editingPlan.description}
                onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price ($)</label>
              <input
                type="number"
                value={editingPlan.monthly_price}
                onChange={(e) => setEditingPlan({ ...editingPlan, monthly_price: parseFloat(e.target.value) })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Annual Price ($)</label>
              <input
                type="number"
                value={editingPlan.annual_price}
                onChange={(e) => setEditingPlan({ ...editingPlan, annual_price: parseFloat(e.target.value) })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Features</label>
              <button
                type="button"
                onClick={() => addFeature(true)}
                className="text-indigo-600 text-sm"
              >
                + Add Feature
              </button>
            </div>
            {editingPlan.features.map((feature, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleFeatureChange(e.target.value, index, true)}
                  className="w-full p-2 border rounded mr-2"
                />
                <button
                  type="button"
                  onClick={() => removeFeature(index, true)}
                  className="text-red-600"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setEditingPlan(null)}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdatePlan}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Update Plan
            </button>
          </div>
        </div>
      )}
      
      {/* Plans Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Annual Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No subscription plans found
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {plan.name}
                    </td>
                    <td className="px-6 py-4">
                      {plan.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${plan.monthly_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${plan.annual_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        plan.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditPlan(plan)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(plan.id, plan.is_active)}
                        className={plan.is_active ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                      >
                        {plan.is_active ? 'Deactivate' : 'Activate'}
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
  );
} 