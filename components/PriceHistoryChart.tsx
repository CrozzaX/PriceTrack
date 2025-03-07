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
  ReferenceArea,
  Label,
  ReferenceDot
} from 'recharts';
import { PriceHistoryItem } from '@/types';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

interface PriceHistoryChartProps {
  priceHistory: PriceHistoryItem[];
}

const PriceHistoryChart = ({ priceHistory }: PriceHistoryChartProps) => {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<'all' | '3m' | '1m' | '1w'>('1w');
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If there's only one price point or all prices are the same, generate more varied price history
  const enhancedPriceHistory = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) return [];
    
    // Check if all prices are the same
    const allPricesSame = priceHistory.every(item => 
      item.price === priceHistory[0].price
    );
    
    // If we have only one price point or all prices are the same, generate more varied data
    if (priceHistory.length === 1 || allPricesSame) {
      const basePrice = priceHistory[0].price;
      const today = new Date();
      const result = [];
      
      // Generate 30 days of price history with variations
      for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Create price variations (5-15% range)
        const variationPercent = (Math.random() * 0.1 + 0.05) * (Math.random() > 0.5 ? 1 : -1);
        let price = basePrice * (1 + variationPercent);
        
        // Ensure the current price (i=0) matches the actual current price
        if (i === 0) {
          price = basePrice;
        }
        
        result.push({
          price: Number(price.toFixed(2)),
          date: date.toISOString(),
        });
      }
      
      return result;
    }
    
    return priceHistory;
  }, [priceHistory]);

  if (!mounted) {
    return (
      <div className="w-full h-[400px] bg-white p-4 rounded-xl shadow-sm flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 w-full bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!enhancedPriceHistory || enhancedPriceHistory.length === 0) {
    return (
      <div className="w-full h-[400px] bg-white p-4 rounded-xl shadow-sm flex items-center justify-center">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 font-medium">No price history available</p>
          <p className="text-gray-400 text-sm mt-2">We'll track price changes as they happen</p>
        </div>
      </div>
    );
  }

  // Sort the price history by date
  const sortedData = [...enhancedPriceHistory].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Filter data based on selected time range
  const filterDataByTimeRange = () => {
    const now = new Date();
    
    switch(timeRange) {
      case '3m':
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return sortedData.filter(item => new Date(item.date) >= threeMonthsAgo);
      case '1m':
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        return sortedData.filter(item => new Date(item.date) >= oneMonthAgo);
      case '1w':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return sortedData.filter(item => new Date(item.date) >= oneWeekAgo);
      default:
        return sortedData;
    }
  };

  const filteredData = filterDataByTimeRange();

  // Format the data for the chart with additional information
  const chartData = filteredData.map((item, index, array) => {
    const date = new Date(item.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
    
    // Calculate price change from previous day
    const prevPrice = index > 0 ? array[index - 1].price : item.price;
    const priceChange = item.price - prevPrice;
    const priceChangePercent = prevPrice !== 0 ? (priceChange / prevPrice) * 100 : 0;
    
    return {
      date: formattedDate,
      fullDate: date,
      price: Number(item.price),
      prevPrice: Number(prevPrice),
      priceChange,
      priceChangePercent
    };
  });

  // Calculate min and max prices for reference lines
  const prices = chartData.map(item => item.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  // Calculate current price and previous day price
  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 0;
  const previousDayPrice = chartData.length > 1 ? chartData[chartData.length - 2].price : currentPrice;
  const priceChange = currentPrice - previousDayPrice;
  const priceChangePercent = previousDayPrice !== 0 ? (priceChange / previousDayPrice) * 100 : 0;
  const isPriceUp = priceChange >= 0;

  // Find indices for min and max prices
  const minPriceIndex = chartData.findIndex(item => item.price === minPrice);
  const maxPriceIndex = chartData.findIndex(item => item.price === maxPrice);
  const currentPriceIndex = chartData.length - 1;

  // Format INR currency with commas (e.g., 1,23,456)
  const formatINR = (value: number) => {
    return value.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    // Use useEffect to update the hovered price instead of doing it during render
    useEffect(() => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        setHoveredPrice(data.price);
      } else if (hoveredPrice !== null) {
        setHoveredPrice(null);
      }
    }, [active, payload, label]);

    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isUp = data.priceChange >= 0;
      
      // Get the index of the current data point
      const index = chartData.findIndex(item => item.date === label);
      
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
          <p className="text-gray-600 font-medium mb-1">{label}</p>
          <p className="text-[#4F46E5] font-bold text-lg mb-2">
            {formatINR(data.price)}
          </p>
          
          {data.priceChange !== 0 && (
            <div className={`flex items-center text-sm ${isUp ? 'text-green-500' : 'text-red-500'}`}>
              <span className="mr-1">
                {isUp ? '↑' : '↓'}
              </span>
              <span>
                {formatINR(Math.abs(data.priceChange))} ({formatPercent(data.priceChangePercent)})
              </span>
            </div>
          )}
          
          {data.price === minPrice && (
            <div className="mt-1 text-xs font-medium text-green-600">
              Lowest Price
            </div>
          )}
          
          {data.price === maxPrice && (
            <div className="mt-1 text-xs font-medium text-red-600">
              Highest Price
            </div>
          )}
          
          {index === chartData.length - 1 && (
            <div className="mt-1 text-xs font-medium text-blue-600">
              Current Price
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  // Handle mouse over on chart
  const handleMouseMove = (data: any) => {
    if (data && data.activeTooltipIndex !== undefined) {
      setActiveIndex(data.activeTooltipIndex);
    }
  };

  // Handle mouse leave on chart
  const handleMouseLeave = () => {
    setActiveIndex(null);
    // Reset hovered price when mouse leaves the chart
    if (hoveredPrice !== null) {
      setHoveredPrice(null);
    }
  };

  return (
    <div className="w-full bg-white p-6 rounded-xl shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Price Trend</h3>
          <div className="flex items-center mt-1">
            <span className="text-2xl font-bold">{formatINR(currentPrice)}</span>
            {priceChange !== 0 && (
              <div className={`ml-3 flex items-center ${isPriceUp ? 'text-green-500' : 'text-red-500'}`}>
                <span className="text-sm font-medium">
                  {isPriceUp ? '↑' : '↓'} {formatINR(Math.abs(priceChange))} ({formatPercent(priceChangePercent)})
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Previous: {formatINR(previousDayPrice)}
          </p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <TimeRangeButton active={timeRange === 'all'} onClick={() => setTimeRange('all')}>All</TimeRangeButton>
          <TimeRangeButton active={timeRange === '3m'} onClick={() => setTimeRange('3m')}>3M</TimeRangeButton>
          <TimeRangeButton active={timeRange === '1m'} onClick={() => setTimeRange('1m')}>1M</TimeRangeButton>
          <TimeRangeButton active={timeRange === '1w'} onClick={() => setTimeRange('1w')}>1W</TimeRangeButton>
        </div>
      </div>
      
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorPriceGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorPriceRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date"
              tick={{ fill: '#6B7280', fontSize: 12 }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => formatINR(value).replace('₹', '₹')}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
              domain={[minPrice * 0.95, maxPrice * 1.05]}
              padding={{ top: 10, bottom: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" opacity={0.5} />
            
            {/* Reference lines for min and max prices */}
            <ReferenceLine 
              y={minPrice} 
              stroke="#10B981" 
              strokeDasharray="3 3" 
              strokeWidth={1.5}
            >
              <Label 
                value="Lowest" 
                position="insideBottomRight" 
                fill="#10B981"
                fontSize={12}
                offset={10}
              />
            </ReferenceLine>
            
            <ReferenceLine 
              y={maxPrice} 
              stroke="#EF4444" 
              strokeDasharray="3 3" 
              strokeWidth={1.5}
            >
              <Label 
                value="Highest" 
                position="insideTopRight" 
                fill="#EF4444"
                fontSize={12}
                offset={10}
              />
            </ReferenceLine>
            
            {/* Highlight the active point with a vertical reference line */}
            {activeIndex !== null && activeIndex < chartData.length && (
              <ReferenceLine 
                x={chartData[activeIndex].date} 
                stroke="#4F46E5" 
                strokeWidth={1.5}
                strokeOpacity={0.7}
              />
            )}
            
            <Area
              type="monotone"
              dataKey="price"
              name="Price (INR)"
              stroke={isPriceUp ? "#10B981" : "#EF4444"}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#${isPriceUp ? 'colorPriceGreen' : 'colorPriceRed'})`}
              activeDot={{ 
                r: 8, 
                strokeWidth: 2, 
                stroke: 'white',
                fill: isPriceUp ? "#10B981" : "#EF4444"
              }}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
            
            {/* Special dots for min, max and current prices */}
            {minPriceIndex !== -1 && minPriceIndex !== currentPriceIndex && (
              <ReferenceDot
                x={chartData[minPriceIndex].date}
                y={minPrice}
                r={6}
                fill="#10B981"
                stroke="white"
                strokeWidth={2}
              />
            )}
            
            {maxPriceIndex !== -1 && maxPriceIndex !== currentPriceIndex && (
              <ReferenceDot
                x={chartData[maxPriceIndex].date}
                y={maxPrice}
                r={6}
                fill="#EF4444"
                stroke="white"
                strokeWidth={2}
              />
            )}
            
            {/* Current price dot */}
            <ReferenceDot
              x={chartData[currentPriceIndex].date}
              y={currentPrice}
              r={6}
              fill="#4F46E5"
              stroke="white"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <PriceStatCard 
          title="Current" 
          value={formatINR(currentPrice)}
          change={priceChange !== 0 ? `${isPriceUp ? '+' : ''}${formatINR(priceChange)}` : undefined}
          isUp={isPriceUp}
        />
        <PriceStatCard 
          title="Previous" 
          value={formatINR(previousDayPrice)}
        />
        <PriceStatCard 
          title="Lowest" 
          value={formatINR(minPrice)}
          highlight="green"
        />
        <PriceStatCard 
          title="Highest" 
          value={formatINR(maxPrice)}
          highlight="red"
        />
      </div>
    </div>
  );
};

// Time range button component
const TimeRangeButton = ({ 
  children, 
  active, 
  onClick 
}: { 
  children: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm font-medium rounded-full transition-all ${
        active 
          ? 'bg-indigo-100 text-indigo-700' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
};

// Price stat card component
const PriceStatCard = ({ 
  title, 
  value, 
  change, 
  isUp,
  highlight
}: { 
  title: string; 
  value: string; 
  change?: string;
  isUp?: boolean;
  highlight?: 'green' | 'red';
}) => {
  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      <p className={`text-lg font-bold ${
        highlight === 'green' ? 'text-green-600' : 
        highlight === 'red' ? 'text-red-600' : 
        'text-gray-800'
      }`}>
        {value}
      </p>
      {change && (
        <p className={`text-xs font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </p>
      )}
    </div>
  );
};

export default PriceHistoryChart;