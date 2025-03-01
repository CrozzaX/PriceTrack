import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToAuthDB } from '@/lib/mongoose/auth';
import { verifyToken } from '@/lib/utils/auth';

export async function POST(req: NextRequest) {
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
    const { currentPassword, newPassword } = await req.json();
    
    // Validate passwords
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Both current and new password are required' },
        { status: 400 }
      );
    }
    
    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 400 }
      );
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error in password update route:', error);
    return NextResponse.json(
      { message: 'Server error updating password' },
      { status: 500 }
    );
  }
} 