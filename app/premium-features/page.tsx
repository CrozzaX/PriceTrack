'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { PremiumOnly } from '@/components/subscription/FeatureAccess';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PremiumFeaturesPage() {
  const { user, subscription } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const premiumFeatures = [
    {
      title: 'Advanced Price Analytics',
      description: 'Get detailed price history charts and analytics for all your tracked products.',
      icon: '📊'
    },
    {
      title: 'Price Drop Predictions',
      description: 'AI-powered predictions for when prices are likely to drop based on historical data.',
      icon: '🔮'
    },
    {
      title: 'Competitor Price Alerts',
      description: 'Get notified when competitors change their prices for similar products.',
      icon: '🔔'
    },
    {
      title: 'Unlimited Product Tracking',
      description: 'Track as many products as you want across multiple retailers.',
      icon: '🔍'
    },
    {
      title: 'Custom Alert Thresholds',
      description: 'Set custom price thresholds for alerts on specific products.',
      icon: '⚙️'
    },
    {
      title: 'Priority Email Notifications',
      description: 'Receive priority email notifications for price changes and deals.',
      icon: '📧'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-4">Premium Features</h1>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        Unlock the full potential of PriceTrack with our premium features. 
        Get advanced analytics, predictions, and unlimited tracking.
      </p>

      <PremiumOnly>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">You have Premium Access!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for being a premium subscriber. Enjoy all the advanced features.
          </p>
          <Link 
            href="/dashboard" 
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </PremiumOnly>
    </div>
  );
} 
 
 
 