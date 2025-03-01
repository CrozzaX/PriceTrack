'use client';

import { useState, useEffect } from 'react';
import ProfileForm from '@/components/dashboard/ProfileForm';
import ProfileAvatar from '@/components/dashboard/ProfileAvatar';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          // Update localStorage with latest user data
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      
      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7559]"></div>
        </div>
      ) : (
        <>
          <div className="mb-8 flex flex-col sm:flex-row items-center gap-6">
            <ProfileAvatar user={user} />
            <div>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>
          
          <ProfileForm user={user} />
        </>
      )}
    </>
  );
} 