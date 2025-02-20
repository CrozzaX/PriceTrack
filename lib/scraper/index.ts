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
  }

  try {
    // Fetch the product page
    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);

    // Extract the product title
    const title = $('#productTitle').text().trim();
    const currentPrice = extractPrice(
      $('.priceToPay span.a-price-whole'),
      $('.a.size.base.a-color-price'),
      $('.a-button-selected .a-color-base'),
    );

    const originalPrice = extractPrice(
      $('#priceblock_ourprice'),
      $('.a-price.a-text-price span.a-offscreen'),
      $('#listPrice'),
      $('#priceblock_dealprice'),
      $('.a-size-base.a-color-price')
    );

    const outOfStock = $('#availability span').text().trim().toLowerCase() === 'currently unavailable';

    const images = 
      $('#imgBlkFront').attr('data-a-dynamic-image') || 
      $('#landingImage').attr('data-a-dynamic-image') ||
      '{}'

    const imageUrls = Object.keys(JSON.parse(images));

    const currency = extractCurrency($('.a-price-symbol'))
    const discountRate = $('.savingsPercentage').text().replace(/[-%]/g, "");

    //const description = extractDescription($)
    const description = extractDescription($); // Truncate to 200 characters

    // Construct data object with scraped information
    const data = {
      url,
      currency: currency || '$',
      image: imageUrls[0],
      title,
      currentPrice: Number(currentPrice) || Number(originalPrice),
      originalPrice: Number(originalPrice) || Number(currentPrice),
      priceHistory: [],
      discountRate: Number(discountRate),
      category: 'category',
      reviewsCount:100,
      stars: 4.5,
      isOutOfStock: outOfStock,
      description,
      lowestPrice: Number(currentPrice) || Number(originalPrice),
      highestPrice: Number(originalPrice) || Number(currentPrice),
      averagePrice: Number(currentPrice)/2 + Number(originalPrice)/2,
    }

    return data;
  } catch (error: any) {
    console.log(error);
  }
}

// Helper function to ensure objects are serializable
function sanitizeData(obj: any): any {
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return null;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeData(item));
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
    
    const rating = $('.XQDdHH._1Quie7').text().trim() ||
                  $('._3LWZlK').first().text().trim() ||
                  '0';
                  
    const reviewsCountText = $('.Wphh3N').text().trim() ||
                           $('._2_R_DZ').text().trim() ||
                           '0';
                           
    const reviewsCount = Number(reviewsCountText.match(/\d+/)?.[0]) || 0;
    
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
      reviewsCount: Number(reviewsCount),
      stars: Number(rating) || 0,
      isOutOfStock: Boolean(outOfStock),
      description: String(description),
      lowestPrice: Number(currentPrice),
      highestPrice: Number(originalPrice),
      averagePrice: Number((currentPrice + originalPrice) / 2),
    };

    // Sanitize the data
    const data = sanitizeData(rawData);

    // Validate essential data
    if (!data.title || data.currentPrice <= 0) {
      throw new Error('Missing essential product data');
    }

    return data;

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