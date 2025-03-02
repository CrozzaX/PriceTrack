import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Image from 'next/image';
import { useCompare } from '@/lib/context/CompareContext';
import { formatNumber } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  closeModal: () => void;
}

const CompareModal = ({ isOpen, closeModal }: Props) => {
  const { compareProducts, removeFromCompare, clearCompare } = useCompare();

  // Get products in reversed order once
  const productsToShow = [...compareProducts].reverse();

  const getImageUrl = (url: string | undefined): string => {
    if (!url) return '/assets/images/placeholder.jpg';
    return url.startsWith("//") ? `https:${url}` : url;
  };

  const formatPrice = (price: number | undefined): string => {
    return typeof price === 'number' ? formatNumber(price) : '0';
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <path d="M16 3h5v5"></path><path d="M8 3H3v5"></path>
                      <path d="M3 16v5h5"></path><path d="M16 21h5v-5"></path>
                      <path d="M21 16V8a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1Z"></path>
                    </svg>
                    Compare Products
                  </Dialog.Title>
                  <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
                    <Image src="/assets/icons/x-close.svg" alt="close" width={24} height={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {productsToShow.map((product, index) => (
                    <div 
                      key={product._id} 
                      className="border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-500 bg-white relative overflow-hidden group hover:scale-[1.03] hover:translate-y-[-8px]"
                      style={{ 
                        animationDelay: `${index * 100}ms`,
                        animationFillMode: 'forwards',
                        animation: 'fadeIn 0.5s ease-out'
                      }}
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-bl-full -z-10 group-hover:bg-primary/20 transition-colors duration-300"></div>
                      <div className="absolute bottom-0 left-0 h-1 w-0 bg-primary group-hover:w-full transition-all duration-500 ease-out"></div>
                      <div className="relative">
                        <button
                          onClick={() => product._id && removeFromCompare(product._id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all duration-200 z-10 hover:scale-110 hover:shadow-md"
                        >
                          <Image src="/assets/icons/x-close.svg" alt="remove" width={16} height={16} />
                        </button>
                        <div className="h-48 flex items-center justify-center p-4 bg-gray-50 rounded-lg mb-4 group-hover:scale-[1.02] transition-transform duration-500 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skeleton-shine"></div>
                          <Image
                            src={getImageUrl(product.image)}
                            alt={product.title || 'Product Image'}
                            width={180}
                            height={180}
                            className="object-contain max-h-40 group-hover:scale-105 transition-transform duration-500 z-10 relative"
                          />
                        </div>
                      </div>
                      <h4 className="font-semibold text-lg mt-2 line-clamp-2 h-14 group-hover:text-primary transition-colors duration-300">{product.title || 'Untitled Product'}</h4>
                      <div className="flex items-end gap-2 mt-3">
                        <p className="text-xl font-bold text-primary group-hover:scale-105 transition-transform duration-300">
                          {product.currency || '$'}{formatPrice(product.currentPrice)}
                        </p>
                        {product.originalPrice && product.originalPrice > (product.currentPrice || 0) && (
                          <p className="text-sm text-gray-500 line-through group-hover:opacity-80 transition-opacity duration-300">
                            {product.currency || '$'}{formatPrice(product.originalPrice)}
                          </p>
                        )}
                      </div>
                      <div className="mt-4">
                        <h5 className="font-semibold text-gray-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>
                          </svg>
                          Description:
                        </h5>
                        <p className="text-sm mt-1 line-clamp-3 text-gray-600">{product.description || 'No description available'}</p>
                      </div>
                      <div className="mt-4 bg-gray-50 p-3 rounded-lg group-hover:bg-gray-100/80 transition-colors duration-300">
                        <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                          </svg>
                          Specifications:
                        </h5>
                        <ul className="text-sm space-y-1.5">
                          <li className="flex justify-between group-hover:translate-x-1 transition-transform duration-300 delay-[50ms]">
                            <span className="text-gray-600">Current Price:</span>
                            <span className="font-medium">{product.currency || '$'}{formatPrice(product.currentPrice)}</span>
                          </li>
                          <li className="flex justify-between group-hover:translate-x-1 transition-transform duration-300 delay-[100ms]">
                            <span className="text-gray-600">Original Price:</span>
                            <span className="font-medium">{product.currency || '$'}{formatPrice(product.originalPrice)}</span>
                          </li>
                          <li className="flex justify-between group-hover:translate-x-1 transition-transform duration-300 delay-[150ms]">
                            <span className="text-gray-600">Discount:</span>
                            <span className="font-medium">{product.discountRate || 0}%</span>
                          </li>
                          <li className="flex justify-between group-hover:translate-x-1 transition-transform duration-300 delay-[200ms]">
                            <span className="text-gray-600">Reviews:</span>
                            <span className="font-medium">{product.reviewsCount || 0}</span>
                          </li>
                          <li className="flex justify-between group-hover:translate-x-1 transition-transform duration-300 delay-[250ms]">
                            <span className="text-gray-600">Rating:</span>
                            <span className="font-medium flex items-center gap-1">
                              {product.stars || 0}
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-[20deg] transition-transform duration-300">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                              </svg>
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                {compareProducts.length > 0 && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={clearCompare}
                      className="bg-red-500 text-white px-5 py-2.5 rounded-full hover:bg-red-600 transition-all duration-300 flex items-center gap-2 font-medium hover:shadow-lg hover:scale-105"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                      Clear All
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CompareModal;
