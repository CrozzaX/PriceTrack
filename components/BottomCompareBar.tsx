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
      <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t z-40 transition-all duration-500 ease-in-out ${isExpanded ? 'h-[400px]' : 'h-[80px]'}`}>
        <div className="container mx-auto px-4 py-3 h-full">
          {/* Header with toggle */}
          <div className="flex items-center justify-between sticky top-0 bg-white py-2 z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-secondary hover:text-primary transition-colors duration-300 min-w-[100px]"
              >
                <Image
                  src={`/assets/icons/${isExpanded ? 'chevron-down' : 'chevron-up'}.svg`}
                  alt=""
                  width={20}
                  height={20}
                  className={`transition-transform duration-300 ${isExpanded ? 'rotate-0' : 'rotate-180'}`}
                />
                <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
              </button>
              <span className="text-sm text-gray-600 ml-4 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                  <path d="M9 9h.01"></path>
                  <path d="M15 15h.01"></path>
                  <path d="M9 15h.01"></path>
                  <path d="M15 9h.01"></path>
                </svg>
                {compareProducts.length} {compareProducts.length === 1 ? 'item' : 'items'} selected
              </span>
            </div>
            <button
              onClick={() => setIsCompareOpen(true)}
              className="bg-primary text-white px-6 py-2.5 rounded-full hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center gap-2 font-medium"
            >
              <span>Compare Now</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="animate-pulse"
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </button>
          </div>

          <div className="overflow-auto h-[calc(100%-60px)]">
            {/* Product Grid */}
            <div className={`${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 hidden'} transition-all duration-500`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {productsToShow.map((product, index) => (
                  <div 
                    key={product._id} 
                    className="compare-product-card hover:shadow-md transition-all duration-300 hover:scale-[1.03] hover:border-primary/20 group"
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      animationFillMode: 'forwards',
                      animation: 'fadeIn 0.5s ease-out'
                    }}
                  >
                    <button
                      onClick={() => product._id && removeFromCompare(product._id)}
                      className="compare-remove-button hover:scale-110 hover:shadow-md transition-all duration-300"
                    >
                      ×
                    </button>

                    <div className="flex flex-col gap-3">
                      {/* Image and Title */}
                      <div className="flex gap-3 items-start">
                        <div className="w-20 h-20 flex-shrink-0 border rounded-lg overflow-hidden group-hover:border-primary/20 transition-all duration-300 relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skeleton-shine"></div>
                          <Image
                            src={product.image || '/assets/images/placeholder.jpg'}
                            alt={product.title}
                            width={80}
                            height={80}
                            className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500 z-10"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors duration-300">{product.title}</h3>
                          <div className="mt-1">
                            <span className="text-lg font-bold text-secondary block group-hover:text-primary transition-colors duration-300 group-hover:scale-105 transform origin-left">
                              {product.currency}{formatNumber(product.currentPrice || 0)}
                            </span>
                            {product.originalPrice && product.originalPrice > product.currentPrice && (
                              <span className="text-sm text-gray-500 line-through group-hover:opacity-80 transition-opacity duration-300">
                                {product.currency}{formatNumber(product.originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="quick-stat-item group-hover:shadow-sm transition-all duration-300 group-hover:border-primary/10 border border-transparent">
                          <span className="text-xs text-gray-500">Rating</span>
                          <div className="flex items-center gap-1">
                            <Image src="/assets/icons/star.svg" alt="star" width={12} height={12} className="group-hover:rotate-[20deg] transition-transform duration-300" />
                            <span className="text-sm font-medium">{product.stars || 0}</span>
                          </div>
                        </div>
                        <div className="quick-stat-item group-hover:shadow-sm transition-all duration-300 group-hover:border-primary/10 border border-transparent">
                          <span className="text-xs text-gray-500">Reviews</span>
                          <div className="flex items-center gap-1">
                            <Image src="/assets/icons/comment.svg" alt="reviews" width={12} height={12} className="group-hover:scale-110 transition-transform duration-300" />
                            <span className="text-sm font-medium">{product.reviewsCount || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="relative">
                        <span className="text-xs font-medium block mb-1 group-hover:translate-x-1 transition-transform duration-300">Description:</span>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {product.description || 'No description available'}
                        </p>
                        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-500"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Minimized View */}
            <div className={`flex items-center gap-4 ${isExpanded ? 'hidden' : 'flex animate-fadeIn'}`}>
              {productsToShow.map((product, index) => (
                <div 
                  key={product._id} 
                  className="compare-product-thumbnail hover:shadow-md transition-all duration-300 hover:scale-110 hover:border-primary/20 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Image
                    src={product.image || '/assets/images/placeholder.jpg'}
                    alt={product.title}
                    width={64}
                    height={64}
                    className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    onClick={() => product._id && removeFromCompare(product._id)}
                    className="compare-remove-button hover:scale-110 hover:shadow-md transition-all duration-300"
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
