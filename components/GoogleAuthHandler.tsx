'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const GoogleAuthHandler = () => {
  const searchParams = useSearchParams();
  const isGoogleAuth = searchParams.get('auth') === 'google';
  
  useEffect(() => {
    const handleGoogleRedirect = async () => {
      if (!isGoogleAuth) return;
      
      try {
        // Check if we have a pending Google auth from sessionStorage
        const pendingAuth = sessionStorage.getItem('pendingGoogleAuth');
        
        if (pendingAuth === 'true') {
          console.log('Detected Google OAuth redirect, checking session...');
          
          // Get the current session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            console.log('Found valid session after Google redirect');
            
            // Get user details from session
            const { user } = session;
            
            // Create user data object
            const userData = {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
              profileImage: user.user_metadata?.avatar_url || user.user_metadata?.picture,
              provider: user.app_metadata?.provider,
              role: 'authenticated'
            };
            
            // Store session data
            localStorage.setItem('supabase.auth.token', session.access_token);
            localStorage.setItem('token', session.access_token);
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Clear the pending auth flag
            sessionStorage.removeItem('pendingGoogleAuth');
            
            // Dispatch multiple events to ensure components update
            window.dispatchEvent(new Event('storage'));
            
            // Create and dispatch a custom event for auth change
            const authEvent = new CustomEvent('authchange', { detail: { isAuthenticated: true } });
            window.dispatchEvent(authEvent);
            
            console.log('Auth state updated after Google redirect');
            
            // Force a page reload to ensure all components update
            setTimeout(() => {
              window.location.href = '/products';
            }, 100);
          }
        }
      } catch (error) {
        console.error('Error handling Google redirect:', error);
      }
    };
    
    handleGoogleRedirect();
  }, [isGoogleAuth]);
  
  // This component doesn't render anything
  return null;
};

export default GoogleAuthHandler; 