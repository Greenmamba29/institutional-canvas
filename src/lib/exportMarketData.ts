/**
 * Pure helpers for exporting Market Data from the Data Hub page.
 *
 * Operates on the `PriceData[]` shape returned by the `usePrices()` hook in
 * `@/hooks/useMarketData`. Everything here is framework-agnostic: CSV
 * serialization, summary computation, and a tiny browser download helper.
 */

import type { PriceData } from "@/hooks/useMarketData";

// ----------------------------------------------------------------------------
// CSV primitives
// ----------------------------------------------------------------------------

/** Escape a single CSV cell per RFC 4180 (quote if it contains , " or newline). */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Build a CSV string from a header row and a list of row arrays. */
export function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
  return lines.join("\r\n");
}

// ----------------------------------------------------------------------------
// Full data export
// ----------------------------------------------------------------------------

const FULL_DATA_HEADERS = [
  "Product Type",
  "Purity",
  "Region",
  "Price (USD)",
  "24h Change (%)",
  "Trend",
  "Confidence Score",
  "Updated At",
];

/** Serialize the full set of market price rows to CSV. */
export function buildMarketDataCsv(prices: PriceData[]): string {
  const rows = prices.map((p) => [
    p.product_type,
    p.purity,
    p.region,
    p.price_usd,
    p.price_change_24h,
    p.market_trend,
    p.confidence_score,
    p.updated_at,
  ]);
  return toCsv(FULL_DATA_HEADERS, rows);
}

// ----------------------------------------------------------------------------
// Summary report
// ----------------------------------------------------------------------------

export interface RegionRollup {
  region: string;
  count: number;
  avgPrice: number;
  high: number;
  low: number;
}

export interface MarketDataSummary {
  rowCount: number;
  latestPrice: number;
  latestUpdatedAt: string;
  high: number;
  low: number;
  avgPrice: number;
  avgChange24h: number;
  regions: RegionRollup[];
}

/** Compute summary statistics + per-region rollups from the price rows. */
export function computeMarketDataSummary(prices: PriceData[]): MarketDataSummary {
  const priceValues = prices.map((p) => Number(p.price_usd) || 0);
  const high = priceValues.length ? Math.max(...priceValues) : 0;
  const low = priceValues.length ? Math.min(...priceValues) : 0;
  const sum = priceValues.reduce((a, b) => a + b, 0);
  const avgPrice = priceValues.length ? sum / priceValues.length : 0;

  const changeSum = prices.reduce((a, p) => a + (Number(p.price_change_24h) || 0), 0);
  const avgChange24h = prices.length ? changeSum / prices.length : 0;

  // Rows arrive ordered by updated_at desc, so the first row is the latest.
  const latest = prices[0];

  const byRegion = new Map<string, PriceData[]>();
  for (const p of prices) {
    const key = p.region || "Unknown";
    const bucket = byRegion.get(key);
    if (bucket) bucket.push(p);
    else byRegion.set(key, [p]);
  }

  const regions: RegionRollup[] = Array.from(byRegion.entries()).map(
    ([region, rows]) => {
      const vals = rows.map((r) => Number(r.price_usd) || 0);
      return {
        region,
        count: rows.length,
        avgPrice: vals.reduce((a, b) => a + b, 0) / vals.length,
        high: Math.max(...vals),
        low: Math.min(...vals),
      };
    }
  );

  return {
    rowCount: prices.length,
    latestPrice: latest ? Number(latest.price_usd) || 0 : 0,
    latestUpdatedAt: latest ? latest.updated_at : "",
    high,
    low,
    avgPrice,
    avgChange24h,
    regions,
  };
}

/** Serialize a summary report to a small, human-readable CSV blob. */
export function buildMarketDataSummaryCsv(prices: PriceData[]): string {
  const s = computeMarketDataSummary(prices);
  const round = (n: number) => Math.round(n * 100) / 100;

  const overview = toCsv(
    ["Metric", "Value"],
    [
      ["Generated At", new Date().toISOString()],
      ["Rows", s.rowCount],
      ["Latest Price (USD)", round(s.latestPrice)],
      ["Latest Updated At", s.latestUpdatedAt],
      ["Period High (USD)", round(s.high)],
      ["Period Low (USD)", round(s.low)],
      ["Average Price (USD)", round(s.avgPrice)],
      ["Average 24h Change (%)", round(s.avgChange24h)],
    ]
  );

  const regionTable = toCsv(
    ["Region", "Count", "Avg Price (USD)", "High (USD)", "Low (USD)"],
    s.regions.map((r) => [
      r.region,
      r.count,
      round(r.avgPrice),
      round(r.high),
      round(r.low),
    ])
  );

  // Two labelled sections separated by a blank line.
  return `Market Data Summary\r\n${overview}\r\n\r\nPer-Region Rollup\r\n${regionTable}\r\n`;
}

// ----------------------------------------------------------------------------
// Browser download helper
// ----------------------------------------------------------------------------

/** Trigger a client-side download of `content` as a file named `filename`. */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Build a timestamped filename, e.g. `lithium-market-data-2026-06-10.csv`. */
export function timestampedFilename(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}.csv`;
}
