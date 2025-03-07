import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { connectToAuthDB } from '@/lib/mongoose/auth';

// Environment variable validation
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function verifyToken(req: NextRequest): Promise<string | null> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    
    // First try to verify as a regular JWT token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      return decoded.id;
    } catch (jwtError) {
      // If JWT verification fails, check if it's a JWT token from our OAuth registration
      try {
        // The token might be our own JWT token from register-oauth
        if (token.split('.').length === 3) { // Simple check for JWT format
          try {
            const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
            return decoded.id;
          } catch (error) {
            // Not our JWT token, continue to Supabase check
          }
        }
        
        // Try to verify as a Supabase token
        try {
          const { data, error } = await supabase.auth.getUser(token);
          
          if (error) {
            // If token is expired, try to find user by token in our database
            if (error.message.includes('expired') || error.message.includes('invalid')) {
              return await getUserIdByToken(token);
            }
            
            console.error('Supabase token verification failed:', error);
            return null;
          }
          
          if (!data.user) {
            console.error('No user found in Supabase data');
            return null;
          }
          
          // Get user email from Supabase
          const email = data.user.email;
          if (!email) {
            console.error('No email found in Supabase user data');
            return null;
          }
          
          // Find user in MongoDB by email
          const userId = await getUserIdByEmail(email);
          return userId;
        } catch (supabaseError) {
          // If Supabase verification fails, try to find user by token in our database
          return await getUserIdByToken(token);
        }
      } catch (supabaseError) {
        console.error('Error verifying Supabase token:', supabaseError);
        return null;
      }
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// Helper function to get user ID from MongoDB by email
async function getUserIdByEmail(email: string): Promise<string | null> {
  try {
    const conn = await connectToAuthDB();
    const User = conn.model('User');
    
    const user = await User.findOne({ email });
    if (!user) {
      console.error('User not found with email:', email);
      return null;
    }
    
    return user._id.toString();
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

// Helper function to get user ID from MongoDB by token
async function getUserIdByToken(token: string): Promise<string | null> {
  try {
    const conn = await connectToAuthDB();
    const User = conn.model('User');
    
    // Find user by stored token (this assumes you store tokens with users)
    // You might need to adjust this query based on your actual data model
    const user = await User.findOne({ 'tokens.token': token });
    if (!user) {
      // If no user found with this token, try to decode it to get email
      try {
        // This is a simple JWT decode (not verify) to extract payload
        const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (decoded.email) {
          return await getUserIdByEmail(decoded.email);
        }
      } catch (decodeError) {
        console.error('Error decoding token:', decodeError);
      }
      
      console.error('User not found with token');
      return null;
    }
    
    return user._id.toString();
  } catch (error) {
    console.error('Error finding user by token:', error);
    return null;
  }
} 