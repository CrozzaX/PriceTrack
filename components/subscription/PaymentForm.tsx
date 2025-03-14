'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

type PaymentFormProps = {
  plan: any;
  billingPeriod: string;
};

export default function PaymentForm({ plan, billingPeriod }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth();
  
  // Get the fixed price for a plan based on its name
  const getFixedPrice = (plan: any) => {
    if (plan.name.toLowerCase().includes('free')) {
      return 0;
    } else if (plan.name.toLowerCase().includes('basic')) {
      return 100;
    } else if (plan.name.toLowerCase().includes('premium')) {
      return 500;
    } else {
      // Fallback for any other plans
      return plan.price * 75; // Convert from USD to INR
    }
  };
  
  // Calculate price based on billing period
  const calculatePrice = (plan: any, billingType: string) => {
    const basePrice = getFixedPrice(plan);
    if (billingType === 'annual') {
      // 20% discount for annual billing
      return Math.round(basePrice * 12 * 0.8);
    }
    return basePrice;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const validateForm = () => {
    if (!formData.cardNumber.trim() || formData.cardNumber.length < 16) {
      setError('Please enter a valid card number');
      return false;
    }
    if (!formData.cardName.trim()) {
      setError('Please enter the name on card');
      return false;
    }
    if (!formData.expiryDate.trim() || !formData.expiryDate.match(/^\d{2}\/\d{2}$/)) {
      setError('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    if (!formData.cvv.trim() || formData.cvv.length < 3) {
      setError('Please enter a valid CVV');
      return false;
    }
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (!user) {
        throw new Error('You must be logged in to subscribe');
      }
      
      // Calculate subscription duration based on billing period
      const durationDays = billingPeriod === 'annual' 
        ? plan.duration_days * 12 
        : plan.duration_days;
      
      // Calculate price based on billing period
      const priceINR = calculatePrice(plan, billingPeriod);
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);
      
      // Create subscription using server-side API route
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          plan_id: plan.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          payment_status: 'paid',
          payment_method: 'credit_card',
          transaction_data: {
            amount: priceINR,
            currency: 'INR',
            status: 'paid',
            payment_method: 'credit_card',
            payment_details: { 
              last4: formData.cardNumber.slice(-4),
              name: formData.cardName,
              expiry: formData.expiryDate,
              plan_name: plan.name,
              billing_period: billingPeriod,
              amount_inr: priceINR
            }
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create subscription');
      }
      
      // Redirect to success page
      router.push('/subscription/success');
      
    } catch (error: any) {
      console.error('Subscription error:', error);
      setError(error.message || 'An error occurred while processing your payment');
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
          Name on Card
        </label>
        <input
          type="text"
          id="cardName"
          name="cardName"
          value={formData.cardName}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7559]"
          placeholder="John Doe"
        />
      </div>
      
      <div>
        <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Card Number
        </label>
        <input
          type="text"
          id="cardNumber"
          name="cardNumber"
          value={formData.cardNumber}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7559]"
          placeholder="1234 5678 9012 3456"
          maxLength={16}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
            Expiry Date
          </label>
          <input
            type="text"
            id="expiryDate"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7559]"
            placeholder="MM/YY"
            maxLength={5}
          />
        </div>
        <div>
          <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
            CVV
          </label>
          <input
            type="text"
            id="cvv"
            name="cvv"
            value={formData.cvv}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7559]"
            placeholder="123"
            maxLength={4}
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-[#FF7559] hover:bg-[#E56A50] text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF7559] disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : `Pay ₹${
          calculatePrice(plan, billingPeriod).toLocaleString('en-IN')
        }`}
      </button>
    </form>
  );
} 