/**
 * Price Forecasting Service
 * Predicts lithium prices using mock data for demo
 * In production, would integrate with real price feeds
 */

import { addDays, format } from 'date-fns';

export interface PriceForecast {
  date: string;
  predicted_price: number;
  confidence_lower: number;
  confidence_upper: number;
  is_historical?: boolean;
  actual_price?: number;
}

export interface ForecastResult {
  commodity: string;
  horizon: number;
  predictions: PriceForecast[];
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-100
  insights: string[];
}

/**
 * Generate price forecast for a given commodity
 * Uses mock data for demo - in production would use ML models
 */
export async function generatePriceForecast(
  commodity: 'lithium_carbonate' | 'lithium_hydroxide',
  horizon: 30 | 60 | 90 = 30
): Promise<ForecastResult> {
  // For demo, always return mock forecast
  return generateMockForecast(commodity, horizon);
}

/**
 * Generate mock forecast data for demo purposes
 */
function generateMockForecast(
  commodity: string,
  horizon: number
): ForecastResult {
  const basePrice = commodity.includes('carbonate') ? 66500 : 68000;
  const predictions: PriceForecast[] = [];
  const startDate = new Date();

  for (let i = 1; i <= horizon; i++) {
    const randomVariation = (Math.random() - 0.5) * 2000; // ±$1000 variation
    const trendAdjustment = i * 50; // Slight upward trend
    const price = Math.round(basePrice + trendAdjustment + randomVariation);

    predictions.push({
      date: format(addDays(startDate, i), 'yyyy-MM-dd'),
      predicted_price: price,
      confidence_lower: Math.round(price * 0.95),
      confidence_upper: Math.round(price * 1.05),
      is_historical: false,
    });
  }

  return {
    commodity,
    horizon,
    predictions,
    trend: 'bullish',
    confidence: 75,
    insights: [
      `Prices trending upward with moderate confidence`,
      `Market conditions remain stable`,
      `Consider locking in prices for Q1 procurement`,
    ],
  };
}

/**
 * Get historical prices with predictions for chart
 * Returns mock data for demo
 */
export async function getPriceHistoryWithForecast(
  commodity: 'lithium_carbonate' | 'lithium_hydroxide',
  horizon: 30 | 60 | 90 = 30
): Promise<PriceForecast[]> {
  const basePrice = commodity.includes('carbonate') ? 66500 : 68000;
  const startDate = new Date();
  
  // Generate 60 days of "historical" data
  const historical: PriceForecast[] = [];
  for (let i = 60; i > 0; i--) {
    const randomVariation = (Math.random() - 0.5) * 3000;
    const price = Math.round(basePrice - (i * 30) + randomVariation);
    historical.push({
      date: format(addDays(startDate, -i), 'yyyy-MM-dd'),
      predicted_price: price,
      confidence_lower: price,
      confidence_upper: price,
      is_historical: true,
      actual_price: price,
    });
  }

  // Generate forecast
  const forecast = await generatePriceForecast(commodity, horizon);

  return [...historical, ...forecast.predictions];
}
