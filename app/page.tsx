'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import PricingSection from '@/components/subscription/PricingSection';

export default function Home() {
  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const fadeInScale = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  return (
    <div className="w-full">
      <div className="container mx-auto px-4">
        <main className="py-10">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.3,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            <motion.h1 
              className="text-4xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Track Prices, <motion.span 
                className="text-[#FF7559]"
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut" 
                }}
              >
                Save Money
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-lg mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Track product prices across all major online retailers. Get notified when prices drop
              and save money on your favorite products with our powerful price tracking tool.
            </motion.p>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Link href="/products" className="bg-[#FF7559] text-white px-6 py-3 rounded-lg hover:bg-[#E56A50] transition-colors">
                Get Started
              </Link>
            </motion.div>
          </motion.div>

          <section className="mt-20 features-section">
            <motion.h2 
              className="text-3xl font-bold text-center mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              Why Choose <span className="text-[#FF7559]">PriceWise</span>
            </motion.h2>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              <motion.div 
                className="bg-white p-6 rounded-xl shadow-sm"
                variants={fadeInScale}
                whileHover={{ 
                  y: -10, 
                  boxShadow: "0 10px 25px -5px rgba(255, 117, 89, 0.15), 0 10px 10px -5px rgba(255, 117, 89, 0.1)" 
                }}
              >
                <motion.div 
                  className="mb-4 text-[#FF7559]"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </motion.div>
                <h3 className="text-xl font-semibold mb-3">Real-time Price Tracking</h3>
                <p>Monitor prices across multiple e-commerce platforms in real-time.</p>
              </motion.div>
              
              <motion.div 
                className="bg-white p-6 rounded-xl shadow-sm"
                variants={fadeInScale}
                whileHover={{ 
                  y: -10, 
                  boxShadow: "0 10px 25px -5px rgba(255, 117, 89, 0.15), 0 10px 10px -5px rgba(255, 117, 89, 0.1)" 
                }}
              >
                <motion.div 
                  className="mb-4 text-[#FF7559]"
                  whileHover={{ rotate: -10, scale: 1.1 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-9 11-9 11s-9-5-9-11a6.5 6.5 0 0 1 5-6.3"></path>
                    <path d="M12 8.5V13"></path>
                    <path d="M12 16v.01"></path>
                  </svg>
                </motion.div>
                <h3 className="text-xl font-semibold mb-3">Price Drop Alerts</h3>
                <p>Get instant notifications when prices drop on your favorite products.</p>
              </motion.div>
              
              <motion.div 
                className="bg-white p-6 rounded-xl shadow-sm"
                variants={fadeInScale}
                whileHover={{ 
                  y: -10, 
                  boxShadow: "0 10px 25px -5px rgba(255, 117, 89, 0.15), 0 10px 10px -5px rgba(255, 117, 89, 0.1)" 
                }}
              >
                <motion.div 
                  className="mb-4 text-[#FF7559]"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18"></path>
                    <path d="m19 9-5 5-4-4-3 3"></path>
                  </svg>
                </motion.div>
                <h3 className="text-xl font-semibold mb-3">Price History Charts</h3>
                <p>View detailed price history to make informed purchasing decisions.</p>
              </motion.div>
            </motion.div>
          </section>

          {/* Subscription Plans Section */}
          <PricingSection />
        </main>
      </div>
    </div>
  );
}