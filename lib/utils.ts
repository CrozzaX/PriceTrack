import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format number with commas and optional decimal places
export function formatNumber(num: number, decimals: number = 0): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// Extract price from a string (e.g., "$1,299.99" -> 1299.99)
export function extractPrice(text: string): number {
  const match = text.match(/[0-9,]+(\.[0-9]+)?/);
  if (!match) return 0;
  
  // Remove commas and convert to number
  return parseFloat(match[0].replace(/,/g, ''));
}

// Extract currency symbol from a string (e.g., "$1,299.99" -> "$")
export function extractCurrency(text: string): string {
  const match = text.match(/[₹$€£]/);
  return match ? match[0] : '';
}

// Extract product description from HTML content
export function extractDescription(text: string): string {
  // Remove HTML tags and trim whitespace
  return text.replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Get the lowest price from price history
export function getLowestPrice(priceHistory: { price: number }[]): number {
  if (!priceHistory || priceHistory.length === 0) return 0;
  
  return Math.min(...priceHistory.map(item => item.price));
}

// Get the highest price from price history
export function getHighestPrice(priceHistory: { price: number }[]): number {
  if (!priceHistory || priceHistory.length === 0) return 0;
  
  return Math.max(...priceHistory.map(item => item.price));
}

// Get the average price from price history
export function getAveragePrice(priceHistory: { price: number }[]): number {
  if (!priceHistory || priceHistory.length === 0) return 0;
  
  const sum = priceHistory.reduce((acc, item) => acc + item.price, 0);
  return sum / priceHistory.length;
}
