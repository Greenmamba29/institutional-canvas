import { useQuery } from '@tanstack/react-query';
import {
  generatePriceForecast,
  getPriceHistoryWithForecast,
  type ForecastResult,
  type PriceForecast,
} from '@/services/ai/price-forecast.service';

export function usePriceForecast(
  commodity: 'lithium_carbonate' | 'lithium_hydroxide',
  horizon: 30 | 60 | 90 = 30
) {
  return useQuery<ForecastResult>({
    queryKey: ['price-forecast', commodity, horizon],
    queryFn: () => generatePriceForecast(commodity, horizon),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function usePriceHistory(
  commodity: 'lithium_carbonate' | 'lithium_hydroxide',
  horizon: 30 | 60 | 90 = 30
) {
  return useQuery<PriceForecast[]>({
    queryKey: ['price-history-forecast', commodity, horizon],
    queryFn: () => getPriceHistoryWithForecast(commodity, horizon),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
