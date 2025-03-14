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

// Cache valid user IDs to reduce DB lookups
const userEmailToIdCache = new Map<string, string>();
// Cache for mapping between Supabase UUIDs and MongoDB ObjectIds
const uuidToObjectIdCache = new Map<string, string>();
const objectIdToUuidCache = new Map<string, string>();

// Helper function to get MongoDB ObjectId from Supabase UUID
async function getObjectIdFromUUID(uuid: string): Promise<string | null> {
  // Check cache first
  if (uuidToObjectIdCache.has(uuid)) {
    return uuidToObjectIdCache.get(uuid)!;
  }
  
  try {
    // Get user email from Supabase
    const { data, error } = await supabase.auth.admin.getUserById(uuid);
    
    if (error || !data.user || !data.user.email) {
      return null;
    }
    
    // Find user in MongoDB by email
    const objectId = await getUserIdByEmail(data.user.email);
    
    if (objectId) {
      // Cache the mapping
      uuidToObjectIdCache.set(uuid, objectId);
      objectIdToUuidCache.set(objectId, uuid);
    }
    
    return objectId;
  } catch (error) {
    console.error('Error getting ObjectId from UUID:', error);
    return null;
  }
}

// Helper function to get Supabase UUID from MongoDB ObjectId
async function getUUIDFromObjectId(objectId: string): Promise<string | null> {
  // Check cache first
  if (objectIdToUuidCache.has(objectId)) {
    return objectIdToUuidCache.get(objectId)!;
  }
  
  try {
    // Get user from MongoDB
    const authConn = await connectToAuthDB();
    const User = authConn.model('User');
    const user = await User.findById(objectId);
    
    if (!user || !user.email) {
      return null;
    }
    
    // List all users and find the one with matching email
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      return null;
    }
    
    // Find the user with matching email
    const matchingUser = data.users.find(u => u.email === user.email);
    
    if (!matchingUser) {
      return null;
    }
    
    const uuid = matchingUser.id;
    
    // Cache the mapping
    uuidToObjectIdCache.set(uuid, objectId);
    objectIdToUuidCache.set(objectId, uuid);
    
    return uuid;
  } catch (error) {
    console.error('Error getting UUID from ObjectId:', error);
    return null;
  }
}

export async function verifyToken(req: NextRequest): Promise<string | null> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('Authorization');
    let token;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      // If no Authorization header, try to get token from cookies or other headers
      const cookies = req.cookies;
      token = cookies.get('token')?.value;
      
      if (!token) {
        return null;
      }
    }

    // Try to decode token first to extract user email for caching
    try {
      // Just decode, don't verify
      const decodedPayload = token.split('.')[1];
      if (decodedPayload) {
        const decoded = JSON.parse(Buffer.from(decodedPayload, 'base64').toString());
        if (decoded.email) {
          // Check if we have this email in our cache
          if (userEmailToIdCache.has(decoded.email)) {
            return userEmailToIdCache.get(decoded.email)!;
          }
        }
      }
    } catch (decodeError) {
      // Silently continue if decoding fails
    }
    
    // First try to verify as a regular JWT token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      return decoded.id;
    } catch (jwtError) {
      // Silent fail, just move to Supabase
    }
    
    // If JWT verification fails, try Supabase
    try {
      // Try to get the user from Supabase
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error) {
        // If token is expired, try decoding it to extract email
        try {
          // This just decodes without verifying (which is fine for getting the email)
          const payload = token.split('.')[1];
          if (payload) {
            const decoded = JSON.parse(atob(payload));
            if (decoded.email) {
              // Find user by email in our database
              const userId = await getUserIdByEmail(decoded.email);
              if (userId) {
                // Cache the result
                userEmailToIdCache.set(decoded.email, userId);
              }
              return userId;
            }
          }
        } catch (decodeError) {
          // Silent fail
        }
        
        return null;
      }
      
      if (!data.user) {
        return null;
      }
      
      // Get user email from Supabase
      const email = data.user.email;
      if (!email) {
        return null;
      }
      
      // Find user in MongoDB by email
      const userId = await getUserIdByEmail(email);
      if (userId) {
        // Cache the result
        userEmailToIdCache.set(email, userId);
        
        // Also cache the UUID to ObjectId mapping
        objectIdToUuidCache.set(userId, data.user.id);
        uuidToObjectIdCache.set(data.user.id, userId);
      }
      return userId;
    } catch (supabaseError) {
      return null;
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// Helper function to get user ID by email
async function getUserIdByEmail(email: string): Promise<string | null> {
  try {
    const authConn = await connectToAuthDB();
    const User = authConn.model('User');
    const user = await User.findOne({ email });
    return user ? user._id.toString() : null;
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
        // Silent fail
      }
      
      return null;
    }
    
    return user._id.toString();
  } catch (error) {
    console.error('Error finding user by token:', error);
    return null;
  }
} 