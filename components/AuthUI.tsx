'use client';

import Link from 'next/link';

export default function AuthUI() {
  return (
    <div className="auth-buttons">
      <Link 
        href="/login"
        className="btn btn-outline"
      >
        Log In
      </Link>
      <Link 
        href="/login?signup=true"
        className="btn btn-primary"
      >
        Sign Up
      </Link>
    </div>
  );
} 