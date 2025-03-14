import { NextRequest, NextResponse } from 'next/server';
import { withSubscription } from './middleware/subscription';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Environment variable validation
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}

// Define routes that require specific subscription plans
const PREMIUM_ROUTES = [
  '/premium-features',
  '/advanced-analytics'
];

const BUSINESS_ROUTES = [
  '/business-features',
  '/api-access'
];

// Define routes that require any subscription
const SUBSCRIPTION_REQUIRED_ROUTES = [
  '/dashboard/saved-products',
  '/dashboard/alerts'
];

export async function middleware(req: NextRequest) {
  // Create a response object that we'll use later
  const res = NextResponse.next();
  
  // Create a Supabase client specifically for this middleware
  const supabase = createMiddlewareClient({ req, res });
  
  try {
    console.log(`Middleware processing request for: ${req.nextUrl.pathname}`);
    
    // Check if user is authenticated via Supabase
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log(`Session check result: ${session ? 'Session found' : 'No session found'}`);
    
    // Check for token in cookies as a fallback
    const tokenCookie = req.cookies.get('token')?.value;
    console.log(`Token cookie check: ${tokenCookie ? 'Token found in cookie' : 'No token in cookie'}`);
    
    // Check for authorization header as another fallback
    const authHeader = req.headers.get('authorization');
    console.log(`Auth header check: ${authHeader ? 'Auth header found' : 'No auth header'}`);
    
    // Determine if the user is authenticated through any method
    const isAuthenticated = !!session || !!tokenCookie || !!authHeader;
    console.log(`Authentication status: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
    
    // Get the pathname from the URL
    const path = req.nextUrl.pathname;

    // Define protected routes and their required access levels
    const protectedRoutes: Record<string, string> = {
      '/admin': 'admin',
      '/admin/subscriptions': 'admin',
      '/admin/plans': 'admin',
      '/admin/transactions': 'admin',
      '/premium-features': 'premium',
      '/business-features': 'business',
      '/dashboard': 'authenticated'
    };

    // Check if the current path is protected
    const matchedRoute = Object.keys(protectedRoutes).find(route => 
      path === route || path.startsWith(`${route}/`)
    );

    if (matchedRoute) {
      console.log(`Matched protected route: ${matchedRoute}, required access: ${protectedRoutes[matchedRoute]}`);
      
      // If not authenticated through any method, redirect to login
      if (!isAuthenticated) {
        console.log(`Not authenticated, redirecting to login from ${path}`);
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('redirectTo', path);
        return NextResponse.redirect(redirectUrl);
      }

      // If we have a session, check user claims
      if (session) {
        // Get user claims which include role and subscription
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log(`No user found in session, redirecting to login from ${path}`);
          const redirectUrl = new URL('/login', req.url);
          redirectUrl.searchParams.set('redirectTo', path);
          return NextResponse.redirect(redirectUrl);
        }
        
        console.log(`User found: ${user.id}, checking permissions`);
        
        const userRole = user?.user_metadata?.role || 'user';
        const userSubscription = user?.user_metadata?.subscription_tier || 'free';
        
        console.log(`User role: ${userRole}, subscription: ${userSubscription}`);

        // Check if user has required access
        const requiredAccess = protectedRoutes[matchedRoute];
        
        if (requiredAccess === 'admin' && userRole !== 'admin') {
          // Redirect non-admin users trying to access admin routes
          console.log(`Access denied: User is not an admin`);
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
        
        if (requiredAccess === 'premium' && !['premium', 'business', 'admin'].includes(userSubscription)) {
          // Redirect non-premium users trying to access premium features
          console.log(`Access denied: User does not have premium subscription`);
          return NextResponse.redirect(new URL('/subscription', req.url));
        }
        
        if (requiredAccess === 'business' && !['business', 'admin'].includes(userSubscription)) {
          // Redirect non-business users trying to access business features
          console.log(`Access denied: User does not have business subscription`);
          return NextResponse.redirect(new URL('/subscription', req.url));
        }
      }
      
      console.log(`Access granted for ${path}`);
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // If there's an error, we'll just continue to the page
    // The client-side auth checks will handle redirects if needed
    return res;
  }
}

// Define which paths this middleware should run on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/premium-features/:path*',
    '/business-features/:path*',
  ],
}; 