'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';

type PlanFeature = {
  [key: string]: boolean | number;
};

type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: PlanFeature;
  is_active: boolean;
};

type PricingTableProps = {
  plans: Plan[];
};

export default function PricingTable({ plans }: PricingTableProps) {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const { user, subscription } = useAuth();
  
  // Get the fixed price for a plan based on its name
  const getFixedPrice = (plan: Plan) => {
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
  
  const getAnnualPrice = (plan: Plan) => {
    // 20% discount for annual billing
    const basePrice = getFixedPrice(plan);
    const annualPrice = Math.round(basePrice * 12 * 0.8);
    return annualPrice.toLocaleString('en-IN');
  };

  const formatFeatureName = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  // Animation variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const fadeInScale = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };
  
  return (
    <div>
      {/* Billing toggle */}
      <motion.div 
        className="flex justify-center mb-8"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <motion.button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-2 rounded-md ${
              billingPeriod === 'monthly' ? 'bg-white shadow-sm' : ''
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Monthly
          </motion.button>
          <motion.button
            onClick={() => setBillingPeriod('annual')}
            className={`px-4 py-2 rounded-md ${
              billingPeriod === 'annual' ? 'bg-white shadow-sm' : ''
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Annual <span className="text-green-500 text-xs">Save 20%</span>
          </motion.button>
        </div>
      </motion.div>
      
      {/* Plan cards */}
      <motion.div 
        className="grid md:grid-cols-3 gap-8"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            className="border rounded-xl p-6 shadow-lg bg-white"
            variants={fadeInScale}
            whileHover={{ 
              y: -10, 
              boxShadow: "0 10px 25px -5px rgba(255, 117, 89, 0.15), 0 10px 10px -5px rgba(255, 117, 89, 0.1)" 
            }}
          >
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <p className="text-gray-600 mb-4">{plan.description}</p>
            
            <motion.div 
              className="mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="text-3xl font-bold">
                ₹{billingPeriod === 'monthly' 
                  ? getFixedPrice(plan).toLocaleString('en-IN') 
                  : getAnnualPrice(plan)}
              </span>
              <span className="text-gray-500">
                /{billingPeriod === 'monthly' ? 'month' : 'year'}
              </span>
            </motion.div>
            
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Features:</h4>
              <ul className="space-y-2">
                {Object.entries(plan.features).map(([key, value], index) => (
                  <motion.li 
                    key={key} 
                    className="flex items-center"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <span className={`mr-2 ${value ? 'text-green-500' : 'text-red-500'}`}>
                      {value ? '✓' : '✗'}
                    </span>
                    <span>
                      {formatFeatureName(key)}
                      {typeof value === 'number' ? `: ${value}` : ''}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
            
            <Link href={user ? `/subscription/checkout/${plan.id}?billing=${billingPeriod}` : '/login?redirect=/subscription'}>
              <motion.button 
                className="w-full py-3 rounded-lg bg-[#FF7559] text-white hover:bg-[#E56A50] transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {plan.price === 0 ? 'Get Started' : 'Choose Plan'}
              </motion.button>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
} 
 
 
 