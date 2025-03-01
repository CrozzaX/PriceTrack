import { NextRequest, NextResponse } from 'next/server';
import { connectToAuthDB } from '@/lib/mongoose/auth';
import { verifyToken } from '@/lib/utils/auth';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyToken(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data (you'll need to implement this part)
    // For the sake of this example, we'll assume the image is sent as base64 string
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json(
        { message: 'No image file provided' },
        { status: 400 }
      );
    }
    
    // Convert to base64 for storage in MongoDB
    // In a production environment, consider using a cloud storage solution
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${imageFile.type};base64,${buffer.toString('base64')}`;
    
    // Connect to the auth database
    const conn = await connectToAuthDB();
    const User = conn.model('User');
    
    // Update user's profile image
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: base64Image },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'Profile image updated successfully',
      profileImage: base64Image
    });
  } catch (error) {
    console.error('Error in profile image update route:', error);
    return NextResponse.json(
      { message: 'Server error updating profile image' },
      { status: 500 }
    );
  }
} 