import { NextRequest, NextResponse } from 'next/server';
import { connectToAuthDB } from '@/lib/mongoose/auth';
import { verifyToken } from '@/lib/utils/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // Get product ID from route params
    const { productId } = params;
    
    // Verify authentication
    const userId = await verifyToken(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the auth database
    const conn = await connectToAuthDB();
    const User = conn.model('User');
    
    // Update user document by removing the product
    const result = await User.updateOne(
      { _id: userId },
      { $pull: { savedProducts: { productId } } }
    );
    
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { message: 'Product not found or already removed' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Product removed successfully' });
  } catch (error) {
    console.error('Error in saved products DELETE route:', error);
    return NextResponse.json(
      { message: 'Server error removing product' },
      { status: 500 }
    );
  }
} 