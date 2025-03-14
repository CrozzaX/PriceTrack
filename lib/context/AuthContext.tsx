'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, getUserSubscription, User, Session } from '../supabase';

type SubscriptionStatus = 'free' | 'active' | 'expired' | 'canceled';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  subscription: any;
  subscriptionStatus: SubscriptionStatus;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      console.log('AuthContext - Checking session...');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('AuthContext - Session check result:', { hasSession: !!session });
        
        setSession(session);
        setUser(session?.user || null);
        setIsLoading(false);
        
        // Also check local storage for token
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        console.log('AuthContext - Local Storage Check:', { 
          hasToken: !!token, 
          hasUser: !!storedUser 
        });
      } catch (error) {
        console.error('AuthContext - Error checking session:', error);
        setIsLoading(false);
      }
    };
    
    checkSession();

    // Listen for auth changes
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext - Auth state changed:', { event, hasSession: !!session });
        setSession(session);
        setUser(session?.user || null);
        setIsLoading(false);
      }
    );

    return () => {
      authListener.unsubscribe();
    };
  }, []);

  // Fetch user subscription when user changes
  useEffect(() => {
    if (user) {
      console.log('AuthContext - User available, fetching subscription');
      fetchUserSubscription();
    } else {
      console.log('AuthContext - No user, setting subscription to null');
      setSubscription(null);
      setSubscriptionStatus('free');
    }
  }, [user]);

  const fetchUserSubscription = async () => {
    if (!user) return;
    
    try {
      console.log('AuthContext - Fetching subscription for user:', user.id);
      const subscriptionData = await getUserSubscription(user.id);
      console.log('AuthContext - Subscription data:', subscriptionData);
      
      setSubscription(subscriptionData);
      
      if (!subscriptionData) {
        setSubscriptionStatus('free');
      } else if (subscriptionData.status === 'active') {
        setSubscriptionStatus('active');
      } else {
        setSubscriptionStatus(subscriptionData.status);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscriptionStatus('free');
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    subscription,
    subscriptionStatus,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 