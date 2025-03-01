import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// Environment variable validation
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}

export async function middleware(request: NextRequest) {
  // Get the path of the request
  const path = request.nextUrl.pathname;
  
  // Define protected routes
  const isProtectedRoute = path === '/dashboard' || path.startsWith('/dashboard/');
  
  if (isProtectedRoute) {
    // Get token from cookies or authorization header
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      // Redirect to login page with return URL
      const url = new URL('/login', request.url);
      url.searchParams.set('returnUrl', path);
      return NextResponse.redirect(url);
    }
    
    try {
      // Verify token
      const encoder = new TextEncoder();
      const secretKey = encoder.encode(JWT_SECRET);
      
      await jose.jwtVerify(token, secretKey);
      
      // Token is valid, allow the request to proceed
      return NextResponse.next();
    } catch (error) {
      console.error('Token verification error:', error);
      // Token is invalid, redirect to login with return URL
      const url = new URL('/login', request.url);
      url.searchParams.set('returnUrl', path);
      return NextResponse.redirect(url);
    }
  }
  
  // For non-protected routes, proceed as normal
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
}; 