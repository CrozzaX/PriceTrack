import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(new URL('/login?error=auth', requestUrl.origin));
      }
      
      // Get the redirectTo parameter or default to /products
      const redirectTo = requestUrl.searchParams.get('redirectTo') || '/products';
      
      // Create a response that redirects to the products page
      const response = NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
      
      // Set cookies for the client
      if (data.session) {
        // Set a cookie with the access token
        response.cookies.set('token', data.session.access_token, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 1 week
          httpOnly: false, // Allow JavaScript access
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
      }
      
      // Add a script to store user data in localStorage
      if (data.user) {
        // Create HTML with a script to set localStorage
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta http-equiv="refresh" content="0;url=${redirectTo}">
              <script>
                // Store token in localStorage
                localStorage.setItem('token', '${data.session?.access_token || ''}');
                
                // Process profile image URL
                let profileImage = ${JSON.stringify(data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || '')};
                
                // If it's a Google image URL, use our proxy
                if (profileImage && (
                  profileImage.includes('googleusercontent.com') || 
                  profileImage.includes('googleapis.com')
                )) {
                  // Encode the URL and pass it through our proxy
                  const encodedUrl = encodeURIComponent(profileImage);
                  profileImage = \`/api/user/image-proxy?url=\${encodedUrl}\`;
                }
                
                // Create user data object
                const userData = {
                  id: '${data.user.id}',
                  email: ${JSON.stringify(data.user.email || '')},
                  name: ${JSON.stringify(data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email || '')},
                  avatar_url: profileImage,
                  profileImage: profileImage,
                  provider: ${JSON.stringify(data.user.app_metadata?.provider || '')},
                  role: 'authenticated'
                };
                
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Trigger storage event for other components
                window.dispatchEvent(new Event('storage'));
                
                // Force multiple refreshes of the navbar by dispatching events at intervals
                setTimeout(() => {
                  window.dispatchEvent(new Event('storage'));
                }, 100);
                
                setTimeout(() => {
                  window.dispatchEvent(new Event('storage'));
                }, 500);
                
                setTimeout(() => {
                  window.dispatchEvent(new Event('storage'));
                }, 1000);
                
                // Register user in MongoDB if they don't exist yet
                if (userData.provider === 'google') {
                  fetch('/api/auth/register-oauth', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      name: userData.name,
                      email: userData.email,
                      provider: userData.provider,
                      profileImage: userData.profileImage || userData.avatar_url
                    }),
                  })
                  .then(response => response.json())
                  .then(data => {
                    if (data.token) {
                      localStorage.setItem('jwt_token', data.token);
                      document.cookie = \`jwt_token=\${data.token}; path=/; max-age=\${60 * 60 * 24 * 7}\`;
                    }
                  })
                  .catch(error => {
                    console.error('Error registering OAuth user:', error);
                  });
                }
                
                // Redirect to the intended destination
                window.location.href = '${redirectTo}';
              </script>
            </head>
            <body>
              <p>Redirecting to dashboard...</p>
            </body>
          </html>
        `;
        
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }
      
      return response;
    } catch (error) {
      console.error('Error in callback route:', error);
      return NextResponse.redirect(new URL('/login?error=server', requestUrl.origin));
    }
  }
  
  // If there's no code, redirect to the login page
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
} 