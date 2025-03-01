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
  Area,
  AreaChart,
  ReferenceLine,
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
      <div className="w-full h-[400px] bg-white p-4 rounded-xl shadow-sm flex items-center justify-center">
        Loading chart...
      </div>
    );
  }

  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div className="w-full h-[400px] bg-white p-4 rounded-xl shadow-sm flex items-center justify-center">
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

  // Calculate min and max prices for reference lines
  const prices = chartData.map(item => item.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Format INR currency with commas (e.g., 1,23,456)
  const formatINR = (value: number) => {
    return value.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
          <p className="text-gray-600 font-medium">{label}</p>
          <p className="text-[#4F46E5] font-bold text-lg">
            {formatINR(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px] bg-white p-6 rounded-xl shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date"
            tick={{ fill: '#6B7280' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6B7280' }}
            tickFormatter={(value) => formatINR(value).replace('₹', '₹')}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
            domain={[minPrice * 0.9, maxPrice * 1.1]}
          />
          <Tooltip content={<CustomTooltip />} />
          <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" opacity={0.5} />
          <ReferenceLine y={minPrice} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Lowest', position: 'insideBottomRight', fill: '#10B981' }} />
          <ReferenceLine y={maxPrice} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Highest', position: 'insideTopRight', fill: '#EF4444' }} />
          <Area
            type="monotone"
            dataKey="price"
            name="Price (INR)"
            stroke="#4F46E5"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorPrice)"
            activeDot={{ r: 8, strokeWidth: 0, fill: '#4F46E5' }}
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceHistoryChart;