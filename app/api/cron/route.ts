import { NextResponse } from "next/server";

import { getLowestPrice, getHighestPrice, getAveragePrice, getEmailNotifType } from "@/lib/utils";
import { connectToDB } from "@/lib/mongoose";
import Product from "@/lib/models/product.model";
import { scrapeAmazonProduct } from "@/lib/scraper";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";

export const maxDuration = 60; // Updated from 300 to a valid duration for Vercel Hobby plan
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    connectToDB();

    const products = await Product.find({});

    if (!products || products.length === 0) {
      return NextResponse.json({
        message: "No products found to update",
        data: []
      });
    }

    // ======================== 1 SCRAPE LATEST PRODUCT DETAILS & UPDATE DB
    const updatedProducts = await Promise.all(
      products.map(async (currentProduct) => {
        try {
          // Scrape product
          const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);

          // Skip processing if scraping failed
          if (!scrapedProduct) {
            console.log(`Scraping failed for product: ${currentProduct.title}`);
            return currentProduct; // Return original product without updates
          }

          // Ensure currentProduct has a valid priceHistory array
          const currentPriceHistory = Array.isArray(currentProduct.priceHistory) 
            ? currentProduct.priceHistory 
            : [];

          // Create a valid price history item
          const newPriceHistoryItem = {
            price: scrapedProduct.currentPrice,
            date: new Date()
          };

          // Only add the new price if it's a valid number
          const updatedPriceHistory = typeof scrapedProduct.currentPrice === 'number'
            ? [...currentPriceHistory, newPriceHistoryItem]
            : currentPriceHistory;

          // Create updated product with price calculations
          const product = {
            ...scrapedProduct,
            priceHistory: updatedPriceHistory,
            lowestPrice: getLowestPrice(updatedPriceHistory),
            highestPrice: getHighestPrice(updatedPriceHistory),
            averagePrice: getAveragePrice(updatedPriceHistory),
          };

          // Update Products in DB
          const updatedProduct = await Product.findOneAndUpdate(
            {
              url: product.url,
            },
            product,
            { new: true } // Return the updated document
          );

          if (!updatedProduct) {
            console.log(`Product not found in database: ${product.url}`);
            return currentProduct; // Return original if update failed
          }

          // ======================== 2 CHECK EACH PRODUCT'S STATUS & SEND EMAIL ACCORDINGLY
          const emailNotifType = getEmailNotifType(
            scrapedProduct,
            currentProduct
          );

          if (emailNotifType && updatedProduct.users && updatedProduct.users.length > 0) {
            const productInfo = {
              title: updatedProduct.title || "Product",
              url: updatedProduct.url,
              image: updatedProduct.image,
              currency: updatedProduct.currency || "₹",
              currentPrice: updatedProduct.currentPrice,
              originalPrice: updatedProduct.originalPrice,
              discountRate: updatedProduct.discountRate || 0,
              isOutOfStock: updatedProduct.isOutOfStock || false
            };
            
            // Construct emailContent
            const emailContent = await generateEmailBody(productInfo, emailNotifType);
            
            // Get array of user emails, ensuring users exists
            const userEmails = updatedProduct.users.map((user: any) => user.email);
            
            if (userEmails.length > 0) {
              // Send email notification with better error handling
              try {
                const emailResult = await sendEmail(emailContent, userEmails);
                
                if (emailResult.success) {
                  console.log(`Price alert email sent to ${userEmails.length} users for ${updatedProduct.title}`);
                } else {
                  console.warn(`Failed to send price alert email: ${emailResult.error}`);
                }
              } catch (emailError) {
                console.error(`Error in email sending process for product ${updatedProduct.title}:`, emailError);
                // Continue with product updates even if email fails
              }
            }
          }

          return updatedProduct;
        } catch (error) {
          console.error(`Error processing product ${currentProduct.title || currentProduct.url}:`, error);
          return currentProduct; // Return original product in case of error
        }
      })
    );

    // Filter out null/undefined entries
    const validUpdatedProducts = updatedProducts.filter(product => product);

    return NextResponse.json({
      message: "Products updated successfully",
      data: validUpdatedProducts,
    });
  } catch (error: any) {
    console.error("Cron job error:", error);
    
    return NextResponse.json({
      message: `Failed to update products: ${error.message}`,
      error: error.message
    }, { status: 500 });
  }
}
