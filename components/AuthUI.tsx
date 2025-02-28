'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AuthUI() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' });
  
  const openModal = (tab = 'login') => {
    setActiveTab(tab);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setSuccessMessage('');
    setErrorMessage('');
  };
  
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
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setTimeout(() => {
          router.push('/products');
        }, 2000);
      } else {
        showMessage(false, data.message || 'Invalid email or password. Please try again.');
      }
    } catch (error) {
      showMessage(false, 'An error occurred. Please try again.');
    }
  };
  
  // Handle signup form submission
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupForm.password.length < 8) {
      showMessage(false, 'Password must be at least 8 characters long.');
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
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setTimeout(() => {
          router.push('/products');
        }, 2000);
      } else {
        showMessage(false, data.message || 'Error creating account. Please try again.');
      }
    } catch (error) {
      showMessage(false, 'An error occurred. Please try again.');
    }
  };

  return (
    <>
      <div className="auth-buttons">
        <button 
          className="btn btn-outline"
          onClick={() => openModal('login')}
        >
          Log In
        </button>
        <button 
          className="btn btn-primary"
          onClick={() => openModal('signup')}
        >
          Sign Up
        </button>
      </div>

      {isModalOpen && (
        <div className="dialog-container" onClick={closeModal}>
          <div className="dialog-content p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Welcome to PriceWise</h3>
              <button className="dialog-close" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="dialog-tabs">
              <div 
                className={`dialog-tab ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Log In
              </div>
              <div 
                className={`dialog-tab ${activeTab === 'signup' ? 'active' : ''}`}
                onClick={() => setActiveTab('signup')}
              >
                Sign Up
              </div>
            </div>
            
            <div className="p-6">
              {successMessage && (
                <div className="dialog-message success">
                  {successMessage}
                </div>
              )}
              
              {errorMessage && (
                <div className="dialog-message error">
                  {errorMessage}
                </div>
              )}
              
              {activeTab === 'login' ? (
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="login-email">Email Address</label>
                    <input 
                      type="email" 
                      id="login-email" 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF7559] focus:ring focus:ring-[#FF7559] focus:ring-opacity-20" 
                      placeholder="your@email.com" 
                      required
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="login-password">Password</label>
                    <input 
                      type="password" 
                      id="login-password" 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF7559] focus:ring focus:ring-[#FF7559] focus:ring-opacity-20" 
                      placeholder="••••••••" 
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <button type="submit" className="dialog-btn">Log In</button>
                  <p className="text-gray-500 text-sm text-center mt-4">
                    Don't have an account? <a href="#" className="dialog-link" onClick={(e) => { e.preventDefault(); setActiveTab('signup'); }}>Sign up</a>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleSignup}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="signup-name">Full Name</label>
                    <input 
                      type="text" 
                      id="signup-name" 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF7559] focus:ring focus:ring-[#FF7559] focus:ring-opacity-20" 
                      placeholder="John Doe" 
                      required
                      value={signupForm.name}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="signup-email">Email Address</label>
                    <input 
                      type="email" 
                      id="signup-email" 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF7559] focus:ring focus:ring-[#FF7559] focus:ring-opacity-20" 
                      placeholder="your@email.com" 
                      required
                      value={signupForm.email}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="signup-password">Password</label>
                    <input 
                      type="password" 
                      id="signup-password" 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#FF7559] focus:ring focus:ring-[#FF7559] focus:ring-opacity-20" 
                      placeholder="••••••••" 
                      required 
                      minLength={8}
                      value={signupForm.password}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <button type="submit" className="dialog-btn">Create Account</button>
                  <p className="text-gray-500 text-sm text-center mt-4">
                    Already have an account? <a href="#" className="dialog-link" onClick={(e) => { e.preventDefault(); setActiveTab('login'); }}>Log in</a>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 