import { PriceHistoryItem, Product } from "@/types";

const Notification = {
  WELCOME: 'WELCOME',
  CHANGE_OF_STOCK: 'CHANGE_OF_STOCK',
  LOWEST_PRICE: 'LOWEST_PRICE',
  THRESHOLD_MET: 'THRESHOLD_MET',
}

const THRESHOLD_PERCENTAGE = 40;

// Extracts and returns the price from a list of possible elements.
export function extractPrice(...elements: any) {
  for (const element of elements) {
    const priceText = element.text().trim();

    if(priceText) {
      // First, remove all non-digit, non-period, non-comma characters
      const sanitizedPrice = priceText.replace(/[^0-9,.]/g, '');
      
      // Handle Indian number format (e.g., 1,23,456.00)
      // or regular Western format (e.g., 123,456.00)
      let cleanPrice = '';
      
      // Check if this looks like an Indian format price (has comma not at thousands place)
      const isIndianFormat = /\d,\d\d,\d/.test(sanitizedPrice);
      
      if (isIndianFormat) {
        // Remove all commas for Indian format
        cleanPrice = sanitizedPrice.replace(/,/g, '');
      } else {
        // For western format, replace commas with nothing (keep decimals)
        cleanPrice = sanitizedPrice.replace(/,/g, '');
      }
      
      // Handle decimal points
      const decimalMatch = cleanPrice.match(/(\d+)\.(\d+)/);
      if (decimalMatch) {
        // If there's a decimal point, ensure it's properly formatted
        const wholePart = decimalMatch[1];
        const decimalPart = decimalMatch[2];
        
        // Make sure decimal part is not more than 2 digits
        // This handles cases where number has been incorrectly parsed
        const validDecimalPart = decimalPart.substring(0, 2);
        
        // Combine the parts
        cleanPrice = `${wholePart}.${validDecimalPart}`;
      }
      
      // Make sure the result is a reasonable price (protection against parsing errors)
      const numericPrice = parseFloat(cleanPrice);
      if (isNaN(numericPrice) || numericPrice > 1000000) {
        // If price is unreasonably high (over 1 million) or invalid, 
        // it's likely a parsing error - try a different approach
        
        // Try to extract just numbers without any special handling
        const justNumbers = priceText.replace(/[^0-9]/g, '');
        if (justNumbers.length > 0) {
          // If the price appears to be in thousands or less (common for most products)
          if (justNumbers.length <= 5) {
            return justNumbers;
          } else {
            // For larger numbers, make a reasonable guess based on the first 5 digits
            return justNumbers.substring(0, 5);
          }
        }
      }
      
      return cleanPrice;
    }
  }

  return '';
}

// Extracts and returns the currency symbol from an element.
export function extractCurrency(element: any) {
  const currencyText = element.text().trim().slice(0, 1);
  return currencyText ? currencyText : "";
}

// Extracts description from two possible elements from amazon
/*export function extractDescription($: any) {
  // these are possible elements holding description of the product
  const selectors = [
    ".a-unordered-list .a-list-item",
    ".a-expander-content p",
    // Add more selectors here if needed
  ];

  for (const selector of selectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      const textContent = elements
        .map((_: any, element: any) => $(element).text().trim())
        .get()
        .join("\n");
      return textContent;
    }
  }

  // If no matching elements were found, return an empty string
  return "";
}*/
export function extractDescription($: any, maxLength: number = 2000) {
  const selectors = [
    ".a-expander-content p", // Main description selector
    ".a-unordered-list a-vertical a-spacing-mini",
    "#feature-bullets ul li", // Feature bullets selector
    "#productDescription p", // Product description selector
  ];

  let description = "";

  for (const selector of selectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      const textContent = elements
        .map((_: any, element: any) => $(element).text().trim())
        .get()
        .join("\n");

      // Filter out irrelevant content (e.g., warranty, reviews)
      const filteredText = textContent
        .split("\n")
        .filter((line: string | string[]) => !line.includes("warranty") && !line.includes("replacement") && !line.includes("review"))
        .join("\n");

      description += filteredText + "\n";
    }
  }

  // Truncate the description to the specified maxLength
  if (description.length > maxLength) {
    description = description.substring(0, maxLength) + "...";
  }

  return description.trim();
}

