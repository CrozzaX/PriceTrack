'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getSubscriptionPlans } from '@/lib/supabase';
import PricingTable from './PricingTable';

// Define the Plan type
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

export default function PricingSection() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        const plansData = await getSubscriptionPlans();
        setPlans(plansData);
      } catch (err) {
        console.error('Error fetching subscription plans:', err);
        setError('Failed to load subscription plans. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (isLoading) {
    return (
      <section className="mt-32 mb-20 pricing-section">
        <h2 className="text-3xl font-bold text-center mb-4">
          Choose Your <span className="text-[#FF7559]">Plan</span>
        </h2>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7559]"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-32 mb-20 pricing-section">
        <h2 className="text-3xl font-bold text-center mb-4">
          Choose Your <span className="text-[#FF7559]">Plan</span>
        </h2>
        <div className="text-center text-red-500 py-10">{error}</div>
      </section>
    );
  }

  return (
    <section className="mt-32 mb-20 pricing-section">
      <motion.h2 
        className="text-3xl font-bold text-center mb-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
      >
        Choose Your <span className="text-[#FF7559]">Plan</span>
      </motion.h2>
      
      <motion.p 
        className="text-center text-gray-600 mb-12 max-w-2xl mx-auto"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        Select the perfect plan for your needs. Upgrade or downgrade at any time. 
        All plans include basic tracking features, with premium options for power users.
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <PricingTable plans={plans} />
      </motion.div>
      
      <motion.div 
        className="text-center mt-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <Link href="/subscription" className="text-[#FF7559] font-medium hover:underline">
          View detailed plan comparison →
        </Link>
      </motion.div>
    </section>
  );
} 