/**
 * ML Utilities for AI Studio
 * Simple statistical functions for forecasting and scoring
 */

export interface DataPoint {
  x: number;
  y: number;
}

/**
 * Calculate linear regression for time series forecasting
 */
export function linearRegression(data: DataPoint[]): {
  slope: number;
  intercept: number;
  predict: (x: number) => number;
} {
  const n = data.length;
  
  if (n === 0) {
    return { slope: 0, intercept: 0, predict: () => 0 };
  }
  
  const sumX = data.reduce((sum, p) => sum + p.x, 0);
  const sumY = data.reduce((sum, p) => sum + p.y, 0);
  const sumXY = data.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = data.reduce((sum, p) => sum + p.x * p.x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return {
    slope,
    intercept,
    predict: (x: number) => slope * x + intercept,
  };
}

/**
 * Calculate moving average for smoothing
 */
export function movingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const values = data.slice(start, i + 1);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    result.push(avg);
  }
  
  return result;
}

/**
 * Calculate Mean Absolute Percentage Error (MAPE)
 */
export function calculateMAPE(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) {
    return 0;
  }
  
  const errors = actual.map((a, i) => {
    if (a === 0) return 0;
    return Math.abs((a - predicted[i]) / a);
  });
  
  const mape = (errors.reduce((sum, e) => sum + e, 0) / errors.length) * 100;
  return Math.round(mape * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate standard deviation for confidence intervals
 */
export function standardDeviation(data: number[]): number {
  const n = data.length;
  if (n === 0) return 0;
  
  const mean = data.reduce((sum, v) => sum + v, 0) / n;
  const variance = data.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  
  return Math.sqrt(variance);
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance);
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Parse location string to coordinates (simplified)
 */
export function parseLocation(location: string): { lat: number; lng: number } | null {
  // Common lithium locations
  const locations: Record<string, { lat: number; lng: number }> = {
    chile: { lat: -33.4489, lng: -70.6693 }, // Santiago
    china: { lat: 39.9042, lng: 116.4074 }, // Beijing
    australia: { lat: -33.8688, lng: 151.2093 }, // Sydney
    argentina: { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
    usa: { lat: 37.7749, lng: -122.4194 }, // San Francisco
  };
  
  const normalized = location.toLowerCase();
  for (const [key, coords] of Object.entries(locations)) {
    if (normalized.includes(key)) {
      return coords;
    }
  }
  
  return null;
}

/**
 * Calculate price volatility (standard deviation / mean)
 */
export function calculateVolatility(prices: number[]): number {
  if (prices.length === 0) return 0;
  
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const stdDev = standardDeviation(prices);
  
  return stdDev / mean;
}
