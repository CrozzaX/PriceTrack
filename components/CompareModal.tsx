import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';
import Image from 'next/image';
import { useCompare } from '@/lib/context/CompareContext';
import { formatNumber } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2
      }
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      y: 30, 
      opacity: 0,
      scale: 0.9,
      rotate: -2
    },
    visible: { 
      y: 0, 
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    exit: {
      y: -20,
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.3
      }
    },
    hover: {
      y: -8,
      scale: 1.03,
      boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)",
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 15
      }
    },
    tap: {
      scale: 0.95
    }
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
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-400"
              enterFrom="opacity-0 scale-95 translate-y-8"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-8"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-8">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      type: "spring",
                      stiffness: 200
                    }}
                    className="flex items-center"
                  >
                    <motion.div
                      animate={{ 
                        rotate: [0, 5, 0, -5, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        repeatDelay: 5
                      }}
                      className="mr-3"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF7559" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                        <path d="M9 9h.01"></path>
                        <path d="M15 15h.01"></path>
                        <path d="M9 15h.01"></path>
                        <path d="M15 9h.01"></path>
                      </svg>
                    </motion.div>
                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                      Compare Products 
                      <motion.span 
                        className="ml-2 inline-flex items-center justify-center bg-blue-100 text-blue-800 text-sm font-medium rounded-full px-3 py-1"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                      >
                        {productsToShow.length}
                      </motion.span>
                    </Dialog.Title>
                  </motion.div>

                  <div className="flex gap-4">
                    <motion.button
                      onClick={clearCompare}
                      className="text-sm text-red-500 hover:text-red-700 px-4 py-2 rounded-lg flex items-center gap-2 border border-transparent hover:border-red-200"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <motion.svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        animate={{ 
                          rotate: [0, 10, 0, -10, 0],
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          repeatDelay: 1
                        }}
                      >
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </motion.svg>
                      <span>Clear All</span>
                    </motion.button>
                    
                    <motion.button
                      onClick={closeModal}
                      className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors duration-300"
                      whileHover={{ rotate: 90, scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </motion.button>
                  </div>
                </div>

                <AnimatePresence>
                  {productsToShow.length > 0 ? (
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      {productsToShow.map((product, index) => (
                        <motion.div 
                          key={product._id}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                          variants={itemVariants}
                          whileHover="hover"
                          layout
                        >
                          <div className="relative">
                            <div className="h-52 bg-gray-50 relative overflow-hidden group">
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-blue-50 via-transparent to-blue-50 opacity-0 group-hover:opacity-100"
                                animate={{ 
                                  x: ["0%", "100%", "0%"],
                                }}
                                transition={{ 
                                  duration: 3, 
                                  repeat: Infinity,
                                  repeatType: "loop"
                                }}
                              />
                              <Image
                                src={getImageUrl(product.image)}
                                alt={product.title}
                                fill
                                className="object-contain p-4 group-hover:scale-110 transition-transform duration-700"
                              />
                              <motion.div 
                                className="absolute top-0 left-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-br-lg"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                              >
                                {product.originalPrice && product.originalPrice !== product.currentPrice ? (
                                  `${Math.round(((product.originalPrice - product.currentPrice) / product.originalPrice) * 100)}% OFF`
                                ) : "COMPARE"}
                              </motion.div>
                            </div>
                            <motion.button
                              onClick={() => removeFromCompare(product._id || '')}
                              className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow-md hover:bg-red-50 transition-colors duration-300"
                              whileHover={{ scale: 1.2, backgroundColor: "#FEE2E2" }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </motion.button>
                          </div>
                          
                          <div className="p-5">
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 h-10 mb-3">{product.title}</h3>
                            
                            <motion.div 
                              className="mt-4 space-y-3"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Price</span>
                                <motion.span 
                                  className="text-lg font-bold text-blue-600"
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  transition={{ 
                                    delay: 0.4 + index * 0.1,
                                    type: "spring",
                                    stiffness: 300
                                  }}
                                >
                                  ₹{formatPrice(product.currentPrice)}
                                </motion.span>
                              </div>
                              
                              {product.originalPrice && product.originalPrice !== product.currentPrice && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500">Original Price</span>
                                  <span className="text-xs text-gray-500 line-through">₹{formatPrice(product.originalPrice)}</span>
                                </div>
                              )}
                              
                              <motion.div 
                                className="h-px bg-gray-100 my-3"
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                              />
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-500 mb-1">Rating</span>
                                  <div className="flex items-center">
                                    <motion.svg 
                                      xmlns="http://www.w3.org/2000/svg" 
                                      width="14" 
                                      height="14" 
                                      viewBox="0 0 24 24" 
                                      fill="#FFD700" 
                                      stroke="#FFD700" 
                                      strokeWidth="1" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round"
                                      animate={{ 
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 5, 0]
                                      }}
                                      transition={{ 
                                        duration: 1.5, 
                                        repeat: Infinity,
                                        repeatDelay: 2
                                      }}
                                    >
                                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </motion.svg>
                                    <span className="text-sm ml-1 font-medium">{product.stars || 'N/A'}</span>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-500 mb-1">Reviews</span>
                                  <div className="flex items-center">
                                    <motion.svg 
                                      xmlns="http://www.w3.org/2000/svg" 
                                      width="14" 
                                      height="14" 
                                      viewBox="0 0 24 24" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round"
                                      className="text-blue-500"
                                    >
                                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </motion.svg>
                                    <span className="text-sm ml-1 font-medium">{product.reviewsCount || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                            
                            <motion.a
                              href={product.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-5 block text-center text-sm text-white bg-blue-600 hover:bg-blue-700 py-2.5 rounded-lg transition-colors duration-300"
                              whileHover={{ 
                                scale: 1.03, 
                                boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.1)" 
                              }}
                              whileTap={{ scale: 0.97 }}
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ 
                                delay: 0.6 + index * 0.1,
                                type: "spring",
                                stiffness: 300
                              }}
                            >
                              <span className="flex items-center justify-center gap-2">
                                View Product
                                <motion.svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  width="16" 
                                  height="16" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                  animate={{ x: [0, 4, 0] }}
                                  transition={{ 
                                    duration: 1.5, 
                                    repeat: Infinity,
                                    repeatDelay: 1
                                  }}
                                >
                                  <path d="M5 12h14"></path>
                                  <path d="m12 5 7 7-7 7"></path>
                                </motion.svg>
                              </span>
                            </motion.a>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="text-center py-16"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, 0, -5, 0]
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity
                        }}
                        className="inline-block mb-4"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                          <path d="M9 9h.01"></path>
                          <path d="M15 15h.01"></path>
                          <path d="M9 15h.01"></path>
                          <path d="M15 9h.01"></path>
                        </svg>
                      </motion.div>
                      <p className="text-gray-500 text-lg">No products to compare. Add some products first!</p>
                      <motion.button
                        onClick={closeModal}
                        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Browse Products
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CompareModal;
