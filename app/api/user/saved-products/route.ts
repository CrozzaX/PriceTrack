import { NextRequest, NextResponse } from 'next/server';
import { connectToAuthDB } from '@/lib/mongoose/auth';
import { connectToDB } from '@/lib/mongoose';
import { verifyToken } from '@/lib/utils/auth';
import Product from '@/lib/models/product.model';

interface SavedProduct {
  productId: any; // Using 'any' for mongoose ObjectId
  source: string;
  dateAdded: Date;
}

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyToken(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the auth database
    const authConn = await connectToAuthDB();
    const User = authConn.model('User');
    
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // If user has no saved products, return empty array
    if (!user.savedProducts || user.savedProducts.length === 0) {
      return NextResponse.json({ products: [] });
    }
    
    // Connect to the products database
    await connectToDB();
    
    // Get product IDs from savedProducts
    const productIds = user.savedProducts.map((item: SavedProduct) => item.productId);
    
    // Fetch products
    const products = await Product.find({
      _id: { $in: productIds }
    });
    
    // Merge product details with savedProducts metadata
    const enhancedProducts = products.map(product => {
      const savedProductInfo = user.savedProducts.find(
        (item: SavedProduct) => item.productId.toString() === product._id.toString()
      );
      
      return {
        ...product.toObject(),
        savedInfo: {
          dateAdded: savedProductInfo.dateAdded,
          source: savedProductInfo.source
        }
      };
    });
    
    return NextResponse.json({ products: enhancedProducts });
  } catch (error) {
    console.error('Error in saved products GET route:', error);
    return NextResponse.json(
      { message: 'Server error fetching saved products' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const userId = await verifyToken(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the auth database
    const authConn = await connectToAuthDB();
    const User = authConn.model('User');
    
    // Parse request body
    const body = await req.json();
    const { productId, source = 'Other' } = body;
    
    if (!productId) {
      return NextResponse.json(
        { message: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Validate source value
    const validSources = ['Amazon', 'Flipkart', 'Myntra', 'ProductCard', 'Other'];
    if (!validSources.includes(source)) {
      return NextResponse.json(
        { message: 'Invalid source value' },
        { status: 400 }
      );
    }
    
    // Connect to the products database
    await connectToDB();
    
    // Verify product exists
    const product = await Product.findById(productId);
    
    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Check if product is already saved
    const isProductSaved = user.savedProducts.some(
      (item: SavedProduct) => item.productId.toString() === productId
    );
    
    if (isProductSaved) {
      return NextResponse.json(
        { message: 'Product already saved' },
        { status: 400 }
      );
    }
    
    // Add product to savedProducts
    const savedProduct = {
      productId,
      source,
      dateAdded: new Date()
    };
    
    user.savedProducts.push(savedProduct);
    
    await user.save();
    
    return NextResponse.json({ 
      message: 'Product saved successfully',
      savedProduct
    });
  } catch (error: any) {
    console.error('Error in saved products POST route:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { message: 'Invalid data provided', errors: error.errors },
        { status: 400 }
      );
    }
    
    // Handle mongoose cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return NextResponse.json(
        { message: 'Invalid product ID format' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Server error saving product' },
      { status: 500 }
    );
  }
} 