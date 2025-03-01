import { NextRequest, NextResponse } from 'next/server';
import { connectToAuthDB } from '@/lib/mongoose/auth';
import { verifyToken } from '@/lib/utils/auth';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyToken(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the auth database
    const conn = await connectToAuthDB();
    const User = conn.model('User');
    
    // Get user data (excluding password)
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error in profile GET route:', error);
    return NextResponse.json(
      { message: 'Server error fetching profile' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyToken(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the auth database
    const conn = await connectToAuthDB();
    const User = conn.model('User');
    
    // Parse request body
    const { name } = await req.json();
    
    // Validate name
    if (!name || name.length < 3) {
      return NextResponse.json(
        { message: 'Name must be at least 3 characters long' },
        { status: 400 }
      );
    }
    
    // Update user data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error in profile PUT route:', error);
    return NextResponse.json(
      { message: 'Server error updating profile' },
      { status: 500 }
    );
  }
} 