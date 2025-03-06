import { NextRequest, NextResponse } from 'next/server';
import { connectToAuthDB } from '@/lib/mongoose/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Environment variable validation
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}

// Define MongoDB error interface
interface MongoError extends Error {
  code?: number;
  keyPattern?: { [key: string]: number };
  keyValue?: { [key: string]: any };
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const { name, email, provider, profileImage } = await req.json();
    
    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Connect to the auth database
    const conn = await connectToAuthDB();
    const User = conn.model('User');
    
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      
      if (existingUser) {
        // User already exists, update their provider info if needed
        if (!existingUser.provider) {
          existingUser.provider = provider;
          await existingUser.save();
        }
        
        // Generate token
        const token = jwt.sign(
          { id: existingUser._id },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        return NextResponse.json({
          message: 'User already exists',
          token,
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            profileImage: existingUser.profileImage || profileImage
          }
        });
      }
      
      // Create a random password for OAuth users
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      // Create new user
      const newUser = new User({
        name: name || email.split('@')[0],
        email,
        password: hashedPassword,
        provider,
        profileImage
      });
      
      await newUser.save();
      
      // Generate token
      const token = jwt.sign(
        { id: newUser._id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return NextResponse.json({
        message: 'User registered successfully',
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          profileImage: newUser.profileImage
        }
      });
    } catch (error) {
      // Handle duplicate key error specifically
      const mongoError = error as MongoError;
      if (mongoError.code === 11000 && mongoError.keyPattern?.email) {
        // Try to find the user again (in case of race condition)
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
          // Generate token for existing user
          const token = jwt.sign(
            { id: existingUser._id },
            JWT_SECRET,
            { expiresIn: '7d' }
          );
          
          return NextResponse.json({
            message: 'User already exists',
            token,
            user: {
              id: existingUser._id,
              name: existingUser.name,
              email: existingUser.email,
              profileImage: existingUser.profileImage || profileImage
            }
          });
        }
      }
      
      // Re-throw for general error handling
      throw error;
    }
  } catch (error) {
    console.error('Error in register-oauth route:', error);
    return NextResponse.json(
      { message: 'Server error during registration' },
      { status: 500 }
    );
  }
} 