'use client';

import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  // Simplified to just return children without animations to prevent conflicts
  return (
    <div className="w-full">
      {children}
    </div>
  );
} 