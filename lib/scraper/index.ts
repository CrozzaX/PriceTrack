"use server"

import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractCurrency, extractDescription, extractPrice } from '../utils';

function generateMockPriceHistory(currentPrice: number, originalPrice: number) {
  const today = new Date();
  const priceHistory = [];
  // Start from 6 months ago
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);
    // Create some price variation
    const variationPercent = Math.random() * 0.4 - 0.2; // -20% to +20% variation
    let price;
    if (i === 0) {
      // Current month uses current price
      price = currentPrice;
    } else if (i === 6) {
      // 6 months ago uses original price
      price = originalPrice;
    } else {
      // Months in between have a gradual transition plus some randomness
      const basePrice = originalPrice + (currentPrice - originalPrice) * ((6 - i) / 6);
      price = basePrice * (1 + variationPercent);
    }
    priceHistory.push({
      price: Number(price.toFixed(2)),
      date: date.toISOString(),
    });
  }
  return priceHistory;

}

export async function scrapeAmazonProduct(url: string) {
  if(!url) return;

  // BrightData proxy configuration
  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);
  const port = 33335;
  const session_id = (1000000 * Math.random()) | 0;

  const options = {
    auth: {
      username: `${username}-session-${session_id}`,
      password,
    },
    host: 'brd.superproxy.io',
    port,
    rejectUnauthorized: false,
    // Set a reasonable limit for redirects to prevent infinite loops
    maxRedirects: 5,
    // Add more browser-like headers to avoid detection
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive',
      'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Referer': 'https://www.google.com/'
    },
    // Set a reasonable timeout
    timeout: 30000,
  }

  try {
    // Direct approach using Axios
    let response;
    try {
      // Try to use the proxy first
      response = await axios.get(url, options);
    } catch (error: any) {
      console.log(`Proxy request failed: ${error.message}`);
      
      // If proxy fails, try a direct request with modified headers but without proxy
      const directOptions = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'Referer': 'https://www.google.com/'
        },
        maxRedirects: 5,
        timeout: 30000
      };
      
      response = await axios.get(url, directOptions);
    }

    if (!response.data) {
      throw new Error('No data received from Amazon');
    }

    const $ = cheerio.load(response.data);

    // Extract the product title
    const title = $('#productTitle').text().trim() || $('.product-title-word-break').text().trim();
    
    if (!title) {
      console.log('Failed to extract title, possible CAPTCHA or page structure change');
      return null;
    }
    
    // Fix: Ensure we're passing strings to extractPrice by getting text content first
    const priceToPayText = $('.priceToPay span.a-price-whole').text().trim();
    const colorBasePriceText = $('.a.size.base.a-color-price').text().trim();
    const selectedButtonPriceText = $('.a-button-selected .a-color-base').text().trim();
    const offscreenPriceText = $('.a-price .a-offscreen').text().trim();
    const ourPriceText = $('#priceblock_ourprice').text().trim();
    const dealPriceText = $('#priceblock_dealprice').text().trim();
    
    const currentPrice = extractPrice(
      priceToPayText || 
      colorBasePriceText || 
      selectedButtonPriceText || 
      offscreenPriceText || 
      ourPriceText || 
      dealPriceText || 
      '0'
    );

    const originalPriceText = $('#priceblock_ourprice').text().trim() || 
                            $('.a-price.a-text-price span.a-offscreen').text().trim() || 
                            $('#listPrice').text().trim() || 
                            $('#priceblock_dealprice').text().trim() || 
                            $('.a-size-base.a-color-price').text().trim() || 
                            '0';
                            
    const originalPrice = extractPrice(originalPriceText);

    const outOfStock = $('#availability span').text().trim().toLowerCase().includes('unavailable') || 
                     $('#availability').text().trim().toLowerCase().includes('out of stock');

    let images = '{}';
    try {
      images = $('#imgBlkFront').attr('data-a-dynamic-image') || 
              $('#landingImage').attr('data-a-dynamic-image') ||
              $('#main-image').attr('data-a-dynamic-image') ||
              '{}';
    } catch (e) {
      console.log('Error parsing image data:', e);
    }

    let imageUrls: string[] = [];
    try {
      imageUrls = Object.keys(JSON.parse(images));
      if (imageUrls.length === 0) {
        // Try alternative selectors if the main ones fail
        const imgSrc = $('img#landingImage').attr('src') || 
                      $('img.a-dynamic-image').attr('src') || 
                      $('img#main-image').attr('src');
        if (imgSrc) {
          imageUrls = [imgSrc];
        }
      }
    } catch (e) {
      console.log('Error extracting image URLs:', e);
      // Try to get any image as fallback
      const imgSrc = $('img#landingImage').attr('src') || $('img.a-dynamic-image').attr('src');
      if (imgSrc) {
        imageUrls = [imgSrc];
      }
    }

    // Fix: Get text content for currency
    const currencyText = $('.a-price-symbol').text().trim();
    const currency = extractCurrency(currencyText) || '₹';
    
    const discountRate = $('.savingsPercentage').text().replace(/[-%]/g, "") || 
                       $('.discountText').text().replace(/[-%]/g, "") || 
                       '0';

    // Fix: Create a proper description string
    const descriptionElements = [
      $('#productDescription').text().trim(),
      $('#feature-bullets').text().trim(),
      $('.a-expander-content').text().trim()
    ].filter(Boolean).join(' ');
    
    const description = extractDescription(descriptionElements);

    const reviewsText = $('#acrCustomerReviewLink #acrCustomerReviewText').first().text().trim() || 
                      $('#acrCustomerReviewText').text().trim();
    const reviewsCountParsed = reviewsText ? parseInt(reviewsText.replace(/[^0-9]/g, '')) : 0;
    console.log("Extracted reviews count from Amazon:", reviewsCountParsed);

    const ratingText = $('a.a-popover-trigger.a-declarative .a-size-base.a-color-base').first().text().trim() || 
                     $('#averageCustomerReviews .a-icon-alt').text().trim().split(' ')[0] || 
                     '0';
    const ratingParsed = ratingText ? parseFloat(ratingText) : 0;
    console.log("Extracted rating from Amazon:", ratingParsed);

    // Parse and validate prices
    // For currentPrice, ensure it's a reasonable value
    let validCurrentPrice = Number(currentPrice) || 0;
    if (validCurrentPrice > 1000000) {
      // If price is unusually large, it might be a parsing error
      console.log(`Warning: Unusually large current price detected: ${validCurrentPrice}. Attempting to fix.`);
      
      // Try to fix by dividing by powers of 10 if ends with zeros
      if (validCurrentPrice % 10 === 0) {
        let divisor = 10;
        while (validCurrentPrice / divisor > 100000 && divisor < 1000000) {
          divisor *= 10;
        }
        validCurrentPrice = validCurrentPrice / divisor;
      } else {
        // Alternative fix: try to parse just first 5 digits
        const priceStr = validCurrentPrice.toString();
        if (priceStr.length > 5) {
          validCurrentPrice = parseInt(priceStr.substring(0, 5));
        }
      }
      console.log(`Fixed current price: ${validCurrentPrice}`);
    }
    
    // For originalPrice, similar validation
    let validOriginalPrice = Number(originalPrice) || validCurrentPrice;
    if (validOriginalPrice > 1000000) {
      console.log(`Warning: Unusually large original price detected: ${validOriginalPrice}. Attempting to fix.`);
      
      // Try to fix by dividing by powers of 10 if ends with zeros
      if (validOriginalPrice % 10 === 0) {
        let divisor = 10;
        while (validOriginalPrice / divisor > 100000 && divisor < 1000000) {
          divisor *= 10;
        }
        validOriginalPrice = validOriginalPrice / divisor;
      } else {
        // Alternative fix: try to parse just first 5 digits
        const priceStr = validOriginalPrice.toString();
        if (priceStr.length > 5) {
          validOriginalPrice = parseInt(priceStr.substring(0, 5));
        }
      }
      console.log(`Fixed original price: ${validOriginalPrice}`);
    }
    
    // Ensure original price is >= current price unless there's a special deal
    if (validOriginalPrice < validCurrentPrice) {
      validOriginalPrice = validCurrentPrice;
    }

    // Construct data object with scraped information
    const data = {
      url,
      currency: currency || '₹',
      image: imageUrls[0] || '',
      title: title || 'Product Title Not Available',
      currentPrice: validCurrentPrice,
      originalPrice: validOriginalPrice,
      priceHistory: [],
      discountRate: Number(discountRate) || 0,
      category: 'category',
      reviewsCount: reviewsCountParsed || 0,
      stars: ratingParsed || 0,
      isOutOfStock: outOfStock,
      description: description || 'No description available',
      lowestPrice: validCurrentPrice,
      highestPrice: validOriginalPrice,
      averagePrice: (validCurrentPrice + validOriginalPrice) / 2,
    }

    return data;
  } catch (error: any) {
    console.log(`Scraping failed for URL ${url}:`, error.message);
    return null;
  }
}

