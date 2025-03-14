'use client';

import { PriceHistoryItem } from '@/types';
import PriceHistoryChart from '@/components/PriceHistoryChart';
import SubscriptionFeatureCheck from './SubscriptionFeatureCheck';
import Link from 'next/link';

interface PriceHistoryWrapperProps {
  priceHistory: PriceHistoryItem[];
  lowestPrice?: number;
  highestPrice?: number;
  currentPrice?: number;
  averagePrice?: number;
}

export default function PriceHistoryWrapper({
  priceHistory,
  lowestPrice,
  highestPrice,
  currentPrice,
  averagePrice
}: PriceHistoryWrapperProps) {
  return (
    <SubscriptionFeatureCheck 
      featureName="price_history"
      fallback={
        <div className="w-full bg-white p-6 rounded-xl shadow-sm">
          <div className="flex flex-col items-center justify-center py-10">
            <div className="bg-blue-50 p-3 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Upgrade to See Price History</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Price history charts are available on our Basic and Premium plans. Upgrade now to unlock this feature and track price trends over time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link 
                href="/subscription" 
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#4F46E5] hover:bg-[#4338CA] transition-all"
              >
                Upgrade Now
              </Link>
              <Link 
                href="/subscription/plans" 
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      }
    >
      <PriceHistoryChart 
        priceHistory={priceHistory}
        lowestPrice={lowestPrice}
        highestPrice={highestPrice}
        currentPrice={currentPrice}
        averagePrice={averagePrice}
      />
    </SubscriptionFeatureCheck>
  );
} 