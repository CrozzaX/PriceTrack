"use client"

import { FormEvent, Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Image from 'next/image'
import { addUserEmailToProduct } from '@/lib/actions'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/lib/context/AuthContext'
import Link from 'next/link'

interface Props {
  productId: string
}

const Modal = ({ productId }: Props) => {
  let [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isAlreadyTracking, setIsAlreadyTracking] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [productLimit, setProductLimit] = useState({ current: 0, max: 5 });
  const { user, subscription } = useAuth();

  // Check subscription limits
  useEffect(() => {
    if (!user) return;
    
    // If no subscription, user is on free tier
    if (!subscription) {
      setProductLimit({ current: 0, max: 5 });
      return;
    }
    
    // Check subscription plan limits
    const features = subscription.subscription_plans?.features;
    const hasUnlimited = features?.unlimited_products === true;
    
    if (hasUnlimited) {
      setProductLimit({ current: 0, max: Infinity });
    } else {
      const maxProducts = features?.max_products || 5;
      setProductLimit({ current: 0, max: maxProducts });
    }
  }, [user, subscription]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsSuccess(false);
    setStatusMessage('');
    setIsAlreadyTracking(false);
    setLimitReached(false);

    try {
      // Add email to product tracking list
      const result = await addUserEmailToProduct(productId, email);
      
      if (result.success) {
        setIsSuccess(true);
        
        if (result.isAlreadyTracking) {
          // User is already tracking this product
          setIsAlreadyTracking(true);
          toast.success('You are already tracking this product!');
          setStatusMessage('You are already tracking this product. Use the "Test Email" button below to verify your email works.');
        } else if (result.emailSent) {
          // New tracking with successful email
          toast.success('Product tracking enabled! Check email for confirmation.');
          setStatusMessage('Product tracking enabled! You should receive a confirmation email shortly. Please check your spam folder if you don\'t see it.');
        } else {
          // Tracking enabled but email failed
          toast.success('Product tracking enabled, but email delivery failed.');
          setStatusMessage(`Product tracking enabled, but the confirmation email couldn't be sent. Error: ${result.emailError}`);
        }
      } else if (result.limitReached) {
        // User has reached their product limit
        setLimitReached(true);
        setProductLimit({
          current: result.currentCount || 0,
          max: result.maxAllowed || 5
        });
        toast.error('Product limit reached!');
        setStatusMessage(`You've reached the maximum limit of ${result.maxAllowed} products for your subscription plan. Please upgrade to track more products.`);
      } else {
        // Other error
        toast.error('Failed to track product. Please try again.');
        setStatusMessage(`Error: ${result.message || 'Unknown error occurred'}`);
      }
    } catch (error: any) {
      console.error('Error in tracking product:', error);
      toast.error('Failed to track product');
      setStatusMessage(`Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // New function to test email directly
  const handleTestEmail = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsTestingEmail(true);
    
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (data.data.success) {
        toast.success('Test email sent! Please check your inbox (and spam folder)');
        if (isAlreadyTracking) {
          setStatusMessage('Test email sent! Since you\'re already tracking this product, we\'ve sent a test email to verify your email works.');
        }
      } else {
        toast.error(`Failed to send test email: ${data.data.error}`);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Error sending test email. Please try again.');
    } finally {
      setIsTestingEmail(false);
    }
  }

  const openModal = () => setIsOpen(true);

  const closeModal = () => setIsOpen(false);

  return (
    <>
      <motion.button 
        type="button" 
        className="bg-[#111827] text-white rounded-full px-6 py-3 w-fit flex items-center justify-center gap-3 min-w-[200px] hover:opacity-90"
        onClick={openModal}
        whileHover={{ scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)" }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <motion.div
          whileHover={{ rotate: 15 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Image 
            src="/assets/icons/bookmark.svg"
            alt="bookmark"
            width={22}
            height={22}
          />
        </motion.div>
        <motion.span
          initial={{ x: 0 }}
          whileHover={{ x: 3 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          Track
        </motion.span>
      </motion.button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" onClose={closeModal} className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" /> 
            </Transition.Child>
            
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-400"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <motion.div 
                className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-auto shadow-xl"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.19, 1, 0.22, 1],
                  staggerChildren: 0.1
                }}
              >
                <div className="flex flex-col">
                  <div className="flex justify-between">
                    <motion.div 
                      className="p-3 border border-gray-200 rounded-10"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        repeatType: "reverse",
                        ease: "easeInOut" 
                      }}
                    >
                      <Image 
                        src="/assets/icons/logo.svg"
                        alt="logo"
                        width={28}
                        height={28}
                      />
                    </motion.div>

                    <motion.div
                      whileHover={{ rotate: 90, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Image 
                        src="/assets/icons/x-close.svg"
                        alt="close"
                        width={24}
                        height={24}
                        className="cursor-pointer"
                        onClick={closeModal}
                      />
                    </motion.div>
                  </div>

                  <motion.h4 
                    className="text-xl font-bold text-gray-900 mt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                  >
                    {isSuccess 
                      ? isAlreadyTracking 
                        ? "You're already tracking this product" 
                        : "Success! You're now tracking this product" 
                      : "Stay updated with product pricing alerts right in your inbox!"}
                  </motion.h4>

                  <motion.p 
                    className="text-sm text-gray-600 mt-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    {statusMessage || (isSuccess 
                      ? "Check your email for a confirmation message. We'll notify you of any price changes." 
                      : "Never miss a bargain again with our timely alerts!")}
                  </motion.p>
                </div>

                {isSuccess && !isAlreadyTracking ? (
                  <motion.div 
                    className="mt-6 flex justify-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p>{statusMessage}</p>
                    </div>
                  </motion.div>
                ) : isSuccess && isAlreadyTracking ? (
                  // Special UI for already tracking users
                  <motion.div 
                    className="mt-6 flex flex-col gap-4"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <div className="bg-blue-50 text-blue-700 p-4 rounded-lg flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>{statusMessage}</p>
                    </div>
                    
                    <button
                      onClick={handleTestEmail}
                      disabled={isTestingEmail || !email.includes('@')}
                      className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
                        isTestingEmail 
                          ? 'bg-gray-300 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isTestingEmail ? (
                        <>
                          <motion.div 
                            className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <span>Sending Test...</span>
                        </>
                      ) : (
                        <>
                          <Image 
                            src="/assets/icons/mail.svg"
                            alt="mail"
                            width={18}
                            height={18}
                          />
                          <span>Send Test Email Now</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                ) : (
                  <motion.form 
                    className="flex flex-col mt-5" 
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <label htmlFor="email" className="text-sm font-medium text-gray-700 text-left">
                      Email address
                    </label>
                    <div className="relative mt-1 group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <Image 
                            src="/assets/icons/mail.svg"
                            alt='mail'
                            width={18}
                            height={18}
                          />
                        </motion.div>
                      </div>
                      <input 
                        required
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className='w-full py-2.5 pl-10 pr-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-300'
                      />
                    </div>

                    <motion.button 
                      type="submit"
                      className="bg-[#111827] text-white py-2.5 px-5 rounded-lg mt-4 hover:opacity-90 flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02, boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.1)" }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div 
                            className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <motion.div
                            whileHover={{ rotate: 15 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <Image 
                              src="/assets/icons/bookmark.svg"
                              alt="bookmark"
                              width={18}
                              height={18}
                            />
                          </motion.div>
                          <motion.span
                            initial={{ x: 0 }}
                            whileHover={{ x: 3 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            Track Now
                          </motion.span>
                        </>
                      )}
                    </motion.button>
                    
                    {/* Test email button */}
                    <motion.button 
                      type="button"
                      onClick={handleTestEmail}
                      className="bg-blue-600 text-white py-2.5 px-5 rounded-lg mt-2 hover:bg-blue-700 flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02, boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.1)" }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      disabled={isTestingEmail || !email.includes('@')}
                    >
                      {isTestingEmail ? (
                        <>
                          <motion.div 
                            className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <span>Sending Test...</span>
                        </>
                      ) : (
                        <>
                          <motion.div
                            whileHover={{ rotate: 15 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <Image 
                              src="/assets/icons/mail.svg"
                              alt="mail"
                              width={18}
                              height={18}
                            />
                          </motion.div>
                          <motion.span
                            initial={{ x: 0 }}
                            whileHover={{ x: 3 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            Test Email
                          </motion.span>
                        </>
                      )}
                    </motion.button>
                    
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      We'll send you an email confirmation. Please check your spam folder if you don't see it.
                    </p>
                  </motion.form>
                )}

                {/* Show subscription upgrade prompt if limit reached */}
                {limitReached && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="p-2 bg-red-100 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-red-800">
                          Product limit reached ({productLimit.current}/{productLimit.max})
                        </h4>
                        <p className="text-sm mt-1 text-red-600">
                          You've reached the maximum number of products for your subscription plan.
                        </p>
                        <div className="mt-3">
                          <Link 
                            href="/subscription/plans" 
                            className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-800"
                          >
                            Upgrade Plan
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default Modal