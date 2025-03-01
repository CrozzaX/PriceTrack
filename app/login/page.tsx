'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showSignup = searchParams.get('signup') === 'true';
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  
  const [activeTab, setActiveTab] = useState(showSignup ? 'signup' : 'login');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' });
  
  // Show message function
  const showMessage = (isSuccess: boolean, message: string) => {
    if (isSuccess) {
      setSuccessMessage(message);
      setErrorMessage('');
    } else {
      setErrorMessage(message);
      setSuccessMessage('');
    }
    
    setTimeout(() => {
      setSuccessMessage('');
      setErrorMessage('');
    }, 5000);
  };
  
  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage(true, 'Login successful! Redirecting...');
        
        // Store token in both localStorage and cookie
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        Cookies.set('token', data.token, { expires: 7, path: '/' });
        
        // Trigger a storage event for other components to detect
        window.dispatchEvent(new Event('storage'));
        
        setTimeout(() => {
          router.push(returnUrl);
        }, 1500);
      } else {
        showMessage(false, data.message || 'Invalid email or password. Please try again.');
      }
    } catch (error) {
      showMessage(false, 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle signup form submission
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (signupForm.password.length < 8) {
      showMessage(false, 'Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupForm),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage(true, 'Account created successfully! Redirecting...');
        
        // Store token in both localStorage and cookie
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        Cookies.set('token', data.token, { expires: 7, path: '/' });
        
        // Trigger a storage event for other components to detect
        window.dispatchEvent(new Event('storage'));
        
        setTimeout(() => {
          router.push(returnUrl);
        }, 1500);
      } else {
        showMessage(false, data.message || 'Error creating account. Please try again.');
      }
    } catch (error) {
      showMessage(false, 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-6">
            <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.5 26.5C20.4036 26.5 26 20.9036 26 14C26 7.09644 20.4036 1.5 13.5 1.5C6.59644 1.5 1 7.09644 1 14C1 20.9036 6.59644 26.5 13.5 26.5Z" stroke="#FF7559" strokeWidth="2"/>
              <path d="M8 14L12 18L20 10" stroke="#FF7559" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="font-bold text-xl font-['Space_Grotesk']">Price<span className="text-[#FF7559]">Wise</span></div>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">
            {activeTab === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </h2>
        </div>
        
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-2 text-center font-medium ${
              activeTab === 'login' ? 'text-[#FF7559] border-b-2 border-[#FF7559]' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('login')}
          >
            Log In
          </button>
          <button
            className={`flex-1 py-2 text-center font-medium ${
              activeTab === 'signup' ? 'text-[#FF7559] border-b-2 border-[#FF7559]' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>
        
        <div className="mt-6">
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
              {successMessage}
            </div>
          )}
          
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {errorMessage}
            </div>
          )}
          
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="login-email">
                  Email Address
                </label>
                <input 
                  type="email" 
                  id="login-email" 
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF7559] focus:ring focus:ring-[#FF7559] focus:ring-opacity-20" 
                  placeholder="your@email.com" 
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="login-password">
                  Password
                </label>
                <input 
                  type="password" 
                  id="login-password" 
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF7559] focus:ring focus:ring-[#FF7559] focus:ring-opacity-20" 
                  placeholder="••••••••" 
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-3 px-4 bg-[#FF7559] text-white font-medium rounded-lg hover:bg-opacity-90 transition-all"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="signup-name">
                  Full Name
                </label>
                <input 
                  type="text" 
                  id="signup-name" 
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF7559] focus:ring focus:ring-[#FF7559] focus:ring-opacity-20" 
                  placeholder="John Doe" 
                  required
                  value={signupForm.name}
                  onChange={(e) => setSignupForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="signup-email">
                  Email Address
                </label>
                <input 
                  type="email" 
                  id="signup-email" 
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF7559] focus:ring focus:ring-[#FF7559] focus:ring-opacity-20" 
                  placeholder="your@email.com" 
                  required
                  value={signupForm.email}
                  onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="signup-password">
                  Password
                </label>
                <input 
                  type="password" 
                  id="signup-password" 
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF7559] focus:ring focus:ring-[#FF7559] focus:ring-opacity-20" 
                  placeholder="••••••••" 
                  required 
                  minLength={8}
                  value={signupForm.password}
                  onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-3 px-4 bg-[#FF7559] text-white font-medium rounded-lg hover:bg-opacity-90 transition-all"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          )}
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-[#FF7559]">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 