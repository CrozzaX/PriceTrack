'use client';

import { useCompare } from '@/lib/context/CompareContext';
import { formatNumber } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';
import CompareModal from './CompareModal';

const BottomCompareBar = () => {
  const { compareProducts, removeFromCompare } = useCompare();
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get products in reversed order once at the beginning
  const productsToShow = [...compareProducts].reverse();

  if (compareProducts.length === 0) return null;

  return (
    <>
      <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t z-40 transition-all duration-300 ${isExpanded ? 'h-[400px]' : 'h-[80px]'}`}>
        <div className="container mx-auto px-4 py-3 h-full">
          {/* Header with toggle */}
          <div className="flex items-center justify-between sticky top-0 bg-white py-2 z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-secondary hover:opacity-80 min-w-[100px]"
              >
                <Image
                  src={`/assets/icons/${isExpanded ? 'chevron-down' : 'chevron-up'}.svg`}
                  alt=""
                  width={20}
                  height={20}
                />
                <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
              </button>
              <span className="text-sm text-gray-600 ml-4">
                {compareProducts.length} {compareProducts.length === 1 ? 'item' : 'items'} selected
              </span>
            </div>
            <button
              onClick={() => setIsCompareOpen(true)}
              className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
            >
              Compare Now
            </button>
          </div>

          <div className="overflow-auto h-[calc(100%-60px)]">
            {/* Product Grid */}
            <div className={`${isExpanded ? 'block' : 'hidden'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {productsToShow.map((product) => (
                  <div key={product._id} className="compare-product-card">
                    <button
                      onClick={() => product._id && removeFromCompare(product._id)}
                      className="compare-remove-button"
                    >
                      ×
                    </button>

                    <div className="flex flex-col gap-3">
                      {/* Image and Title */}
                      <div className="flex gap-3 items-start">
                        <div className="w-20 h-20 flex-shrink-0 border rounded-lg overflow-hidden">
                          <Image
                            src={product.image || '/assets/images/placeholder.jpg'}
                            alt={product.title}
                            width={80}
                            height={80}
                            className="object-contain w-full h-full"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm line-clamp-2">{product.title}</h3>
                          <div className="mt-1">
                            <span className="text-lg font-bold text-secondary block">
                              {product.currency}{formatNumber(product.currentPrice || 0)}
                            </span>
                            {product.originalPrice && product.originalPrice > product.currentPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                {product.currency}{formatNumber(product.originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="quick-stat-item">
                          <span className="text-xs text-gray-500">Rating</span>
                          <div className="flex items-center gap-1">
                            <Image src="/assets/icons/star.svg" alt="star" width={12} height={12} />
                            <span className="text-sm font-medium">{product.stars || 0}</span>
                          </div>
                        </div>
                        <div className="quick-stat-item">
                          <span className="text-xs text-gray-500">Reviews</span>
                          <div className="flex items-center gap-1">
                            <Image src="/assets/icons/comment.svg" alt="reviews" width={12} height={12} />
                            <span className="text-sm font-medium">{product.reviewsCount || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <span className="text-xs font-medium block mb-1">Description:</span>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {product.description || 'No description available'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Minimized View */}
            <div className={`flex items-center gap-4 ${isExpanded ? 'hidden' : 'flex'}`}>
              {productsToShow.map((product) => (
                <div key={product._id} className="compare-product-thumbnail">
                  <Image
                    src={product.image || '/assets/images/placeholder.jpg'}
                    alt={product.title}
                    width={64}
                    height={64}
                    className="object-contain w-full h-full"
                  />
                  <button
                    onClick={() => product._id && removeFromCompare(product._id)}
                    className="compare-remove-button"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CompareModal 
        isOpen={isCompareOpen}
        closeModal={() => setIsCompareOpen(false)}
      />
    </>
  );
};

export default BottomCompareBar;
