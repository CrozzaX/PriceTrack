'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PriceAlertModal({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email submission here
    console.log('Submitting email:', email);
    // Add your email subscription logic here
    onClose();
  };

  return (
    <div className="dialog-container" onClick={onClose}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        <button className="dialog-close" onClick={onClose}>×</button>
        
        <div className="mb-3">
          <Image
            src="/assets/icons/price-tag.svg"
            alt="Price Tag"
            width={40}
            height={40}
          />
        </div>

        <h2 className="dialog-head_text">
          Stay updated with product pricing alerts right in your inbox!
        </h2>
        
        <p className="dialog-description">
          Never miss a bargain again with our timely alerts!
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <div className="w-full text-left mb-2">
            <label htmlFor="email" className="dialog-label">Email address</label>
          </div>
          
          <div className="dialog-input-wrapper">
            <div className="dialog-icon left">
              <Image
                src="/assets/icons/mail.svg"
                alt="Email"
                width={20}
                height={20}
              />
            </div>
            <input
              id="email"
              type="email"
              placeholder="Enter your email address"
              className="dialog-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="mt-4 w-full text-white rounded-full px-6 py-3 flex items-center justify-center gap-3 hover:opacity-90 transition-opacity font-medium"
            style={{ 
              backgroundColor: '#111827',
              color: 'white'
            }}
          >
            Track
          </button>
        </form>
      </div>
    </div>
  );
} 