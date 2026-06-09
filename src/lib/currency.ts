/**
 * Locale-aware currency display.
 *
 * Prices are stored canonically in USD (price_indicators.price = USD).
 * This module detects the user's preferred currency from their browser
 * locale (overridable via localStorage), fetches USD->X FX rates from a
 * keyless public API, and formats USD amounts in the target currency.
 *
 * Resilient by design: if FX data is unavailable we fall back to USD
 * formatting so the UI never breaks.
 */

export const FX_API_URL = 'https://open.er-api.com/v6/latest/USD';

const PREFERRED_CURRENCY_KEY = 'preferredCurrency';
const FX_CACHE_KEY = 'fxRatesUSD';
const FX_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

/** Currencies we actively map locales to. Others default to USD. */
export type SupportedCurrency = 'USD' | 'CNY' | 'EUR' | 'GBP' | 'JPY';

/** Currencies offered in the manual override UI. */
export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  'USD', 'EUR', 'GBP', 'CNY', 'JPY',
];

/** Event fired (same-tab) whenever the preferred currency changes. */
export const CURRENCY_CHANGED_EVENT = 'lb:currency-changed';

interface FxCache {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
}

// Eurozone country/language subtags -> EUR.
const EUROZONE_LANGS = new Set([
  'de', 'fr', 'es', 'it', 'nl', 'pt', 'el', 'fi', 'ga', 'et',
  'lv', 'lt', 'sk', 'sl', 'mt',
]);

/**
 * Map a BCP-47 locale string (e.g. navigator.language) to a target
 * currency code. Falls back to USD for anything unrecognized.
 */
export function currencyFromLocale(locale: string | undefined | null): SupportedCurrency {
  if (!locale) return 'USD';
  const lc = locale.toLowerCase();
  const [lang, region] = lc.split('-');

  // Region-specific overrides first.
  if (region === 'cn') return 'CNY';
  if (region === 'gb') return 'GBP';
  if (region === 'jp') return 'JPY';
  if (region === 'us') return 'USD';

  // Language-level mapping.
  if (lang === 'zh') return 'CNY';
  if (lang === 'ja') return 'JPY';
  if (lang === 'en') return 'USD';
  if (EUROZONE_LANGS.has(lang)) return 'EUR';

  return 'USD';
}

/** Resolve the active currency: explicit override -> locale -> USD. */
export function resolveTargetCurrency(): SupportedCurrency {
  try {
    const override = localStorage.getItem(PREFERRED_CURRENCY_KEY);
    if (override) return override as SupportedCurrency;
  } catch {
    /* localStorage may be unavailable (SSR / privacy mode) */
  }
  const locale =
    typeof navigator !== 'undefined' ? navigator.language : undefined;
  return currencyFromLocale(locale);
}

/** Persist a manual currency override (or clear it when null). */
export function setPreferredCurrency(currency: SupportedCurrency | null): void {
  try {
    if (currency) localStorage.setItem(PREFERRED_CURRENCY_KEY, currency);
    else localStorage.removeItem(PREFERRED_CURRENCY_KEY);
  } catch {
    /* ignore */
  }
  // Notify listeners in this tab (storage event only fires cross-tab).
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(CURRENCY_CHANGED_EVENT));
    }
  } catch {
    /* ignore */
  }
}

function readCache(): FxCache | null {
  try {
    const raw = localStorage.getItem(FX_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FxCache;
    if (!parsed?.rates || typeof parsed.fetchedAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(cache: FxCache): void {
  try {
    localStorage.setItem(FX_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

/**
 * Fetch USD-based FX rates, using a localStorage cache with a daily TTL.
 * Returns a map keyed by ISO currency code (always includes USD = 1).
 * Falls back to stale cache, then to USD-only, on any failure.
 */
export async function fetchFxRates(): Promise<Record<string, number>> {
  const cached = readCache();
  const fresh =
    cached && Date.now() - cached.fetchedAt < FX_TTL_MS ? cached : null;
  if (fresh) return fresh.rates;

  try {
    const res = await fetch(FX_API_URL);
    if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
    const json = await res.json();
    if (json?.result !== 'success' || !json?.rates) {
      throw new Error('FX response malformed');
    }
    const rates: Record<string, number> = { ...json.rates, USD: 1 };
    writeCache({ base: 'USD', rates, fetchedAt: Date.now() });
    return rates;
  } catch {
    // Fall back to stale cache if we have it, else USD only.
    if (cached?.rates) return cached.rates;
    return { USD: 1 };
  }
}

interface FormatOptions {
  /** Override the target currency. Defaults to resolveTargetCurrency(). */
  currency?: string;
  /** FX rates map (USD base). When absent, no conversion (USD assumed). */
  rates?: Record<string, number>;
  /** Locale for number formatting. Defaults to navigator.language / en-US. */
  locale?: string;
  /** Intl.NumberFormat overrides. */
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
}

/**
 * Format a canonical USD amount in the user's currency.
 * Converts usdAmount * rate[currency], then renders with
 * Intl.NumberFormat. Falls back to USD formatting if the rate
 * is missing or invalid.
 */
export function formatPrice(usdAmount: number, options: FormatOptions = {}): string {
  const locale =
    options.locale ??
    (typeof navigator !== 'undefined' ? navigator.language : 'en-US');

  let currency = (options.currency ?? resolveTargetCurrency()).toUpperCase();
  const rates = options.rates;
  const rate = rates?.[currency];

  let amount = usdAmount;
  if (currency !== 'USD') {
    if (rate && Number.isFinite(rate) && rate > 0) {
      amount = usdAmount * rate;
    } else {
      // No usable rate -> fall back to USD so we never show wrong values.
      currency = 'USD';
    }
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: options.maximumFractionDigits ?? 0,
      minimumFractionDigits: options.minimumFractionDigits ?? 0,
    }).format(amount);
  } catch {
    // Unknown currency code or locale -> plain USD fallback.
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: options.maximumFractionDigits ?? 0,
    }).format(usdAmount);
  }
}
