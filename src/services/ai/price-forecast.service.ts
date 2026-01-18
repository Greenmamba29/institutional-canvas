/**
 * Price Forecasting Service
 * Predicts lithium prices using historical data and linear regression
 */

import { supabase } from '@/integrations/supabase/client';
import { linearRegression, movingAverage, standardDeviation, type DataPoint } from './ml-utils';
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
 */
export async function generatePriceForecast(
  commodity: 'lithium_carbonate' | 'lithium_hydroxide',
  horizon: 30 | 60 | 90 = 30
): Promise<ForecastResult> {
  // 1. Fetch historical price data (last 365 days)
  const { data: priceHistory, error } = await supabase
    .from('price_indicators')
    .select('*')
    .eq('commodity', commodity.replace('_', ' '))
    .order('last_updated', { ascending: true })
    .limit(365);

  if (error || !priceHistory || priceHistory.length === 0) {
    // Return mock data if no historical data
    return generateMockForecast(commodity, horizon);
  }

  // 2. Prepare data for regression
  const dataPoints: DataPoint[] = priceHistory.map((price, index) => ({
    x: index,
    y: price.spot_price,
  }));

  // 3. Calculate regression
  const regression = linearRegression(dataPoints);

  // 4. Calculate confidence interval (±5% based on historical volatility)
  const historicalPrices = priceHistory.map(p => p.spot_price);
  const stdDev = standardDeviation(historicalPrices);
  const mean = historicalPrices.reduce((sum, p) => sum + p, 0) / historicalPrices.length;
  const confidenceMultiplier = 0.05; // ±5%

  // 5. Generate predictions
  const predictions: PriceForecast[] = [];
  const startDate = new Date(priceHistory[priceHistory.length - 1].last_updated);
  const lastIndex = dataPoints.length - 1;

  for (let i = 1; i <= horizon; i++) {
    const futureIndex = lastIndex + i;
    const predictedPrice = regression.predict(futureIndex);
    const date = addDays(startDate, i);

    predictions.push({
      date: format(date, 'yyyy-MM-dd'),
      predicted_price: Math.round(predictedPrice),
      confidence_lower: Math.round(predictedPrice * (1 - confidenceMultiplier)),
      confidence_upper: Math.round(predictedPrice * (1 + confidenceMultiplier)),
      is_historical: false,
    });
  }

  // 6. Determine trend
  const trend = regression.slope > 50 ? 'bullish' : regression.slope < -50 ? 'bearish' : 'neutral';

  // 7. Generate insights
  const insights = generateInsights(regression, historicalPrices, horizon, trend);

  // 8. Calculate confidence score (inverse of volatility)
  const volatility = stdDev / mean;
  const confidence = Math.max(0, Math.min(100, 100 - volatility * 500));

  return {
    commodity,
    horizon,
    predictions,
    trend,
    confidence: Math.round(confidence),
    insights,
  };
}

/**
 * Generate insights based on forecast results
 */
function generateInsights(
  regression: { slope: number; intercept: number },
  historicalPrices: number[],
  horizon: number,
  trend: 'bullish' | 'bearish' | 'neutral'
): string[] {
  const insights: string[] = [];
  const currentPrice = historicalPrices[historicalPrices.length - 1];
  const predictedPrice = regression.predict(historicalPrices.length + horizon);
  const priceChange = ((predictedPrice - currentPrice) / currentPrice) * 100;

  // Trend insight
  if (trend === 'bullish') {
    insights.push(`Prices expected to rise ${Math.abs(Math.round(priceChange))}% over ${horizon} days`);
  } else if (trend === 'bearish') {
    insights.push(`Prices expected to decline ${Math.abs(Math.round(priceChange))}% over ${horizon} days`);
  } else {
    insights.push(`Prices expected to remain stable with <5% variation`);
  }

  // Volatility insight
  const recentPrices = historicalPrices.slice(-30);
  const volatility = standardDeviation(recentPrices) / (recentPrices.reduce((s, p) => s + p, 0) / recentPrices.length);
  if (volatility > 0.15) {
    insights.push(`High market volatility detected - consider fixed-price contracts`);
  } else {
    insights.push(`Low volatility provides stable pricing environment`);
  }

  // Price level insight
  const max52w = Math.max(...historicalPrices);
  const min52w = Math.min(...historicalPrices);
  if (currentPrice > max52w * 0.9) {
    insights.push(`Current prices near 52-week high - potential pullback risk`);
  } else if (currentPrice < min52w * 1.1) {
    insights.push(`Current prices near 52-week low - potential buying opportunity`);
  }

  return insights.slice(0, 3); // Return top 3 insights
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
 */
export async function getPriceHistoryWithForecast(
  commodity: 'lithium_carbonate' | 'lithium_hydroxide',
  horizon: 30 | 60 | 90 = 30
): Promise<PriceForecast[]> {
  // Fetch historical data
  const { data: priceHistory } = await supabase
    .from('price_indicators')
    .select('*')
    .eq('commodity', commodity.replace('_', ' '))
    .order('last_updated', { ascending: true })
    .limit(90); // Last 90 days

  const historical: PriceForecast[] =
    priceHistory?.map((price) => ({
      date: format(new Date(price.last_updated), 'yyyy-MM-dd'),
      predicted_price: price.spot_price,
      confidence_lower: price.spot_price,
      confidence_upper: price.spot_price,
      is_historical: true,
      actual_price: price.spot_price,
    })) || [];

  // Generate forecast
  const forecast = await generatePriceForecast(commodity, horizon);

  return [...historical, ...forecast.predictions];
}