export function getHighestPrice(priceList: PriceHistoryItem[]) {
  // Handle empty arrays or undefined input
  if (!priceList || priceList.length === 0) {
    return 0;
  }

  let highestPrice = priceList[0];

  // Ensure the first item exists and has a price property
  if (!highestPrice || typeof highestPrice.price !== 'number') {
    return 0;
  }

  for (let i = 0; i < priceList.length; i++) {
    // Skip any items without a valid price
    if (!priceList[i] || typeof priceList[i].price !== 'number') {
      continue;
    }
    
    if (priceList[i].price > highestPrice.price) {
      highestPrice = priceList[i];
    }
  }

  return highestPrice.price;
}

export function getLowestPrice(priceList: PriceHistoryItem[]) {
  // Handle empty arrays or undefined input
  if (!priceList || priceList.length === 0) {
    return 0;
  }

  let lowestPrice = priceList[0];

  // Ensure the first item exists and has a price property
  if (!lowestPrice || typeof lowestPrice.price !== 'number') {
    return 0;
  }

  for (let i = 0; i < priceList.length; i++) {
    // Skip any items without a valid price
    if (!priceList[i] || typeof priceList[i].price !== 'number') {
      continue;
    }
    
    if (priceList[i].price < lowestPrice.price) {
      lowestPrice = priceList[i];
    }
  }

  return lowestPrice.price;
}

export function getAveragePrice(priceList: PriceHistoryItem[]) {
  // Handle empty arrays or undefined input
  if (!priceList || priceList.length === 0) {
    return 0;
  }

  // Filter out invalid entries before calculating
  const validPriceItems = priceList.filter(
    item => item && typeof item.price === 'number'
  );
  
  if (validPriceItems.length === 0) {
    return 0;
  }

  const sumOfPrices = validPriceItems.reduce((acc, curr) => acc + curr.price, 0);
  const averagePrice = sumOfPrices / validPriceItems.length;

  return averagePrice;
}

export const getEmailNotifType = (
  scrapedProduct: Product,
  currentProduct: Product
) => {
  const lowestPrice = getLowestPrice(currentProduct.priceHistory);

  if (scrapedProduct.currentPrice < lowestPrice) {
    return Notification.LOWEST_PRICE as keyof typeof Notification;
  }
  if (!scrapedProduct.isOutOfStock && currentProduct.isOutOfStock) {
    return Notification.CHANGE_OF_STOCK as keyof typeof Notification;
  }
  if (scrapedProduct.discountRate >= THRESHOLD_PERCENTAGE) {
    return Notification.THRESHOLD_MET as keyof typeof Notification;
  }

  return null;
};

export const formatNumber = (num: number = 0) => {
  // Safety check for unreasonably large numbers (likely parsing errors)
  if (num > 1000000) {
    // If number is unreasonably large, attempt to fix it
    // This handles cases where a price like "54,990" might be parsed as "5499000" or "54990000"
    
    // Try to detect if this is likely an Indian price format issue
    if (num > 10000 && num % 10 === 0) {
      // If number ends in zero(s), it might be a multiplied price
      // Try dividing by powers of 10 until we get a reasonable number
      let divisor = 10;
      while (num / divisor > 100000 && divisor < 1000000) {
        divisor *= 10;
      }
      num = num / divisor;
    } else if (num > 10000) {
      // Another approach: check if it's a concatenation error
      // For example, ₹54,990 might be parsed as 54990 (correct) 
      // but sometimes as 5499000 (extra zeros)
      const numStr = num.toString();
      if (numStr.length > 5) {
        // If it's unusually long, try to extract a reasonable prefix
        num = parseInt(numStr.substring(0, 5));
      }
    }
  }
  
  // Format for Indian locale which uses the lakh/crore system (1,00,000 instead of 100,000)
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    style: 'decimal'
  });
};
