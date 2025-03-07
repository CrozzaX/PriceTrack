"use server"

import { EmailContent, EmailProductInfo, NotificationType } from '@/types';
import nodemailer from 'nodemailer';

const Notification = {
  WELCOME: 'WELCOME',
  CHANGE_OF_STOCK: 'CHANGE_OF_STOCK',
  LOWEST_PRICE: 'LOWEST_PRICE',
  THRESHOLD_MET: 'THRESHOLD_MET',
}

export async function generateEmailBody(
  product: EmailProductInfo,
  type: NotificationType
  ) {
  const THRESHOLD_PERCENTAGE = 40;
  // Shorten the product title
  const shortenedTitle =
    product.title.length > 20
      ? `${product.title.substring(0, 20)}...`
      : product.title;

  // Format price with currency symbol if available
  const formatPrice = (price?: number) => {
    if (price === undefined) return '';
    
    const currency = product.currency || '₹';
    return `${currency}${price.toLocaleString('en-IN')}`;
  };

  // Calculate discount percentage
  const calculateDiscount = () => {
    if (!product.originalPrice || !product.currentPrice || product.originalPrice <= product.currentPrice) {
      return 0;
    }
    
    return Math.round(((product.originalPrice - product.currentPrice) / product.originalPrice) * 100);
  };

  let subject = "";
  let body = "";

  switch (type) {
    case Notification.WELCOME:
      subject = `Price Tracking Confirmed for ${shortenedTitle}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4a4a4a; font-size: 24px; margin-bottom: 10px;">Price Tracking Confirmation</h1>
            <p style="color: #666; font-size: 16px;">You are now tracking this product with PriceWise!</p>
          </div>

          <div style="background-color: #f9f9f9; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; vertical-align: top; width: 30%;">
                  ${product.image ? `<img src="${product.image}" alt="${product.title}" style="max-width: 100%; border-radius: 5px;">` : ''}
                </td>
                <td style="padding: 10px; vertical-align: top;">
                  <h2 style="color: #333; font-size: 18px; margin-top: 0; margin-bottom: 10px;">${product.title}</h2>
                  
                  <div style="margin-bottom: 15px;">
                    <span style="font-size: 20px; font-weight: bold; color: #e03838;">${formatPrice(product.currentPrice)}</span>
                    ${product.originalPrice && product.originalPrice > (product.currentPrice || 0) ? 
                      `<span style="text-decoration: line-through; color: #999; margin-left: 8px;">${formatPrice(product.originalPrice)}</span>
                      <span style="background-color: #e03838; color: white; font-size: 12px; padding: 2px 6px; border-radius: 3px; margin-left: 8px;">-${calculateDiscount()}%</span>` 
                      : ''}
                  </div>
                  
                  <p style="margin-bottom: 15px;">
                    <span style="color: ${product.isOutOfStock ? '#e03838' : '#2e8b57'}; font-weight: bold;">
                      ${product.isOutOfStock ? 'Currently Out of Stock' : 'In Stock'}
                    </span>
                  </p>
                  
                  <a href="${product.url}" style="display: inline-block; background-color: #4285f4; color: white; text-decoration: none; padding: 10px 15px; border-radius: 5px; font-weight: bold;">View Product</a>
                </td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 20px; border-left: 3px solid #4285f4; padding-left: 15px;">
            <h3 style="color: #4285f4; margin-top: 0;">What happens next?</h3>
            <p style="margin-bottom: 10px; color: #666;">We'll monitor this product and send you alerts when:</p>
            <ul style="color: #666; padding-left: 20px;">
              <li>The price drops significantly</li>
              <li>The product comes back in stock (if it's currently unavailable)</li>
              <li>There's a major discount available</li>
            </ul>
          </div>

          <div style="background-color: #f5f8ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #4285f4; margin-top: 0;">Did you know?</h3>
            <p style="color: #666; margin-bottom: 0;">You can track multiple products across Amazon, Flipkart, and Myntra from our website. Sign in to your account to manage all your tracked items in one place.</p>
          </div>

          <div style="text-align: center; font-size: 12px; color: #999; margin-top: 30px;">
            <p>© ${new Date().getFullYear()} PriceWise. All rights reserved.</p>
            <p>If you no longer wish to receive these emails, you can unsubscribe by visiting your account settings.</p>
          </div>
        </div>
      `;
      break;

    case Notification.CHANGE_OF_STOCK:
      subject = `${shortenedTitle} is Now Back in Stock!`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4a4a4a; font-size: 24px; margin-bottom: 10px;">Back in Stock Alert!</h1>
            <p style="color: #666; font-size: 16px;">Good news! A product you're tracking is now available.</p>
          </div>

          <div style="background-color: #f9f9f9; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; vertical-align: top; width: 30%;">
                  ${product.image ? `<img src="${product.image}" alt="${product.title}" style="max-width: 100%; border-radius: 5px;">` : ''}
                </td>
                <td style="padding: 10px; vertical-align: top;">
                  <h2 style="color: #333; font-size: 18px; margin-top: 0; margin-bottom: 10px;">${product.title}</h2>
                  
                  <div style="margin-bottom: 15px;">
                    <span style="font-size: 20px; font-weight: bold; color: #e03838;">${formatPrice(product.currentPrice)}</span>
                    ${product.originalPrice && product.originalPrice > (product.currentPrice || 0) ? 
                      `<span style="text-decoration: line-through; color: #999; margin-left: 8px;">${formatPrice(product.originalPrice)}</span>
                      <span style="background-color: #e03838; color: white; font-size: 12px; padding: 2px 6px; border-radius: 3px; margin-left: 8px;">-${calculateDiscount()}%</span>` 
                      : ''}
                  </div>
                  
                  <p style="margin-bottom: 15px;">
                    <span style="color: #2e8b57; font-weight: bold; background-color: #e8f5e9; padding: 3px 8px; border-radius: 3px;">
                      ✓ Now In Stock
                    </span>
                  </p>
                  
                  <a href="${product.url}" style="display: inline-block; background-color: #4285f4; color: white; text-decoration: none; padding: 10px 15px; border-radius: 5px; font-weight: bold;">View Product</a>
                </td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 20px; border-left: 3px solid #4285f4; padding-left: 15px;">
            <h3 style="color: #4285f4; margin-top: 0;">Act quickly!</h3>
            <p style="color: #666;">Products often sell out rapidly when they come back in stock. Don't miss this opportunity if you've been waiting for this item.</p>
          </div>

          <div style="text-align: center; font-size: 12px; color: #999; margin-top: 30px;">
            <p>© ${new Date().getFullYear()} PriceWise. All rights reserved.</p>
            <p>If you no longer wish to receive these emails, you can unsubscribe by visiting your account settings.</p>
          </div>
        </div>
      `;
      break;

    case Notification.LOWEST_PRICE:
      subject = `Lowest Price Alert: ${shortenedTitle}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4a4a4a; font-size: 24px; margin-bottom: 10px;">Lowest Price Alert!</h1>
            <p style="color: #666; font-size: 16px;">A product you're tracking has reached its lowest price ever!</p>
          </div>

          <div style="background-color: #f9f9f9; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; vertical-align: top; width: 30%;">
                  ${product.image ? `<img src="${product.image}" alt="${product.title}" style="max-width: 100%; border-radius: 5px;">` : ''}
                </td>
                <td style="padding: 10px; vertical-align: top;">
                  <h2 style="color: #333; font-size: 18px; margin-top: 0; margin-bottom: 10px;">${product.title}</h2>
                  
                  <div style="margin-bottom: 15px;">
                    <span style="font-size: 20px; font-weight: bold; color: #e03838;">${formatPrice(product.currentPrice)}</span>
                    ${product.originalPrice && product.originalPrice > (product.currentPrice || 0) ? 
                      `<span style="text-decoration: line-through; color: #999; margin-left: 8px;">${formatPrice(product.originalPrice)}</span>
                      <span style="background-color: #e03838; color: white; font-size: 12px; padding: 2px 6px; border-radius: 3px; margin-left: 8px;">-${calculateDiscount()}%</span>` 
                      : ''}
                  </div>
                  
                  <div style="background-color: #ffe8e8; padding: 8px; border-radius: 5px; margin-bottom: 15px;">
                    <span style="color: #e03838; font-weight: bold;">
                      ★ LOWEST PRICE DETECTED ★
                    </span>
                  </div>
                  
                  <a href="${product.url}" style="display: inline-block; background-color: #4285f4; color: white; text-decoration: none; padding: 10px 15px; border-radius: 5px; font-weight: bold;">View Product</a>
                </td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 20px; border-left: 3px solid #4285f4; padding-left: 15px;">
            <h3 style="color: #4285f4; margin-top: 0;">Why is this important?</h3>
            <p style="color: #666;">This is the lowest price we've ever seen for this product. It might be the perfect time to make your purchase if you've been waiting for a price drop.</p>
          </div>

          <div style="text-align: center; font-size: 12px; color: #999; margin-top: 30px;">
            <p>© ${new Date().getFullYear()} PriceWise. All rights reserved.</p>
            <p>If you no longer wish to receive these emails, you can unsubscribe by visiting your account settings.</p>
          </div>
        </div>
      `;
      break;

    case Notification.THRESHOLD_MET:
      subject = `Big Discount Alert: ${shortenedTitle}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4a4a4a; font-size: 24px; margin-bottom: 10px;">Major Discount Alert!</h1>
            <p style="color: #666; font-size: 16px;">A product you're tracking now has a discount of ${THRESHOLD_PERCENTAGE}% or more!</p>
          </div>

          <div style="background-color: #f9f9f9; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; vertical-align: top; width: 30%;">
                  ${product.image ? `<img src="${product.image}" alt="${product.title}" style="max-width: 100%; border-radius: 5px;">` : ''}
                </td>
                <td style="padding: 10px; vertical-align: top;">
                  <h2 style="color: #333; font-size: 18px; margin-top: 0; margin-bottom: 10px;">${product.title}</h2>
                  
                  <div style="margin-bottom: 15px;">
                    <span style="font-size: 20px; font-weight: bold; color: #e03838;">${formatPrice(product.currentPrice)}</span>
                    ${product.originalPrice && product.originalPrice > (product.currentPrice || 0) ? 
                      `<span style="text-decoration: line-through; color: #999; margin-left: 8px;">${formatPrice(product.originalPrice)}</span>
                      <span style="background-color: #e03838; color: white; font-size: 12px; padding: 2px 6px; border-radius: 3px; margin-left: 8px;">-${calculateDiscount()}%</span>` 
                      : ''}
                  </div>
                  
                  <div style="background-color: #ffe8e8; padding: 8px; border-radius: 5px; margin-bottom: 15px; text-align: center;">
                    <span style="color: #e03838; font-weight: bold; font-size: 16px;">
                      DISCOUNT OVER ${THRESHOLD_PERCENTAGE}% OFF!
                    </span>
                  </div>
                  
                  <a href="${product.url}" style="display: inline-block; background-color: #4285f4; color: white; text-decoration: none; padding: 10px 15px; border-radius: 5px; font-weight: bold;">View Product</a>
                </td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 20px; border-left: 3px solid #4285f4; padding-left: 15px;">
            <h3 style="color: #4285f4; margin-top: 0;">Limited-time opportunity!</h3>
            <p style="color: #666;">Major discounts like this don't typically last long. We recommend checking out the deal soon if you're interested in this product.</p>
          </div>

          <div style="text-align: center; font-size: 12px; color: #999; margin-top: 30px;">
            <p>© ${new Date().getFullYear()} PriceWise. All rights reserved.</p>
            <p>If you no longer wish to receive these emails, you can unsubscribe by visiting your account settings.</p>
          </div>
        </div>
      `;
      break;

    default:
      throw new Error("Invalid notification type.");
  }

  return { subject, body };
}

// Create a transporter with improved configuration for Gmail instead of Outlook
const createTransporter = () => {
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailUser = process.env.EMAIL_USER || 'your-gmail-account@gmail.com';
  
  // Check if email credentials are set
  if (!emailPassword) {
    console.error('EMAIL_PASSWORD environment variable is not set');
    throw new Error('Email configuration error: Missing password');
  }

  if (!emailUser) {
    console.error('EMAIL_USER environment variable is not set');
    throw new Error('Email configuration error: Missing username');
  }

  // Using Gmail SMTP instead of Outlook since Outlook has disabled basic auth
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: emailUser,
      // For Gmail, use an app password instead of your regular password
      // Create one at: https://myaccount.google.com/apppasswords
      pass: emailPassword,
    },
    // Improved error handling
    tls: {
      rejectUnauthorized: false // Helps in development environments
    }
  });
};

export const sendEmail = async (emailContent: EmailContent, sendTo: string[]) => {
  try {
    // Debug information - displaying environment variables (redacted for security)
    console.log('Email configuration:');
    console.log('- EMAIL_USER exists:', !!process.env.EMAIL_USER);
    console.log('- EMAIL_PASSWORD exists:', !!process.env.EMAIL_PASSWORD);
    console.log('- Sending to:', sendTo);
    
    const transporter = createTransporter();
    
    // Check for valid email configuration
    const emailUser = process.env.EMAIL_USER || 'your-gmail-account@gmail.com';
    
    const mailOptions = {
      from: emailUser,
      to: sendTo,
      html: emailContent.body,
      subject: emailContent.subject,
    };

    console.log('Attempting to send email with subject:', emailContent.subject);
    
    // Try to send the email with better error handling
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    console.log('Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      // Check for specific error types
      if (error.message.includes('EAUTH')) {
        console.error('Authentication error - check your email credentials');
      } else if (error.message.includes('ESOCKET')) {
        console.error('Network error - check your internet connection');
      } else if (error.message.includes('ETIMEDOUT')) {
        console.error('Connection timed out - check firewall settings');
      } else if (error.message.includes('550')) {
        console.error('Email rejected - check if the recipient exists');
      }
    }
    
    // Don't throw error to prevent application crashes due to email failures
    // Instead, return error information
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown email error'
    };
  }
}