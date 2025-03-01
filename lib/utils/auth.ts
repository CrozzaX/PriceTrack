import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Environment variable validation
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}

export async function verifyToken(req: NextRequest): Promise<string | null> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    return decoded.id;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
} 