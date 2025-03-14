'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import FeatureAccess from '@/components/subscription/FeatureAccess';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function BusinessFeaturesPage() {
  const { user, subscription } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const businessFeatures = [
    {
      title: 'API Access',
      description: 'Integrate PriceTrack data directly into your own systems with our comprehensive API.',
      icon: '🔌'
    },
    {
      title: 'Bulk Product Tracking',
      description: 'Import and track thousands of products at once with our bulk tracking tools.',
      icon: '📦'
    },
    {
      title: 'Team Collaboration',
      description: 'Add team members to your account and collaborate on price tracking.',
      icon: '👥'
    },
    {
      title: 'Custom Reports',
      description: 'Generate custom reports with the metrics that matter most to your business.',
      icon: '📊'
    },
    {
      title: 'White-label Alerts',
      description: 'Send price alerts to your customers with your own branding.',
      icon: '🏷️'
    },
    {
      title: 'Priority Support',
      description: 'Get priority support from our team with a dedicated account manager.',
      icon: '🛎️'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-4">Business Features</h1>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        Take your business to the next level with our enterprise-grade features.
        Scale your price tracking and integrate with your existing systems.
      </p>

      <FeatureAccess feature="api_access">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessFeatures.map((feature, index) => (
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
          <h2 className="text-2xl font-bold mb-4">You have Business Access!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for being a business subscriber. Enjoy all our enterprise-grade features.
          </p>
          
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link 
              href="/api-docs" 
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              View API Documentation
            </Link>
            <Link 
              href="/dashboard" 
              className="inline-block bg-white border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </FeatureAccess>
    </div>
  );
} 