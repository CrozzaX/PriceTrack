import Image from 'next/image';

interface PriceStatsProps {
  currentPrice: number;
  averagePrice: number;
  highestPrice: number;
  lowestPrice: number;
  currency?: string;
}

const PriceStats = ({ 
  currentPrice, 
  averagePrice, 
  highestPrice, 
  lowestPrice, 
  currency = '₹'
}: PriceStatsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="text-[#374151] text-base font-medium mb-3">Current Price</h3>
        <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-full">
          <Image
            src="/assets/icons/price-tag.svg"
            alt="Current Price"
            width={24}
            height={24}
          />
          <span className="text-xl font-semibold text-gray-900">
            {currency} {currentPrice.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="text-[#374151] text-base font-medium mb-3">Average Price</h3>
        <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-full">
          <Image
            src="/assets/icons/chart.svg"
            alt="Average Price"
            width={24}
            height={24}
          />
          <span className="text-xl font-semibold text-gray-900">
            {currency} {averagePrice.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="text-[#374151] text-base font-medium mb-3">Highest Price</h3>
        <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-full">
          <Image
            src="/assets/icons/arrow-up.svg"
            alt="Highest Price"
            width={24}
            height={24}
          />
          <span className="text-xl font-semibold text-gray-900">
            {currency} {highestPrice.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl">
        <h3 className="text-[#374151] text-base font-medium mb-3">Lowest Price</h3>
        <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-full">
          <Image
            src="/assets/icons/arrow-down.svg"
            alt="Lowest Price"
            width={24}
            height={24}
          />
          <span className="text-xl font-semibold text-gray-900">
            {currency} {lowestPrice.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PriceStats; 