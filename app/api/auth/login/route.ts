import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToAuthDB } from '@/lib/mongoose/auth';

// Environment variable validation
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}

export async function POST(req: NextRequest) {
  try {
    // Connect to the auth database
    const conn = await connectToAuthDB();
    const User = conn.model('User');
    
    // Parse the request body
    const { email, password } = await req.json();
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password.' },
        { status: 400 }
      );
    }
    
    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json(
        { message: 'Invalid email or password.' },
        { status: 400 }
      );
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: '1d'
    });
    
    // Return token and user data
    return NextResponse.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error in login route:', error);
    return NextResponse.json(
      { message: 'Server error during login.' },
      { status: 500 }
    );
  }
} 