// Updated sanitizeData function with proper syntax and type annotations:
function sanitizeData(obj: any): any {
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return null;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle arrays with explicit any type for items
  if (Array.isArray(obj)) {
    return obj.map((item: any) => sanitizeData(item));
  }

  // Handle plain objects
  if (typeof obj === 'object') {
    const sanitized: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }

  // Return primitive values as-is
  return obj;
}

export async function scrapeFlipkartProduct(url: string) {
  if(!url) return null;

  // BrightData proxy configuration
  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);
  const port = 33335;
  const session_id = (1000000 * Math.random()) | 0;

  const options = {
    auth: {
      username: `${username}-session-${session_id}`,
      password,
    },
    host: 'brd.superproxy.io',
    port,
    rejectUnauthorized: false,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive'
    },
    timeout: 30000,
  };

  try {
    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);
    
    // Image extraction
    let imageUrl = 'https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/placeholder_9951d0.svg';
    const imageSelectors = [
      'img.DByuf4.IZexXJ.jLEJ7H',
      'img.vU5WPQ',
      'img._396cs4._2amPTt._3qGmMb',
      'img._396cs4',
      'img.q6DClP',
      'img.CXW8mj img',
      'img._312yBx img',
      'img.CXW8mj ._396cs4',
      'img[data-src]',
      'img[data-srcset]',
    ];

    for (const selector of imageSelectors) {
      const img = $(selector).first();
      let src = img.attr('src') || img.attr('data-src') || img.attr('data-srcset');
      if (src) {
        if (src.startsWith('//')) {
          src = 'https:' + src;
        }
        if (src.startsWith('http')) {
          imageUrl = src;
          break;
        }
      }
    }

    // Basic product information extraction
    const title = $('.VU-ZEz').text().trim() ||
                 $('.B_NuCI').text().trim() ||
                 $('h1').first().text().trim() ||
                 '';
                   
    const priceText = $('.Nx9bqj.CxhGGd').text().trim() ||
                     $('._30jeq3._16Jk6d').text().trim() ||
                     $('._30jeq3').text().trim() ||
                     '0';
    
    const currentPrice = Number(priceText.replace(/[^0-9.]/g, '')) || 0;
    
    const rating = $('.a-size-base a-color-base').text().trim() || 
                  $('.XQDdHH._1Quie7').text().trim() ||
                  $('._3LWZlK').first().text().trim() ||
                  '0';
                  
    // Updated review count extraction to get only reviews, not ratings
    let reviewsCount = 0;
    const reviewsContainerText = $('.Wphh3N').text().trim(); // e.g.: "18,015 Ratings & 2,007 Reviews"
    if (reviewsContainerText.includes('&')) {
      const parts = reviewsContainerText.split('&');
      const reviewsPart = parts[1].trim(); // e.g.: "2,007 Reviews"
      const matchReviews = reviewsPart.match(/([\d,]+)\s*Reviews/i);
      if (matchReviews) {
        reviewsCount = parseInt(matchReviews[1].replace(/,/g, ''));
      }
    } else {
      const reviewMatch = reviewsContainerText.match(/(\d+)\s*Reviews?/i);
      if (reviewMatch) {
        reviewsCount = parseInt(reviewMatch[1]);
      }
    }
    console.log('Extracted flipkart reviews count:', reviewsCount);
    
    const outOfStock = Boolean($('._16FRp0').length > 0);

    const originalPriceText = $('.yRaY8j.A6\\+E6v').text().trim() ||
                            $('._3I9_wc._2p6lqe').text().trim() ||
                            $('._3I9_wc').text().trim() ||
                            priceText;
                            
    const originalPrice = Number(originalPriceText.replace(/[^0-9.]/g, '')) || currentPrice;

    const discountText = $('._3Ay6Sb._31Dcoz').text().trim() ||
                        $('._3Ay6Sb').text().trim() ||
                        '0';
                        
    const discountRate = Number(discountText.replace(/[^0-9.]/g, '')) || 0;

    // Enhanced description extraction with formatting
    let descriptionSections: string[] = [];

    // Function to clean text while preserving formatting
    const cleanText = (text: string) => {
      return text
        .replace(/\s+/g, ' ')
        .replace(/\.(?=\S)/g, '. ')
        .trim();
    };

    // Function to process a section
    const processSection = (heading: string, content: string) => {
      heading = cleanText(heading);
      content = cleanText(content);
      if (heading && content) {
        return `${heading}\n${content}`;
      }
      return content || heading;
    };

    // Main description section selectors
    const mainDescriptionSelectors = [
      //'.cPHDOP.col-12-12',
      '._1mXcCf.RmoJUa',
      '.RmoJUa',
      '.yN\\+eNk.w9jEaj',
      '.pqHCzB',
    ];

    // Try to find main description sections
    for (const selector of mainDescriptionSelectors) {
      $(selector).each((_, element) => {
        // Look for heading and content structure
        const $element = $(element);
        
        // Find heading if it exists
        const heading = $element.find('._2THx53, ._3qWObK, ._2jM5ln').text().trim();
        
        // Find content
        let content = '';
        $element.find('._3zQGRo, ._2cM9lP, ._3nkT-2, p').each((_, contentEl) => {
          const text = $(contentEl).text().trim();
          if (text) {
            content += (content ? '\n' : '') + text;
          }
        });

        // If no structured content found, use the entire element text
        if (!content) {
          content = $element.text().trim();
          if (heading) {
            content = content.replace(heading, '').trim();
          }
        }

        if (heading || content) {
          const section = processSection(heading, content);
          if (section) {
            descriptionSections.push(section);
          }
        }
      });
    }

    // Features section
    $('._2418kt ul, ._3nkT-2 ul, ._1QHjUL ul').each((_, ul) => {
      const features: string[] = [];
      $(ul).find('li').each((_, li) => {
        const text = $(li).text().trim();
        if (text) features.push(`• ${text}`);
      });
      if (features.length > 0) {
        descriptionSections.push('Features\n' + features.join('\n'));
      }
    });

    // Specifications section
    $('._14cfVK, ._2-riNZ, .X3BRps').each((_, table) => {
      const specs: string[] = [];
      $(table).find('tr, ._3_6Uyw').each((_, row) => {
        const label = $(row).find('td:first-child, ._2k4JXJ').text().trim();
        const value = $(row).find('td:last-child, ._3nkT-2').text().trim();
        if (label && value) {
          specs.push(`${label}: ${value}`);
        }
      });
      if (specs.length > 0) {
        descriptionSections.push('Specifications\n' + specs.join('\n'));
      }
    });

    // If no structured sections found, try alternative content
    if (descriptionSections.length === 0) {
      $('._1mXcCf, ._3nkT-2, .X3BRps').each((_, element) => {
        const text = $(element).text().trim();
        if (text && !descriptionSections.includes(text)) {
          descriptionSections.push(text);
        }
      });
    }

    // Combine sections with proper spacing
    let description = descriptionSections.join('\n\n');

    // If still no description found, use fallback
    if (!description) {
      description = `Product available on Flipkart. Please visit ${url} for more details.`;
    }

    // Create the raw data object
    const rawData = {
      url: String(url),
      currency: '₹',
      image: String(imageUrl),
      title: String(title),
      currentPrice: Number(currentPrice),
      originalPrice: Number(originalPrice),
      priceHistory: [{
        price: Number(currentPrice),
        date: new Date().toISOString()
      }],
      discountRate: Number(discountRate),
      category: 'category',
      reviewsCount: reviewsCount,  // now set using the proper flipkart review count
      stars: Number(rating) || 0,         // now set using the extracted flipkart rating
      isOutOfStock: Boolean(outOfStock),
      description: String(description),
      lowestPrice: Number(currentPrice),
      highestPrice: Number(originalPrice),
      averagePrice: Number((currentPrice + originalPrice) / 2),
    };

    // Sanitize the data
    // const data = sanitizeData(rawData);

    // Validate essential data
    if (!rawData.title || rawData.currentPrice <= 0) {
      throw new Error('Missing essential product data');
    }

    // ...inside scrapeFlipkartProduct, after price extraction and before final data creation, add:
    const ratingElem = $('div.XQDdHH').first();
    const ratingText = ratingElem.contents().filter((_, el) => el.type === 'text').text().trim();
    const ratingParsed = ratingText ? parseFloat(ratingText) : 0;
    console.log("Extracted flipkart rating:", ratingParsed);

    // ...in the final data object for Flipkart, update stars property:
    const finalData = {
      // ...existing properties...
      url,
      currency: '₹',
      image: String(imageUrl),
      title: String(title),
      currentPrice: Number(currentPrice),
      originalPrice: Number(originalPrice),
      priceHistory: [{
        price: Number(currentPrice),
        date: new Date().toISOString()
      }],
      discountRate: Number(discountRate),
      category: 'category',
      reviewsCount: reviewsCount,  // now set using the proper flipkart review count
      stars: ratingParsed,  // now set using the newly extracted flipkart rating
      isOutOfStock: Boolean(outOfStock),
      description: String(description),
      lowestPrice: Number(currentPrice),
      highestPrice: Number(originalPrice),
      averagePrice: Number((currentPrice + originalPrice) / 2),
    };

    return sanitizeData(finalData);

  } catch (error: any) {
    console.log('Error scraping Flipkart product:', {
      error: error.message,
      url,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    
    throw new Error(`Failed to scrape Flipkart product: ${error.message}`);
  }
}

export async function scrapeMyntraProduct(url: string) {
  if (!url) return null;

  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);
  const port = 33335;
  const session_id = (1000000 * Math.random()) | 0;

  const options = {
    auth: { username: `${username}-session-${session_id}`, password },
    host: 'brd.superproxy.io',
    port,
    rejectUnauthorized: false,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...',
      // ...other headers...
    },
    maxRedirects: 5,
    timeout: 30000,
  };

  // Declare variables for prices, title, and description
  let currentPrice = 0;
  let originalPrice = 0;
  let discountRate = 0;
  let title = "";
  let description = "";  // <-- Added declaration for description
  let reviewsCount = 0;  // <-- Added declaration for reviewsCount

  try {
    console.log('Fetching URL:', url);
    const response = await axios.get(url, options);
    console.log('Response Headers:', response.headers);
    console.log('First 500 chars:', response.data.substring(0, 500));
    const $ = cheerio.load(response.data);

    // Extract fullTitle from common selectors
    const fullTitle = $('h1').text().trim() ||
                      $('.pdp-title').text().trim() ||
                      $('title').text().trim();

    // Updated image extraction logic for Myntra using the image-grid-imageContainer

    let imageUrl = "";
    const container = $('.image-grid-imageContainer').first();
    if (container.length) {
      const imageDiv = container.find('.image-grid-image').first();
      const styleAttr = imageDiv.attr('style');
      if (styleAttr) {
        // Use regex that matches quotes correctly
        const regex = /background-image:\s*url\(\s*(['"])(.*?)\1\s*\)/i;
        const match = styleAttr.match(regex);
        if (match && match[2]) {
          imageUrl = match[2].trim();
          console.log('Extracted image URL from container:', imageUrl);
        }
      }
    }
    // Fallback to previous logic if imageUrl is still empty
    if (!imageUrl) {
      const imgSelectors = [
        'img[src*="assets.myntassets.com"]',
        'img[src*="myntra"]',
        '.image-grid-image img',
        '.pdp-image img'
      ];
      for (const selector of imgSelectors) {
        const img = $(selector).first();
        const src = img.attr('src');
        if (src) {
          imageUrl = src;
          console.log('Found fallback image URL:', imageUrl);
          break;
        }
      }
    }

    // Extract prices from the price container
    const priceContainer = $('.pdp-discount-container');
    if (priceContainer.length > 0) {
      // Use DOM to get current price (e.g., <strong>₹863</strong>)
      const currentPriceText = priceContainer.find('.pdp-price strong').text().trim();
      currentPrice = Number(currentPriceText.replace(/[₹,]/g, ''));
      console.log('Found current price from HTML:', currentPrice);

      // Get MRP from <s> tag inside .pdp-mrp
      const mrpText = priceContainer.find('.pdp-mrp s').text().trim();
      originalPrice = Number(mrpText.replace(/[₹,]/g, ''));
      console.log('Found original price from HTML:', originalPrice);

      // Extract discount percentage if available
      const discountText = priceContainer.find('.pdp-discount').text().trim();
      const discountMatch = discountText.match(/(\d+)%/);
      discountRate = discountMatch ? Number(discountMatch[1]) : 0;
      console.log('Found discount rate from HTML:', discountRate);

      // Optional fallback: check verbiage section if needed
      const verbiageSellingPrice = priceContainer
        .find('.pdp-mrp-verbiage-amt')
        .filter((_, el) => $(el).prev().find('b').text() === 'Selling Price')
        .text().trim();
      if (verbiageSellingPrice) {
        const verbiagePrice = Number(verbiageSellingPrice.replace(/[^0-9]/g, ''));
        if (!currentPrice && verbiagePrice) {
          currentPrice = verbiagePrice;
          console.log('Using verbiage selling price:', currentPrice);
        }
      }
    }

    // Try to extract JSON data using string splitting instead of regex
    let productData: any = null;
    $('script').each((_, el) => {
      const content = $(el).html();
      if (content && content.includes('window.__myx =')) {
        const parts = content.split('window.__myx =');
        if (parts[1]) {
          // Try to find the end of the JSON object by locating the first occurrence of "};"
          let jsonText = parts[1];
          const endIndex = jsonText.indexOf('};');
          if (endIndex !== -1) {
            jsonText = jsonText.substring(0, endIndex + 1);
          } else {
            jsonText = jsonText.split(';')[0].trim();
          }
          try {
            const data = JSON.parse(jsonText);
            if (data && data.pdpData) {
              productData = data.pdpData;
              console.log('Extracted product data from JSON:', productData);
              return false; // break loop
            }
          } catch (e) {
            console.log('Error parsing JSON via split:', e);
          }
        }
      }
    });

    // Update JSON prices regardless of HTML extraction,
    // preferring the discounted price if available
    if (productData) {
      const discounted = productData.price?.discounted;
      const mrp = productData.price?.mrp || productData.mrp || 0;
      if (discounted && (currentPrice === 0 || discounted < currentPrice)) {
        currentPrice = discounted;
      }
      if (mrp) {
        originalPrice = mrp;
      }
      title = productData.name || fullTitle;
      console.log('Using JSON prices to override:', { currentPrice, originalPrice, title });
    } else if (fullTitle && !title) {
      title = fullTitle;
    }

    // Calculate discount if possible
    if (originalPrice && currentPrice && originalPrice > currentPrice) {
      discountRate = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }

    // Update detailed product description if available from JSON productDetails
    if (productData && productData.productDetails && Array.isArray(productData.productDetails)) {
      const details = productData.productDetails.map((detail: any) => {
        let text = "";
        if (detail.title) text += detail.title + "\n\n";
        if (detail.description) {
          // Replace HTML <br> tags with newlines
          text += detail.description.replace(/<br\s*\/?>/gi, "\n");
        }
        return text.trim();
      }).filter(Boolean);
      if (details.length > 0) {
        description = details.join("\n\n");
        console.log("Updated description from productDetails:", description);
      }
    }

    // ...after updating JSON prices with productData, add:

    if (productData && productData.media && Array.isArray(productData.media.albums) && productData.media.albums.length > 0) {
      const album = productData.media.albums[0];
      if (album && album.url) {
        imageUrl = album.url;
        console.log("Using media album image from JSON:", imageUrl);
      }
    }

    // ...inside scrapeMyntraProduct, after updating JSON prices with productData...
    if (productData && productData.shoppableLooks && productData.shoppableLooks.src) {
      imageUrl = productData.shoppableLooks.src;
      console.log("Using shoppableLooks image from productData (priority):", imageUrl);
    }

    // Only use the colour image if shoppableLooks image is not available
    if (!imageUrl && productData && productData.colours && productData.colours.length > 0) {
      const color = productData.colours[0];
      if (color.image) {
        imageUrl = color.image;
        console.log("Using colour image from productData as fallback:", imageUrl);
      }
    }

    // ...inside scrapeMyntraProduct, after processing productData and before final data object creation...
    if (productData && productData.ratings && productData.ratings.totalCount) {
      reviewsCount = Number(productData.ratings.totalCount);
      console.log("Using totalCount for reviewsCount:", reviewsCount);
    }
    // ...remaining code...

    // ...inside scrapeMyntraProduct, after extracting prices and before final data object creation...
    const rating = $('.a-size-base a-color-base').text().trim() || 
                   $('.XQDdHH._1Quie7').text().trim() ||
                   $('._3LWZlK').first().text().trim() ||
                   '0';
    console.log("Extracted rating:", rating);
    // ...remaining code...

    const data = {
      url,
      currency: '₹',
      image: imageUrl || 'https://constant.myntassets.com/web/assets/img/MyntraWebSprite_27_01_2021.png',
      title: title || fullTitle || url.split('/').pop()?.split('-').join(' ') || 'Myntra Product',
      currentPrice: currentPrice || 999,
      originalPrice: originalPrice || currentPrice || 999,
      priceHistory: [{ price: currentPrice || 999, date: new Date().toISOString() }],
      discountRate,
      category: 'Fashion',
      reviewsCount: reviewsCount,  // Use totalCount extracted from ratings
      stars: (productData && productData.ratings && productData.ratings.averageRating) ? productData.ratings.averageRating : (Number(rating) || 0),
      isOutOfStock: false,
      description: description || `Product available on Myntra. Please visit ${url} for more details.`,
      lowestPrice: currentPrice || 999,
      highestPrice: originalPrice || (currentPrice * 1.2),
      averagePrice: currentPrice ? (currentPrice + originalPrice) / 2 : 999,
    };

    console.log('Final scraped data:', data);
    return sanitizeData(data);

  } catch (error: any) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data?.substring(0, 1000),
      status: error.response?.status,
      headers: error.response?.headers,
    });
    throw new Error(`Failed to scrape Myntra product: ${error.message}`);
  }
}