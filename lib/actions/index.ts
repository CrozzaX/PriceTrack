"use server"

import { revalidatePath } from "next/cache";
import Product from "../models/product.model";
import { connectToDB } from "../mongoose";
import { scrapeAmazonProduct, scrapeFlipkartProduct, scrapeMyntraProduct } from "../scraper";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";
import { Product as ProductType } from "@/types";
import mongoose from 'mongoose';

// Helper function to safely serialize MongoDB documents
const serializeMongoDocument = (doc: any): any => {
  const serialized = JSON.parse(JSON.stringify(doc));
  
  // Handle _id field
  if (serialized._id) {
    serialized._id = serialized._id.toString();
  }
  
  // Handle nested dates and ObjectIds in priceHistory
  if (Array.isArray(serialized.priceHistory)) {
    serialized.priceHistory = serialized.priceHistory.map((item: any) => ({
      ...item,
      _id: item._id?.toString(),
      date: item.date ? new Date(item.date).toISOString() : null
    }));
  }
  
  // Handle users array if it exists
  if (Array.isArray(serialized.users)) {
    serialized.users = serialized.users.map((user: any) => ({
      ...user,
      _id: user._id?.toString()
    })); 
  }
  
  return serialized;
};

// Helper function to determine the e-commerce platform
const getProductPlatform = (url: string): 'amazon' | 'flipkart' | 'myntra' | 'unknown' => {
  if (url.includes('amazon')) return 'amazon';
  if (url.includes('flipkart')) return 'flipkart';
  if (url.includes('myntra')) return 'myntra';
  return 'unknown';
};

export async function getProductById(productId: string) {
  try {
    connectToDB();

    // Validate productId as a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log("Invalid productId:", productId);
      return null;
    }

    const product = await Product.findOne({ _id: productId });
    
    if (!product) return null;

    // Serialize the document before returning
    return serializeMongoDocument(product.toObject());
  } catch (error) {
    console.log('Error in getProductById:', error);
    throw new Error('Failed to get product');
  }
}

export async function getAllProducts() {
  try {
    connectToDB();
    
    // Sort by createdAt in descending order (-1) to get newest first
    const products = await Product.find().sort({ createdAt: -1 });
    
    return products.map(product => serializeMongoDocument(product.toObject()));
  } catch (error) {
    console.log(error);
    throw new Error('Failed to get products');
  }
}

export async function getSimilarProducts(productId: string) {
  try {
    connectToDB();

    const currentProduct = await Product.findById(productId);
    if (!currentProduct) return null;

    const similarProducts = await Product.find({
      _id: { $ne: productId },
    }).limit(3);

    // Serialize all documents
    return similarProducts.map(product => serializeMongoDocument(product.toObject()));
  } catch (error) {
    console.log('Error in getSimilarProducts:', error);
    throw new Error('Failed to get similar products');
  }
}

export async function scrapeAndStoreProduct(productUrl: string) {
  if (!productUrl) return;

  try {
    connectToDB();

    const platform = getProductPlatform(productUrl);
    let scrapedProduct;

    switch (platform) {
      case 'amazon':
        scrapedProduct = await scrapeAmazonProduct(productUrl);
        break;
      case 'flipkart':
        scrapedProduct = await scrapeFlipkartProduct(productUrl);
        break;
      case 'myntra':
        scrapedProduct = await scrapeMyntraProduct(productUrl);
        break;
      default:
        throw new Error('Unsupported e-commerce platform');
    }

    if (!scrapedProduct) return;

    let product = await Product.findOne({ url: productUrl });

    if (product) {
      const updatedPriceHistory = [
        ...product.priceHistory,
        { price: scrapedProduct.currentPrice }
      ];

      product.priceHistory = updatedPriceHistory;
      product.currentPrice = scrapedProduct.currentPrice;
      product.discountRate = scrapedProduct.discountRate;
      product.isOutOfStock = scrapedProduct.isOutOfStock;

      const lowestPrice = getLowestPrice(updatedPriceHistory);
      const highestPrice = getHighestPrice(updatedPriceHistory);
      const averagePrice = getAveragePrice(updatedPriceHistory);

      product.lowestPrice = lowestPrice;
      product.highestPrice = highestPrice;
      product.averagePrice = averagePrice;

      await product.save();
    } else {
      product = await Product.create({
        ...scrapedProduct,
        priceHistory: [{ price: scrapedProduct.currentPrice }]
      });
    }

    revalidatePath(`/products/${product._id}`);
    return serializeMongoDocument(product.toObject());

  } catch (error: any) {
    console.log(`Error in scrapeAndStoreProduct: ${error.message}`);
    throw new Error(`Failed to create/update product: ${error.message}`);
  }
}

export async function addUserEmailToProduct(productId: string, userEmail: string) {
  try {
    console.log(`Starting to add email ${userEmail} to product ${productId}...`);
    connectToDB();
    
    const product = await Product.findById(productId);

    if (!product) {
      console.error(`Product not found with ID: ${productId}`);
      return {
        success: false,
        message: 'Product not found',
        isAlreadyTracking: false,
        product: null
      };
    }

    console.log(`Found product: ${product.title}`);
    const userExists = product.users.some((user: any) => user.email === userEmail);
    
    let emailSent = false;
    let emailError = null;

    if (!userExists) {
      // Add user email to product
      console.log(`Adding ${userEmail} to product users list...`);
      product.users.push({ email: userEmail });
      await product.save();
      console.log(`User saved to product successfully.`);
      
      // Send welcome email - with better handling
      console.log(`Preparing to send welcome email...`);
      
      try {
        // Import email functions
        const { generateEmailBody, sendEmail } = await import('@/lib/nodemailer');
        
        console.log(`Generating email content for ${product.title}...`);
        // Create email content with extended product info
        const emailContent = await generateEmailBody(
          {
            title: product.title,
            url: product.url,
            image: product.image,
            currency: product.currency,
            currentPrice: product.currentPrice,
            originalPrice: product.originalPrice || product.currentPrice,
            discountRate: product.discountRate || 0,
            isOutOfStock: product.isOutOfStock || false
          },
          'WELCOME'
        );
        
        console.log(`Sending welcome email to ${userEmail}...`);
        // Send the welcome email
        const emailResult = await sendEmail(emailContent, [userEmail]);
        
        if (emailResult.success) {
          console.log(`Welcome email sent successfully to ${userEmail} for product ${product.title}`);
          emailSent = true;
        } else {
          console.warn(`Welcome email failed to send: ${emailResult.error}`);
          emailError = emailResult.error;
          // We continue processing even if email fails
        }
      } catch (emailError) {
        console.error('Error in email sending process:', emailError);
        // Don't throw here, we still want to return the product even if email fails
      }
    } else {
      console.log(`User ${userEmail} is already tracking this product.`);
    }

    revalidatePath(`/products/${productId}`);
    return {
      success: true,
      message: userExists ? 'Already tracking this product' : 'Product tracking enabled',
      isAlreadyTracking: userExists,
      emailSent,
      emailError,
      product: serializeMongoDocument(product.toObject())
    };
  } catch (error) {
    console.log('Error in addUserEmailToProduct:', error);
    return {
      success: false,
      message: 'Failed to add user email to product',
      isAlreadyTracking: false,
      emailSent: false,
      error
    };
  }
}