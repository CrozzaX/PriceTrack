'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProfileAvatarProps {
  user: {
    name: string;
    profileImage?: string;
  } | null;
}

export default function ProfileAvatar({ user }: ProfileAvatarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfileImage(data.profileImage);
        
        // Update user in localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          parsedUser.profileImage = data.profileImage;
          localStorage.setItem('user', JSON.stringify(parsedUser));
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const displayInitial = user?.name ? user.name.charAt(0).toUpperCase() : '';

  return (
    <div className="relative">
      {profileImage ? (
        <div className="h-24 w-24 rounded-full overflow-hidden">
          <Image 
            src={profileImage} 
            alt="Profile" 
            width={96} 
            height={96} 
            className="object-cover w-full h-full"
          />
        </div>
      ) : (
        <div className="h-24 w-24 rounded-full bg-[#FF7559] flex items-center justify-center text-white text-3xl font-bold">
          {displayInitial}
        </div>
      )}
      
      <label 
        htmlFor="profile-image" 
        className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
        <input 
          type="file" 
          id="profile-image" 
          className="hidden" 
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isUploading}
        />
      </label>
      
      {isUploading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
} 