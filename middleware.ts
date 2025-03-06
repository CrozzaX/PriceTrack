import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
    
    // Check for user data in localStorage (this won't work in middleware, but we'll check cookies)
    const hasSession = !!token;
    
    if (!hasSession) {
      // Redirect to login page with return URL
      const url = new URL('/login', request.url);
      url.searchParams.set('returnUrl', path);
      return NextResponse.redirect(url);
    }
    
    // Token exists, allow the request to proceed
    return NextResponse.next();
  }
  
  // For non-protected routes, proceed as normal
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
}; 