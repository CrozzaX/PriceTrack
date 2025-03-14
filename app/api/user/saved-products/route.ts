import { NextRequest, NextResponse } from 'next/server';
import { connectToAuthDB } from '@/lib/mongoose/auth';
import { connectToDB } from '@/lib/mongoose';
import { verifyToken } from '@/lib/utils/auth';
import Product from '@/lib/models/product.model';
import { hasReachedProductLimit } from '@/middleware/subscription';
import { supabase } from '@/lib/supabase';

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

    // Check subscription limits
    const { hasReached, currentCount, maxAllowed, subscription } = await hasReachedProductLimit(userId);
    
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
    const validSources = ['Amazon', 'Flipkart', 'Myntra', 'ProductCard', 'ProductDetail', 'Other'];
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
      // If product is already saved, return success instead of error
      return NextResponse.json({ 
        message: 'Product already saved',
        alreadySaved: true,
        savedProduct: user.savedProducts.find(
          (item: SavedProduct) => item.productId.toString() === productId
        )
      });
    }
    
    // Check if user has reached their product limit
    if (hasReached) {
      const planName = subscription?.subscription_plans?.name || 'Free';
      return NextResponse.json({ 
        message: `You've reached the maximum limit of ${maxAllowed} products for your ${planName} plan. Please upgrade to track more products.`,
        limitReached: true,
        currentCount,
        maxAllowed,
        subscription: subscription ? {
          name: subscription.subscription_plans.name,
          price: subscription.subscription_plans.price,
          features: subscription.subscription_plans.features
        } : null
      }, { status: 403 });
    }
    
    // Add product to savedProducts
    const savedProduct = {
      productId,
      source,
      dateAdded: new Date()
    };
    
    user.savedProducts.push(savedProduct);
    
    await user.save();
    
    // Update the saved products count in Supabase user metadata
    try {
      // Correctly query the auth.users table in the auth schema
      const { data: authUser, error: authError } = await supabase
        .from('auth.users')
        .select('metadata')
        .eq('id', userId)
        .single();
      
      if (authError) {
        console.error('Error fetching user metadata:', authError);
        
        // Try alternative approach using auth admin API
        try {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
          
          if (!userError && userData?.user) {
            const metadata = userData.user.user_metadata || {};
            metadata.saved_products_count = (user.savedProducts || []).length;
            
            await supabase.auth.admin.updateUserById(userId, {
              user_metadata: metadata
            });
          } else {
            console.error('Error fetching user with admin API:', userError);
          }
        } catch (adminError) {
          console.error('Error using admin API:', adminError);
        }
      } else if (authUser) {
        const metadata = authUser.metadata || {};
        metadata.saved_products_count = (user.savedProducts || []).length;
        
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: metadata
        });
      }
    } catch (metadataError) {
      console.error('Error updating user metadata:', metadataError);
      // Continue even if metadata update fails
    }
    
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