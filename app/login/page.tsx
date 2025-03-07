'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Login form component that uses useSearchParams
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showSignup = searchParams.get('signup') === 'true';
  const returnUrl = searchParams.get('returnUrl') || '/products';
  
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

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      
      // Create a custom event that will be dispatched when the user returns from Google OAuth
      // Store it in sessionStorage so it persists through the redirect
      sessionStorage.setItem('pendingGoogleAuth', 'true');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}/products?auth=google`
        },
      });

      if (error) {
        showMessage(false, error.message);
      }
    } catch (error) {
      showMessage(false, 'An error occurred during Google sign in');
    } finally {
      setIsLoading(false);
    }
  };

  // Check and handle auth state changes
  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        handleAuthSession(session);
      }
    };
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        handleAuthSession(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Handle auth session
  const handleAuthSession = (session: Session) => {
    try {
      // Get user details from session
      const { user } = session;
      
      // Process profile image URL to use our proxy
      let profileImage = user.user_metadata?.avatar_url || user.user_metadata?.picture;
      
      // If it's a Google image URL, use our proxy
      if (profileImage && (
        profileImage.includes('googleusercontent.com') || 
        profileImage.includes('googleapis.com')
      )) {
        // Encode the URL and pass it through our proxy
        const encodedUrl = encodeURIComponent(profileImage);
        profileImage = `/api/user/image-proxy?url=${encodedUrl}`;
      }
      
      // Create user data object
      const userData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
        avatar_url: profileImage,
        profileImage: profileImage,
        provider: user.app_metadata?.provider,
        role: 'authenticated'
      };

      // Store complete session data
      localStorage.setItem('supabase.auth.token', session.access_token);
      localStorage.setItem('token', session.access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set cookies
      Cookies.set('token', session.access_token, { expires: 7, path: '/' });
      
      // Register user in MongoDB if they don't exist yet
      registerUserInMongoDB(userData);
      
      // Trigger storage event for other components
      // Use a custom event to ensure it's captured
      window.dispatchEvent(new Event('storage'));
      
      // Force multiple refreshes of the navbar by dispatching events at intervals
      // This ensures components have time to initialize and capture the events
      setTimeout(() => {
        window.dispatchEvent(new Event('storage'));
      }, 100);
      
      setTimeout(() => {
        window.dispatchEvent(new Event('storage'));
      }, 500);
      
      setTimeout(() => {
        window.dispatchEvent(new Event('storage'));
      }, 1000);
      
      // Show success message and redirect
      showMessage(true, 'Login successful! Redirecting to products...');
      setTimeout(() => {
        router.push('/products');
      }, 1500);
    } catch (error) {
      console.error('Error handling auth session:', error);
      showMessage(false, 'Error processing login. Please try again.');
    }
  };
  
  // Register user in MongoDB if they don't exist yet
  const registerUserInMongoDB = async (userData: any) => {
    try {
      // Only proceed if this is a Google sign-in
      if (userData.provider !== 'google') return;
      
      const response = await fetch('/api/auth/register-oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          provider: userData.provider,
          profileImage: userData.profileImage || userData.avatar_url
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // If we got a JWT token back, store it as well
        if (data.token) {
          // Store the JWT token in localStorage and cookies
          localStorage.setItem('jwt_token', data.token);
          Cookies.set('jwt_token', data.token, { expires: 7, path: '/' });
          
          console.log('User registered/found in MongoDB, JWT token stored');
        }
      } else {
        console.error('Error registering OAuth user:', data.message);
      }
    } catch (error) {
      console.error('Error registering user in MongoDB:', error);
    }
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
        showMessage(true, 'Login successful! Redirecting to products...');
        
        // Store token in both localStorage and cookie
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        Cookies.set('token', data.token, { expires: 7, path: '/' });
        
        // Trigger a storage event for other components to detect
        window.dispatchEvent(new Event('storage'));
        
        setTimeout(() => {
          router.push('/products');
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
        showMessage(true, 'Account created successfully! Redirecting to products...');
        
        // Store token in both localStorage and cookie
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        Cookies.set('token', data.token, { expires: 7, path: '/' });
        
        // Trigger a storage event for other components to detect
        window.dispatchEvent(new Event('storage'));
        
        setTimeout(() => {
          router.push('/products');
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

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {isLoading ? 'Signing in...' : 'Sign in with Google'}
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

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {isLoading ? 'Signing in...' : 'Sign up with Google'}
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

// Loading fallback
function LoginLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-8 mx-auto w-32"></div>
        <div className="h-64 bg-gray-200 rounded-lg mb-4 w-full"></div>
        <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
      </div>
    </div>
  );
}

// Main export - wrapped in Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
} 