"use client"

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
} from 'recharts';
import { PriceHistoryItem } from '@/types';
import { useState, useEffect } from 'react';

interface PriceHistoryChartProps {
  priceHistory: PriceHistoryItem[];
}

const PriceHistoryChart = ({ priceHistory }: PriceHistoryChartProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow-sm flex items-center justify-center">
        Loading chart...
      </div>
    );
  }

  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow-sm flex items-center justify-center">
        No price history available
      </div>
    );
  }

  // Sort the price history by date
  const sortedData = [...priceHistory].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Format the data for the chart
  const chartData = sortedData.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    price: Number(item.price)
  }));

  // Format INR currency with commas (e.g., 1,23,456)
  const formatINR = (value: number) => {
    return value.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date"
            tick={{ fill: '#666666' }}
          />
          <YAxis
            tick={{ fill: '#666666' }}
            tickFormatter={(value) => formatINR(value)}
          />
          <Tooltip
            formatter={(value: number) => [formatINR(value), 'Price']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="price"
            name="Price (INR)"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ fill: '#2563eb' }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceHistoryChart;