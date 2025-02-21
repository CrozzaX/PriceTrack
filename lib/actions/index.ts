"use server"

import { revalidatePath } from "next/cache";
import Product from "../models/product.model";
import { connectToDB } from "../mongoose";
import { scrapeAmazonProduct, scrapeFlipkartProduct, scrapeMyntraProduct } from "../scraper";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";
import { Product as ProductType } from "@/types";

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
    connectToDB();
    
    const product = await Product.findById(productId);

    if (!product) return;

    const userExists = product.users.some((user: any) => user.email === userEmail);

    if (!userExists) {
      product.users.push({ email: userEmail });
      await product.save();
    }

    revalidatePath(`/products/${productId}`);
    return serializeMongoDocument(product.toObject());
  } catch (error) {
    console.log('Error in addUserEmailToProduct:', error);
    throw new Error('Failed to add user email to product');
  }
}