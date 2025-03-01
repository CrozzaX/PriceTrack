'use client';

import { useState, useEffect, useRef } from 'react';
import ProfileForm from '@/components/dashboard/ProfileForm';
import ProfileAvatar from '@/components/dashboard/ProfileAvatar';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Only run this effect once
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    
    // First try to get user data from localStorage for immediate display
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }

    // Then fetch the latest data from the API
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const response = await fetch('/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          signal: controller.signal,
          cache: 'no-store' // Ensure we get fresh data
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          // Update localStorage with latest user data
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Profile fetch request timed out');
        } else {
          console.error('Error fetching user profile:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []); // Empty dependency array to run only once

  // If we have user data, show it immediately
  if (user) {
    return (
      <>
        <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
        
        <div className="mb-8 flex flex-col sm:flex-row items-center gap-6">
          <ProfileAvatar user={user} />
          <div>
            <h2 className="text-xl font-semibold">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>
        
        <ProfileForm user={user} />
      </>
    );
  }
  
  // Otherwise show loading spinner
  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      
      {isLoading && (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7559]"></div>
        </div>
      )}
    </>
  );
} 