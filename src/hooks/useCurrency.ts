/**
 * useCurrency — locale-aware currency formatting hook.
 *
 * Fetches USD-based FX rates (cached 12h via TanStack Query + localStorage)
 * and exposes a `format(usdAmount)` helper that renders canonical USD prices
 * in the user's local currency. Resilient: while rates load or if FX is
 * unavailable, formatting falls back to USD.
 */

import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CURRENCY_CHANGED_EVENT,
  fetchFxRates,
  formatPrice,
  resolveTargetCurrency,
  type SupportedCurrency,
} from '@/lib/currency';

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

export interface UseCurrencyResult {
  /** Active target currency (override -> locale -> USD). */
  currency: SupportedCurrency;
  /** USD-based FX rate map (undefined until loaded). */
  rates: Record<string, number> | undefined;
  /** True while FX rates are loading. */
  isLoading: boolean;
  /** Format a canonical USD amount in the user's currency. */
  format: (usdAmount: number, fractionDigits?: number) => string;
}

export function useCurrency(): UseCurrencyResult {
  // Hold the resolved currency in state so the component re-renders when the
  // preference changes (same-tab via custom event, cross-tab via 'storage').
  const [currency, setCurrency] = useState<SupportedCurrency>(() =>
    resolveTargetCurrency()
  );

  useEffect(() => {
    const reResolve = () => setCurrency(resolveTargetCurrency());
    window.addEventListener(CURRENCY_CHANGED_EVENT, reResolve);
    window.addEventListener('storage', reResolve);
    // Re-resolve once on mount in case the preference changed before subscribe.
    reResolve();
    return () => {
      window.removeEventListener(CURRENCY_CHANGED_EVENT, reResolve);
      window.removeEventListener('storage', reResolve);
    };
  }, []);

  const { data: rates, isLoading } = useQuery({
    queryKey: ['fx-rates', 'USD'],
    queryFn: fetchFxRates,
    staleTime: TWELVE_HOURS,
    gcTime: TWELVE_HOURS,
    refetchOnWindowFocus: false,
  });

  const format = useCallback(
    (usdAmount: number, fractionDigits = 0) =>
      formatPrice(usdAmount, {
        currency,
        rates,
        maximumFractionDigits: fractionDigits,
      }),
    [currency, rates]
  );

  return { currency, rates, isLoading, format };
}
