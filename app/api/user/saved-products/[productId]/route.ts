import { NextRequest, NextResponse } from 'next/server';
import { connectToAuthDB } from '@/lib/mongoose/auth';
import { verifyToken } from '@/lib/utils/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // Get product ID from route params - properly await params
    const { productId } = params;
    
    // Verify authentication
    const userId = await verifyToken(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the auth database
    const conn = await connectToAuthDB();
    const User = conn.model('User');
    
    // First check if the product exists in the user's saved products
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const isProductSaved = user.savedProducts.some(
      (item: any) => item.productId.toString() === productId
    );
    
    if (!isProductSaved) {
      // If product is not saved, return success instead of error
      return NextResponse.json({ 
        message: 'Product not found or already removed',
        alreadyRemoved: true
      });
    }
    
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